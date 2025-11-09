# auth_routes.py
from datetime import timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session

import models
from auth import (
    verify_password, 
    create_access_token, 
    hash_password,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    DBSession
)

router = APIRouter(prefix="/api/auth", tags=["authentication"])

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class AdminRegister(BaseModel):
    username: str
    password: str

@router.post("/register/admin", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_admin(payload: AdminRegister, db: DBSession):
    """Register a new admin (in production, this should be restricted)"""
    if db.query(models.Admin).filter(models.Admin.username == payload.username).first():
        raise HTTPException(status_code=422, detail="Username already taken")
    
    admin = models.Admin(
        username=payload.username,
        password_hash=hash_password(payload.password)
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    
    # Create token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": admin.id, "role": "admin"},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": "admin"
    }

@router.post("/login", response_model=Token)
def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: DBSession):
    """Login endpoint for both admins and patients"""
    
    # Try to find user in Admin table
    user = db.query(models.Admin).filter(models.Admin.username == form_data.username).first()
    role = "admin"
    
    # If not admin, try Patient table
    if not user:
        user = db.query(models.Patient).filter(models.Patient.username == form_data.username).first()
        role = "patient"
    
    # Validate credentials
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id, "role": role},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": role
    }