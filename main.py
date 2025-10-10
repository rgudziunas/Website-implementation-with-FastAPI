from fastapi import FastAPI, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import Annotated

import models
from database import engine, SessionLocal
from patient import router as patients_router  
from appointment import router as appointments_router 
from doctors import router as doctors_router
from services import router as services_router

app = FastAPI()
models.Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    return {"ok": True, "msg": "See /docs for API"}

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

DBSession = Annotated[Session, Depends(get_db)]


app.include_router(patients_router)
app.include_router(appointments_router)
app.include_router(doctors_router)
app.include_router(services_router)