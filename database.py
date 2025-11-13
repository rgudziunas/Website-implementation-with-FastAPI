import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Debug: Print all environment variables (but hide sensitive data)
print("=== Environment Check ===")
print(f"DATABASE_URL exists: {'DATABASE_URL' in os.environ}")
print(f"All env vars: {list(os.environ.keys())}")

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found in environment!")
    # Don't put password here!
    raise Exception("DATABASE_URL environment variable is required")

# Hide password in logs
if "supabase" in DATABASE_URL:
    print("✓ Found Supabase DATABASE_URL")
else:
    print(f"Database URL prefix: {DATABASE_URL[:30]}...")

# Fix URL format for psycopg3
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()