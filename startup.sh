#!/bin/bash
# Azure App Service startup script for FastAPI

echo "Starting FastAPI application with uvicorn..."
python -m uvicorn main:app --host 0.0.0.0 --port 8000
