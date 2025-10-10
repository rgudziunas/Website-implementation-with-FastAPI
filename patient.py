# patients.py
from datetime import datetime
from typing import Optional, List, Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, EmailStr, ConfigDict
from sqlalchemy.orm import Session

import models
from database import SessionLocal

router = APIRouter(prefix="/api/patients", tags=["patients"])

# --- DB dependency ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

DBSession = Annotated[Session, Depends(get_db)]

# --- helper (replace with proper hashing e.g., passlib[bcrypt]) ---
def hash_password(raw: str) -> str:
    # TODO: use passlib to hash; placeholder:
    return raw

# --- Schemas (now include username/password for create/update; never expose password) ---
class PatientBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    birth_date: Optional[str] = None  # "YYYY-MM-DD"

class PatientCreate(PatientBase):
    username: str
    password: str

class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    birth_date: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None

class PatientOut(PatientBase):
    id: int
    username: str
    model_config = ConfigDict(from_attributes=True)

class AppointmentOut(BaseModel):
    id: int
    start_at: datetime
    end_at: datetime
    status: models.AppointmentStatus
    notes: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# --- Endpointai (5 vnt. + hierarchinis) ---

# LIST
@router.get("", response_model=List[PatientOut], status_code=status.HTTP_200_OK)
def list_patients(db: DBSession):
    return db.query(models.Patient).order_by(models.Patient.id.asc()).all()

# GET by id
@router.get("/{patient_id}", response_model=PatientOut, status_code=status.HTTP_200_OK)
def get_patient(patient_id: int, db: DBSession):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

# CREATE
@router.post("", response_model=PatientOut, status_code=status.HTTP_201_CREATED)
def create_patient(payload: PatientCreate, db: DBSession):
    # unique checks
    if db.query(models.Patient).filter(models.Patient.username == payload.username).first():
        raise HTTPException(status_code=422, detail="Username already taken")
    if db.query(models.Patient).filter(models.Patient.email == payload.email).first():
        raise HTTPException(status_code=422, detail="Email already in use")

    patient = models.Patient(
        username=payload.username,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        birth_date=payload.birth_date,
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient

# UPDATE
@router.put("/{patient_id}", response_model=PatientOut, status_code=status.HTTP_200_OK)
def update_patient(patient_id: int, payload: PatientUpdate, db: DBSession):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    data = payload.dict(exclude_unset=True)

    # handle username uniqueness
    new_username = data.get("username")
    if new_username and new_username != patient.username:
        if db.query(models.Patient).filter(models.Patient.username == new_username).first():
            raise HTTPException(status_code=422, detail="Username already taken")
        patient.username = new_username

    # handle email uniqueness
    new_email = data.get("email")
    if new_email and new_email != patient.email:
        if db.query(models.Patient).filter(models.Patient.email == new_email).first():
            raise HTTPException(status_code=422, detail="Email already in use")
        patient.email = new_email

    # optional fields
    if "full_name" in data: patient.full_name = data["full_name"]
    if "phone" in data: patient.phone = data["phone"]
    if "birth_date" in data: patient.birth_date = data["birth_date"]

    # password update
    if "password" in data and data["password"]:
        patient.password_hash = hash_password(data["password"])

    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient

# DELETE
@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(patient_id: int, db: DBSession):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    db.delete(patient)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# HIERARCHINIS: visi konkretaus paciento vizitai
@router.get(
    "/{patient_id}/appointments",
    response_model=List[AppointmentOut],
    status_code=status.HTTP_200_OK,
)
def list_patient_appointments(patient_id: int, db: DBSession):
    if not db.query(models.Patient.id).filter(models.Patient.id == patient_id).first():
        raise HTTPException(status_code=404, detail="Patient not found")
    appts = (
        db.query(models.Appointment)
        .filter(models.Appointment.patient_id == patient_id)
        .order_by(models.Appointment.start_at.asc())
        .all()
    )
    return appts
