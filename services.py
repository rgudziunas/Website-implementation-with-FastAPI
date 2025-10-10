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

# ---- CRUD (5) ----
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



# services.py – OPTIONAL helpers to manage doctor<->service links

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