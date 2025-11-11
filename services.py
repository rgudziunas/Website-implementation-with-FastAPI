# services.py
from typing import List, Optional, Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

import models
from database import SessionLocal

router = APIRouter(prefix="/api/services", tags=["services"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

DBSession = Annotated[Session, Depends(get_db)]

# ---- Schemas ----
class ServiceBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float

class ServiceCreate(ServiceBase):
    pass

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None

class ServiceOut(ServiceBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class LinkDoctorIn(BaseModel):
    doctor_id: int    

@router.get("", response_model=List[ServiceOut], status_code=status.HTTP_200_OK)
def list_services(db: DBSession):
    return db.query(models.Service).order_by(models.Service.name.asc()).all()

@router.get("/{service_id}", response_model=ServiceOut, status_code=status.HTTP_200_OK)
def get_service(service_id: int, db: DBSession):
    service = db.query(models.Service).filter(models.Service.id == service_id).first()
    if not service:
        raise HTTPException(404, "Service not found")
    return service

@router.post("", response_model=ServiceOut, status_code=status.HTTP_201_CREATED)
def create_service(payload: ServiceCreate, db: DBSession):
    if db.query(models.Service).filter(models.Service.name == payload.name).first():
        raise HTTPException(422, "Service with this name already exists")
    s = models.Service(**payload.dict())
    db.add(s)
    db.commit()
    db.refresh(s)
    return s

@router.put("/{service_id}", response_model=ServiceOut, status_code=status.HTTP_200_OK)
def update_service(service_id: int, payload: ServiceUpdate, db: DBSession):
    s = db.query(models.Service).filter(models.Service.id == service_id).first()
    if not s:
        raise HTTPException(404, "Service not found")

    data = payload.dict(exclude_unset=True)
    if "name" in data and data["name"] and data["name"] != s.name:
        if db.query(models.Service).filter(models.Service.name == data["name"]).first():
            raise HTTPException(422, "Service with this name already exists")
        s.name = data["name"]

    if "description" in data:
        s.description = data["description"]
    if "price" in data and data["price"] is not None:
        s.price = data["price"]

    db.add(s)
    db.commit()
    db.refresh(s)
    return s

@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(service_id: int, db: DBSession):
    s = db.query(models.Service).filter(models.Service.id == service_id).first()
    if not s:
        raise HTTPException(404, "Service not found")
    db.delete(s)
    db.commit()
    return



class LinkDoctorIn(BaseModel):
    doctor_id: int

"""
@router.post("/{service_id}/doctors", status_code=status.HTTP_201_CREATED)
def link_doctor_to_service(service_id: int, payload: LinkDoctorIn, db: DBSession):
    svc = db.query(models.Service).get(service_id)
    if not svc:
        raise HTTPException(404, "Service not found")
    doc = db.query(models.Doctor).get(payload.doctor_id)
    if not doc:
        raise HTTPException(404, "Doctor not found")

    exists = db.query(models.DoctorService.id).filter(
        models.DoctorService.service_id == service_id,
        models.DoctorService.doctor_id == payload.doctor_id
    ).first()
    if exists:
        raise HTTPException(422, "Link already exists")

    link = models.DoctorService(service_id=service_id, doctor_id=payload.doctor_id)
    db.add(link)
    db.commit()
    return {"ok": True}

@router.delete("/{service_id}/doctors/{doctor_id}", status_code=status.HTTP_204_NO_CONTENT)
def unlink_doctor_from_service(service_id: int, doctor_id: int, db: DBSession):
    link = db.query(models.DoctorService).filter(
        models.DoctorService.service_id == service_id,
        models.DoctorService.doctor_id == doctor_id
    ).first()
    if not link:
        raise HTTPException(404, "Link not found")
    db.delete(link)
    db.commit()
    return
"""

class ServiceWithAssistantInfo(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    price: float
    requires_assistant: bool  # New field
    model_config = ConfigDict(from_attributes=True)

@router.get("/with-assistant-info", response_model=List[ServiceWithAssistantInfo], status_code=status.HTTP_200_OK)
def list_services_with_assistant_info(db: DBSession):
    """Get all services with information about whether they need an assistant"""
    services = db.query(models.Service).order_by(models.Service.name.asc()).all()
    
    # Define which services require an assistant
    # You can make this more dynamic by adding a column to the Service table
    assistant_required_keywords = ["chirurgij", "ekstrakcij", "operacij"]
    
    result = []
    for service in services:
        requires_assistant = any(keyword in service.name.lower() for keyword in assistant_required_keywords)
        result.append(
            ServiceWithAssistantInfo(
                id=service.id,
                name=service.name,
                description=service.description,
                price=service.price,
                requires_assistant=requires_assistant
            )
        )
    
    return result

# Add this schema at the top with other schemas
class DoctorOut(BaseModel):
    id: int
    full_name: str
    specialization: str
    email: Optional[str] = None
    phone: Optional[str] = None
    active: bool
    role: models.DoctorRole
    model_config = ConfigDict(from_attributes=True)

@router.get("/{service_id}/doctors", response_model=List[DoctorOut], status_code=status.HTTP_200_OK)
def get_doctors_for_service(service_id: int, db: DBSession):
    """Get all doctors who can perform this service"""
    service = db.query(models.Service).filter(models.Service.id == service_id).first()
    if not service:
        raise HTTPException(404, "Service not found")
    
    # Get doctors linked to this service, only active main doctors
    doctors = (
        db.query(models.Doctor)
        .join(models.DoctorService, models.DoctorService.doctor_id == models.Doctor.id)
        .filter(
            models.DoctorService.service_id == service_id,
            models.Doctor.active == True,
            models.Doctor.role == models.DoctorRole.main
        )
        .order_by(models.Doctor.full_name.asc())
        .all()
    )
    return doctors


