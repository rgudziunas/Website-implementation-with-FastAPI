from fastapi import FastAPI, Depends, status, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Annotated
import os

import models
from database import engine, SessionLocal
from patient import router as patients_router
from appointment import router as appointments_router
from doctors import router as doctors_router
from services import router as services_router
from auth_routes import router as auth_router
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for production (frontend served from same origin)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
models.Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

DBSession = Annotated[Session, Depends(get_db)]

app.include_router(auth_router)
app.include_router(patients_router)
app.include_router(appointments_router)
app.include_router(doctors_router)
app.include_router(services_router)

# Serve React static files (must be after API routes)
frontend_build_path = "frontend/dist"
if os.path.exists(frontend_build_path):
    # Mount static assets (CSS, JS, images)
    app.mount("/assets", StaticFiles(directory=f"{frontend_build_path}/assets"), name="assets")

    # Serve index.html for all non-API routes (for React Router)
    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        # Don't serve index.html for API routes or docs
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            return {"error": "Not found"}

        # Serve index.html for all other routes
        index_path = f"{frontend_build_path}/index.html"
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"error": "Frontend not built"}