import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Get from environment variable (for production)
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # For local development (you can update this with your actual Supabase URL for testing)
    DATABASE_URL = 'postgresql://postgres:Rokas958@db.sgiebgscreirsoddijdc.supabase.co:5432/postgres'

# Fix for Supabase (they give postgres:// but SQLAlchemy needs postgresql://)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
