import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Debug: Print what environment variables we have
print(f"MYSQL_URL from env: {os.getenv('MYSQL_URL')}")
print(f"All env vars with MYSQL: {[k for k in os.environ.keys() if 'MYSQL' in k]}")

# Use Railway's MYSQL_URL if available, otherwise use localhost for development
URL_DATABASE = os.getenv(
    "MYSQL_URL",  # Railway provides this
    'mysql+pymysql://root:rokas@localhost:3306/saitynai'  # Local fallback
)

print(f"Using database URL: {URL_DATABASE[:30]}...")  # Print first 30 chars for security

engine = create_engine(URL_DATABASE, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()