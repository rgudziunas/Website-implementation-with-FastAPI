import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Get DATABASE_URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise Exception("DATABASE_URL environment variable is required")

print(f"✓ Connecting to database...")

# Configure SSL for Azure MySQL
connect_args = {}
if "azure" in DATABASE_URL or "azurewebsites" in DATABASE_URL:
    connect_args = {
        "ssl": {
            "ssl_mode": "REQUIRED"
        }
    }

# Create engine for MySQL
engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_recycle=3600
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()