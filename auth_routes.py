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
    create_refresh_token,
    verify_refresh_token,
    revoke_refresh_token,
    revoke_all_user_tokens,
    hash_password,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    DBSession
)

router = APIRouter(prefix="/api/auth", tags=["authentication"])

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    role: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str

class AdminRegister(BaseModel):
    username: str
    password: str

class PatientRegister(BaseModel):
    username: str
    password: str
    full_name: str
    email: str
    phone: str | None = None
    birth_date: str | None = None

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
    
    # Create tokens
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(admin.id), "role": "admin"},
        expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(admin.id, "admin", db)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "role": "admin"
    }

@router.post("/register/patient", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_patient(payload: PatientRegister, db: DBSession):
    """Register a new patient"""
    # Validate password
    if not payload.password or len(payload.password) < 6:
        raise HTTPException(
            status_code=422, 
            detail="Password must be at least 6 characters long"
        )
    
    # Check if username already exists
    if db.query(models.Patient).filter(models.Patient.username == payload.username).first():
        raise HTTPException(status_code=422, detail="Username already taken")
    
    # Check if email already exists
    if db.query(models.Patient).filter(models.Patient.email == payload.email).first():
        raise HTTPException(status_code=422, detail="Email already in use")
    
    # Create new patient
    patient = models.Patient(
        username=payload.username,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        birth_date=payload.birth_date
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    
    # Create tokens
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(patient.id), "role": "patient"},
        expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(patient.id, "patient", db)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "role": "patient"
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
    
    # Create tokens
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "role": role},
        expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(user.id, role, db)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "role": role
    }

@router.post("/refresh", response_model=AccessTokenResponse)
def refresh_access_token(payload: RefreshTokenRequest, db: DBSession):
    """Get a new access token using a refresh token"""
    
    # Verify the refresh token
    token_data = verify_refresh_token(payload.refresh_token, db)
    
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    # Create new access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(token_data.user_id), "role": token_data.user_role},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(
    payload: RefreshTokenRequest, 
    current_user: Annotated[models.Admin | models.Patient, Depends(get_current_user)],
    db: DBSession
):
    """Logout by revoking the refresh token"""
    
    success = revoke_refresh_token(payload.refresh_token, db)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Refresh token not found"
        )
    
    return {"message": "Successfully logged out"}


@router.get("/me")
def get_current_user_info(
    current_user: Annotated[models.Admin | models.Patient, Depends(get_current_user)]
):
    """Get current authenticated user information"""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "role": current_user.role,
        "email": getattr(current_user, "email", None),
        "full_name": getattr(current_user, "full_name", None)
    }