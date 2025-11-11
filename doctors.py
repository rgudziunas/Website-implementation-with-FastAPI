# doctors.py
from typing import List, Optional, Annotated
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, EmailStr
from sqlalchemy.orm import Session

import models
from database import SessionLocal

router = APIRouter(prefix="/api/doctors", tags=["doctors"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

DBSession = Annotated[Session, Depends(get_db)]


from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional, List, Annotated
import models

class DoctorBase(BaseModel):
    full_name: str
    specialization: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    active: Optional[bool] = True
    role: models.DoctorRole = models.DoctorRole.main  

class DoctorCreate(DoctorBase):
    pass

class DoctorUpdate(BaseModel):
    full_name: Optional[str] = None
    specialization: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    active: Optional[bool] = None
    role: Optional[models.DoctorRole] = None          

class DoctorOut(DoctorBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class AppointmentBrief(BaseModel):
    id: int
    patient_id: int
    start_at: datetime
    end_at: datetime
    status: models.AppointmentStatus
    model_config = ConfigDict(from_attributes=True)

@router.get("", response_model=List[DoctorOut], status_code=status.HTTP_200_OK)
def list_doctors(db: DBSession):
    return db.query(models.Doctor).order_by(models.Doctor.full_name.asc()).all()

@router.get("/{doctor_id}", response_model=DoctorOut, status_code=status.HTTP_200_OK)
def get_doctor(doctor_id: int, db: DBSession):
    doctor = db.query(models.Doctor).filter(models.Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(404, "Doctor not found")
    return doctor

@router.post("", response_model=DoctorOut, status_code=status.HTTP_201_CREATED)
def create_doctor(payload: DoctorCreate, db: DBSession):
    if payload.email:
        if db.query(models.Doctor).filter(models.Doctor.email == payload.email).first():
            raise HTTPException(422, "Email already in use")
    doc = models.Doctor(**payload.dict())
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc

@router.put("/{doctor_id}", response_model=DoctorOut, status_code=status.HTTP_200_OK)
def update_doctor(doctor_id: int, payload: DoctorUpdate, db: DBSession):
    doc = db.query(models.Doctor).filter(models.Doctor.id == doctor_id).first()
    if not doc:
        raise HTTPException(404, "Doctor not found")

    data = payload.dict(exclude_unset=True)
    if "email" in data and data["email"] and data["email"] != doc.email:
        if db.query(models.Doctor).filter(models.Doctor.email == data["email"]).first():
            raise HTTPException(422, "Email already in use")

    for k, v in data.items():
        setattr(doc, k, v)

    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc

@router.delete("/{doctor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_doctor(doctor_id: int, db: DBSession):
    doc = db.query(models.Doctor).filter(models.Doctor.id == doctor_id).first()
    if not doc:
        raise HTTPException(404, "Doctor not found")
    db.delete(doc)
    db.commit()
    return


@router.get("/{doctor_id}/appointments", response_model=List[AppointmentBrief])
def list_doctor_appointments(doctor_id: int, db: DBSession):
    if not db.query(models.Doctor.id).filter(models.Doctor.id == doctor_id).first():
        raise HTTPException(404, "Doctor not found")

    appts = (
        db.query(models.Appointment)
        .join(models.AppointmentDoctor, models.AppointmentDoctor.appointment_id == models.Appointment.id)
        .filter(models.AppointmentDoctor.doctor_id == doctor_id)
        .order_by(models.Appointment.start_at.asc())
        .all()
    )
    return appts


class ServiceBrief(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    price: float
    model_config = ConfigDict(from_attributes=True)

@router.get("/{doctor_id}/services", response_model=List[ServiceBrief], status_code=status.HTTP_200_OK)
def list_doctor_services(doctor_id: int, db: DBSession):
    """Get all services that a doctor can perform"""
    doctor = db.query(models.Doctor).filter(models.Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(404, "Doctor not found")
    
    services = (
        db.query(models.Service)
        .join(models.DoctorService, models.DoctorService.service_id == models.Service.id)
        .filter(models.DoctorService.doctor_id == doctor_id)
        .order_by(models.Service.name.asc())
        .all()
    )
    return services


# Add to doctors.py

class LinkServiceIn(BaseModel):
    service_id: int

@router.post("/{doctor_id}/services/link", status_code=status.HTTP_201_CREATED)
def link_service_to_doctor(doctor_id: int, payload: LinkServiceIn, db: DBSession):
    """Link a service to a doctor"""
    doctor = db.query(models.Doctor).filter(models.Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(404, "Doctor not found")
    
    service = db.query(models.Service).filter(models.Service.id == payload.service_id).first()
    if not service:
        raise HTTPException(404, "Service not found")
    
    # Check if link already exists
    exists = db.query(models.DoctorService).filter(
        models.DoctorService.doctor_id == doctor_id,
        models.DoctorService.service_id == payload.service_id
    ).first()
    
    if exists:
        raise HTTPException(422, "Service already linked to this doctor")
    
    link = models.DoctorService(doctor_id=doctor_id, service_id=payload.service_id)
    db.add(link)
    db.commit()
    return {"message": "Service linked successfully"}

@router.delete("/{doctor_id}/services/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def unlink_service_from_doctor(doctor_id: int, service_id: int, db: DBSession):
    """Unlink a service from a doctor"""
    link = db.query(models.DoctorService).filter(
        models.DoctorService.doctor_id == doctor_id,
        models.DoctorService.service_id == service_id
    ).first()
    
    if not link:
        raise HTTPException(404, "Service link not found")
    
    db.delete(link)
    db.commit()
    return