#patient.py
from datetime import datetime
from typing import Optional, List, Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from sqlalchemy.orm import Session
from auth import hash_password, get_current_admin, get_authenticated_user

import models
from database import SessionLocal

router = APIRouter(prefix="/api/patients", tags=["patients"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

DBSession = Annotated[Session, Depends(get_db)]


class PatientBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    birth_date: Optional[str] = None  

class PatientCreate(PatientBase):
    username: str
    password: str
    
    @field_validator('password')
    @classmethod
    def password_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('Password cannot be empty')
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v
    
    @field_validator('username')
    @classmethod
    def username_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('Username cannot be empty')
        return v

class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    birth_date: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    
    @field_validator('password')
    @classmethod
    def password_not_empty_if_provided(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and (not v or not v.strip()):
            raise ValueError('Password cannot be empty if provided')
        if v is not None and len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v

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


@router.get("", response_model=List[PatientOut], status_code=status.HTTP_200_OK)
def list_patients(
    db: DBSession,
    current_admin: Annotated[models.Admin, Depends(get_current_admin)]
):
    """List all patients - Admin only"""
    return db.query(models.Patient).order_by(models.Patient.id.asc()).all()


@router.get("/{patient_id}", response_model=PatientOut, status_code=status.HTTP_200_OK)
def get_patient(
    patient_id: int,
    db: DBSession,
    current_user: Annotated[models.Admin | models.Patient, Depends(get_authenticated_user)]
):
    """Get patient - Patients can see their own profile, admins can see all"""
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # If patient, they can only see their own profile
    if hasattr(current_user, 'role') and current_user.role == 'patient':
        if patient.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access your own profile"
            )

    return patient


@router.post("", response_model=PatientOut, status_code=status.HTTP_201_CREATED)
def create_patient(payload: PatientCreate, db: DBSession):
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

@router.put("/{patient_id}", response_model=PatientOut, status_code=status.HTTP_200_OK)
def update_patient(
    patient_id: int,
    payload: PatientUpdate,
    db: DBSession,
    current_user: Annotated[models.Admin | models.Patient, Depends(get_authenticated_user)]
):
    """Update patient - Patients can update their own profile, admins can update all"""
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # If patient, they can only update their own profile
    if hasattr(current_user, 'role') and current_user.role == 'patient':
        if patient.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own profile"
            )

    data = payload.dict(exclude_unset=True)

    new_username = data.get("username")
    if new_username and new_username != patient.username:
        if db.query(models.Patient).filter(models.Patient.username == new_username).first():
            raise HTTPException(status_code=422, detail="Username already taken")
        patient.username = new_username

    new_email = data.get("email")
    if new_email and new_email != patient.email:
        if db.query(models.Patient).filter(models.Patient.email == new_email).first():
            raise HTTPException(status_code=422, detail="Email already in use")
        patient.email = new_email

    if "full_name" in data: patient.full_name = data["full_name"]
    if "phone" in data: patient.phone = data["phone"]
    if "birth_date" in data: patient.birth_date = data["birth_date"]

    if "password" in data and data["password"]:
        patient.password_hash = hash_password(data["password"])

    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(
    patient_id: int,
    db: DBSession,
    current_admin: Annotated[models.Admin, Depends(get_current_admin)]
):
    """Delete patient - Admin only"""
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    db.delete(patient)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/{patient_id}/appointments",
    response_model=List[AppointmentOut],
    status_code=status.HTTP_200_OK,
)
def list_patient_appointments(
    patient_id: int,
    db: DBSession,
    current_user: Annotated[models.Admin | models.Patient, Depends(get_authenticated_user)]
):
    """Get patient appointments - Patients can see their own, admins can see all"""
    if not db.query(models.Patient.id).filter(models.Patient.id == patient_id).first():
        raise HTTPException(status_code=404, detail="Patient not found")

    # If patient, they can only see their own appointments
    if hasattr(current_user, 'role') and current_user.role == 'patient':
        if patient_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access your own appointments"
            )

    appts = (
        db.query(models.Appointment)
        .filter(models.Appointment.patient_id == patient_id)
        .order_by(models.Appointment.start_at.asc())
        .all()
    )
    return appts