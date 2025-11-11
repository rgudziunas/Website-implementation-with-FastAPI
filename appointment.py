# appointments.py
from datetime import datetime
from typing import Optional, List, Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, ConfigDict, conint
from sqlalchemy.orm import Session

import models
from database import SessionLocal

router = APIRouter(prefix="/api/appointments", tags=["appointments"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

DBSession = Annotated[Session, Depends(get_db)]


class AppointmentBase(BaseModel):
    patient_id: int
    start_at: datetime
    end_at: datetime
    notes: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    status: Optional[models.AppointmentStatus] = models.AppointmentStatus.pending

class AppointmentUpdate(BaseModel):
    patient_id: Optional[int] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    status: Optional[models.AppointmentStatus] = None
    notes: Optional[str] = None

class AppointmentOut(BaseModel):
    id: int
    patient_id: int
    start_at: datetime
    end_at: datetime
    status: models.AppointmentStatus
    notes: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class AssignDoctorIn(BaseModel):
    doctor_id: int  

class AppointmentDoctorOut(BaseModel):
    id: int
    doctor_id: int
    doctor_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class AddServiceIn(BaseModel):
    service_id: int
    quantity: conint(ge=1) = 1

class AppointmentDoctorServiceOut(BaseModel):
    id: int
    appointment_doctor_id: int
    service_id: int
    quantity: int
    model_config = ConfigDict(from_attributes=True)


def _validate_times(start_at: datetime, end_at: datetime):
    if start_at >= end_at:
        raise HTTPException(status_code=422, detail="start_at must be before end_at")

def _ensure_patient(patient_id: int, db: Session):
    if not db.query(models.Patient.id).filter(models.Patient.id == patient_id).first():
        raise HTTPException(status_code=404, detail="Patient not found")

def _ensure_appointment(appt_id: int, db: Session) -> models.Appointment:
    appt = db.query(models.Appointment).filter(models.Appointment.id == appt_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appt

def _ensure_doctor(doctor_id: int, db: Session):
    if not db.query(models.Doctor.id).filter(models.Doctor.id == doctor_id).first():
        raise HTTPException(status_code=404, detail="Doctor not found")

def _ensure_service(service_id: int, db: Session):
    if not db.query(models.Service.id).filter(models.Service.id == service_id).first():
        raise HTTPException(status_code=404, detail="Service not found")



@router.get("", response_model=List[AppointmentOut], status_code=status.HTTP_200_OK)
def list_appointments(db: DBSession):
    return (
        db.query(models.Appointment)
        .order_by(models.Appointment.start_at.asc())
        .all()
    )

@router.get("/{appointment_id}", response_model=AppointmentOut, status_code=status.HTTP_200_OK)
def get_appointment(appointment_id: int, db: DBSession):
    return _ensure_appointment(appointment_id, db)

@router.post("", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
def create_appointment(payload: AppointmentCreate, db: DBSession):
    _ensure_patient(payload.patient_id, db)
    _validate_times(payload.start_at, payload.end_at)

    appt = models.Appointment(
        patient_id=payload.patient_id,
        start_at=payload.start_at,
        end_at=payload.end_at,
        status=payload.status or models.AppointmentStatus.pending,
        notes=payload.notes,
    )
    db.add(appt)
    db.commit()
    db.refresh(appt)
    return appt

@router.put("/{appointment_id}", response_model=AppointmentOut, status_code=status.HTTP_200_OK)
def update_appointment(appointment_id: int, payload: AppointmentUpdate, db: DBSession):
    appt = _ensure_appointment(appointment_id, db)

    data = payload.dict(exclude_unset=True)


    if "patient_id" in data:
        _ensure_patient(data["patient_id"], db)
        appt.patient_id = data["patient_id"]

    new_start = data.get("start_at", appt.start_at)
    new_end = data.get("end_at", appt.end_at)
    _validate_times(new_start, new_end)
    appt.start_at = new_start
    appt.end_at = new_end

    if "status" in data:
        appt.status = data["status"]
    if "notes" in data:
        appt.notes = data["notes"]

    db.add(appt)
    db.commit()
    db.refresh(appt)
    return appt

@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_appointment(appointment_id: int, db: DBSession):
    appt = _ensure_appointment(appointment_id, db)
    db.delete(appt)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/{appointment_id}/doctors",
    response_model=List[AppointmentDoctorOut],
    status_code=status.HTTP_200_OK,
)
def list_appointment_doctors(appointment_id: int, db: DBSession):
    _ensure_appointment(appointment_id, db)
    rows = (
        db.query(models.AppointmentDoctor)
        .filter(models.AppointmentDoctor.appointment_id == appointment_id)
        .all()
    )
    result: List[AppointmentDoctorOut] = []
    for r in rows:
        result.append(
            AppointmentDoctorOut(
                id=r.id,
                doctor_id=r.doctor_id,
                # role=r.role,  ← DELETE THIS LINE!
                doctor_name=r.doctor.full_name if r.doctor else None,
            )
        )
    return result

@router.post("/{appointment_id}/doctors/{doctor_id}/services",
             response_model=AppointmentDoctorServiceOut,
             status_code=status.HTTP_201_CREATED)
def add_service_for_appointment_doctor(appointment_id: int, doctor_id: int,
                                       payload: AddServiceIn, db: DBSession):
    _ensure_appointment(appointment_id, db)
    _ensure_doctor(doctor_id, db)
    _ensure_service(payload.service_id, db)

    appt_doc = (
        db.query(models.AppointmentDoctor)
        .filter(models.AppointmentDoctor.appointment_id == appointment_id,
                models.AppointmentDoctor.doctor_id == doctor_id)
        .first()
    )
    if not appt_doc:
        raise HTTPException(status_code=404, detail="Doctor is not assigned to this appointment")

    row = models.AppointmentDoctorService(
        appointment_doctor_id=appt_doc.id,
        service_id=payload.service_id,
        quantity=payload.quantity,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row

@router.post("/{appointment_id}/doctors", response_model=AppointmentDoctorOut, status_code=status.HTTP_201_CREATED)
def assign_doctor_to_appointment(appointment_id: int, payload: AssignDoctorIn, db: DBSession):
    _ensure_appointment(appointment_id, db)
    _ensure_doctor(payload.doctor_id, db)

    exists = (
        db.query(models.AppointmentDoctor.id)
        .filter(models.AppointmentDoctor.appointment_id == appointment_id,
                models.AppointmentDoctor.doctor_id == payload.doctor_id)
        .first()
    )
    if exists:
        raise HTTPException(status_code=422, detail="Doctor already assigned to this appointment")

    row = models.AppointmentDoctor(
        appointment_id=appointment_id,
        doctor_id=payload.doctor_id,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return AppointmentDoctorOut(
        id=row.id, 
        doctor_id=row.doctor_id,
        doctor_name=row.doctor.full_name if row.doctor else None
    )

class ServicePerformedOut(BaseModel):
    id: int
    service_id: int
    service_name: str
    doctor_id: int
    doctor_name: str
    quantity: int
    model_config = ConfigDict(from_attributes=True)

@router.get("/{appointment_id}/services", response_model=List[ServicePerformedOut], status_code=status.HTTP_200_OK)
def list_appointment_services(appointment_id: int, db: DBSession):
    """Get all services that will be/were performed during this appointment"""
    _ensure_appointment(appointment_id, db)
    

    results = (
        db.query(
            models.AppointmentDoctorService.id,
            models.AppointmentDoctorService.service_id,
            models.Service.name.label('service_name'),
            models.Doctor.id.label('doctor_id'),
            models.Doctor.full_name.label('doctor_name'),
            models.AppointmentDoctorService.quantity
        )
        .join(models.AppointmentDoctor, models.AppointmentDoctorService.appointment_doctor_id == models.AppointmentDoctor.id)
        .join(models.Service, models.AppointmentDoctorService.service_id == models.Service.id)
        .join(models.Doctor, models.AppointmentDoctor.doctor_id == models.Doctor.id)
        .filter(models.AppointmentDoctor.appointment_id == appointment_id)
        .order_by(models.Doctor.full_name.asc(), models.Service.name.asc())
        .all()
    )
    
    return [
        ServicePerformedOut(
            id=r.id,
            service_id=r.service_id,
            service_name=r.service_name,
            doctor_id=r.doctor_id,
            doctor_name=r.doctor_name,
            quantity=r.quantity
        )
        for r in results
    ]


class AssignMultipleDoctorsIn(BaseModel):
    doctors: List[int]  # List of doctor IDs

@router.post("/{appointment_id}/doctors/bulk", status_code=status.HTTP_201_CREATED)
def assign_multiple_doctors_to_appointment(
    appointment_id: int, 
    payload: AssignMultipleDoctorsIn, 
    db: DBSession
):
    """Assign multiple doctors to an appointment at once"""
    _ensure_appointment(appointment_id, db)
    
    if not payload.doctors or len(payload.doctors) == 0:
        raise HTTPException(status_code=422, detail="At least one doctor must be provided")
    
    # Verify all doctors exist
    for doctor_id in payload.doctors:
        _ensure_doctor(doctor_id, db)
    
    # Check if any doctors are already assigned
    existing = db.query(models.AppointmentDoctor).filter(
        models.AppointmentDoctor.appointment_id == appointment_id
    ).all()
    
    existing_doctor_ids = [ad.doctor_id for ad in existing]
    
    # Add only new doctors
    added_doctors = []
    for doctor_id in payload.doctors:
        if doctor_id not in existing_doctor_ids:
            row = models.AppointmentDoctor(
                appointment_id=appointment_id,
                doctor_id=doctor_id,
            )
            db.add(row)
            added_doctors.append(doctor_id)
    
    db.commit()
    
    return {
        "message": f"Assigned {len(added_doctors)} doctor(s) to appointment",
        "added_doctors": added_doctors,
        "total_doctors": len(existing_doctor_ids) + len(added_doctors)
    }