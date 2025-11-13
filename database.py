import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Use Railway's MYSQL_URL if available, otherwise use localhost for development
URL_DATABASE = os.getenv(
    "MYSQL_URL",  # Railway provides this
    'mysql+pymysql://root:rokas@localhost:3306/saitynai'  # Local fallback
)

engine = create_engine(URL_DATABASE, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()