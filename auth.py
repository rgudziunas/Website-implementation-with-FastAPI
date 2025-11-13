# auth.py
from datetime import datetime, timedelta
from typing import Optional
import secrets
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Annotated

import models
from database import SessionLocal

# Configuration
SECRET_KEY = "Rokas958"  # Change this in production!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15  # Short-lived access tokens
REFRESH_TOKEN_EXPIRE_DAYS = 30    # Long-lived refresh tokens

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

DBSession = Annotated[Session, Depends(get_db)]

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a short-lived JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(user_id: int, role: str, db: Session) -> str:
    """Create a long-lived refresh token and store it in database"""
    # Generate a secure random token
    token = secrets.token_urlsafe(64)
    expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    # Determine which foreign key to set
    admin_id = user_id if role == "admin" else None
    patient_id = user_id if role == "patient" else None
    
    # Store in database
    refresh_token = models.RefreshToken(
        token=token,
        user_id=user_id,
        user_role=role,
        admin_id=admin_id,
        patient_id=patient_id,
        expires_at=expires_at,
        revoked=False
    )
    db.add(refresh_token)
    db.commit()
    
    return token

def verify_refresh_token(token: str, db: Session) -> Optional[models.RefreshToken]:
    """Verify refresh token and return the token object if valid"""
    refresh_token = db.query(models.RefreshToken).filter(
        models.RefreshToken.token == token
    ).first()
    
    if not refresh_token:
        return None
    
    # Check if token is revoked
    if refresh_token.revoked:
        return None
    
    # Check if token is expired
    if refresh_token.expires_at < datetime.utcnow():
        return None
    
    return refresh_token

def revoke_refresh_token(token: str, db: Session) -> bool:
    """Revoke a refresh token"""
    refresh_token = db.query(models.RefreshToken).filter(
        models.RefreshToken.token == token
    ).first()
    
    if refresh_token:
        refresh_token.revoked = True
        db.commit()
        return True
    return False

def revoke_all_user_tokens(user_id: int, role: str, db: Session):
    """Revoke all refresh tokens for a user (useful for logout all devices)"""
    db.query(models.RefreshToken).filter(
        models.RefreshToken.user_id == user_id,
        models.RefreshToken.user_role == role,
        models.RefreshToken.revoked == False
    ).update({"revoked": True})
    db.commit()

def cleanup_expired_tokens(db: Session):
    """Delete expired and revoked tokens (call this periodically)"""
    db.query(models.RefreshToken).filter(
        (models.RefreshToken.expires_at < datetime.utcnow()) |
        (models.RefreshToken.revoked == True)
    ).delete()
    db.commit()

def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: DBSession):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"DEBUG - Decoded payload: {payload}")  # DEBUG LINE
        
        user_id: int = payload.get("sub")
        role: str = payload.get("role")
        token_type: str = payload.get("type")
        
        print(f"DEBUG - user_id: {user_id}, role: {role}, token_type: {token_type}")  # DEBUG LINE
        
        if user_id is None or role is None:
            print("DEBUG - user_id or role is None")  # DEBUG LINE
            raise credentials_exception
        
        # Ensure it's an access token, not a refresh token
        if token_type != "access":
            print(f"DEBUG - Wrong token type: {token_type}")  # DEBUG LINE
            raise credentials_exception
            
    except JWTError as e:
        print(f"DEBUG - JWTError: {e}")  # DEBUG LINE
        raise credentials_exception
    
    # Check role and fetch appropriate user
    print(f"DEBUG - Looking for {role} with id {user_id}")  # DEBUG LINE
    
    if role == "admin":
        user = db.query(models.Admin).filter(models.Admin.id == user_id).first()
    elif role == "patient":
        user = db.query(models.Patient).filter(models.Patient.id == user_id).first()
    else:
        print(f"DEBUG - Invalid role: {role}")  # DEBUG LINE
        raise credentials_exception
    
    if user is None:
        print(f"DEBUG - User not found in database")  # DEBUG LINE
        raise credentials_exception
    
    print(f"DEBUG - User found: {user.username}")  # DEBUG LINE
    user.role = role  # Attach role to user object
    return user

def get_current_admin(current_user: Annotated[models.Admin, Depends(get_current_user)]):
    if not hasattr(current_user, 'role') or current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

def get_current_patient(current_user: Annotated[models.Patient, Depends(get_current_user)]):
    if not hasattr(current_user, 'role') or current_user.role != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Patient access required"
        )
    return current_user

def get_authenticated_user(current_user: Annotated[models.Admin | models.Patient, Depends(get_current_user)]):
    """Accepts both admin and patient - any authenticated user"""
    if not hasattr(current_user, 'role') or current_user.role not in ["admin", "patient"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Authentication required"
        )
    return current_user