import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Get Railway's MYSQL_URL
URL_DATABASE = os.getenv("MYSQL_URL")

if URL_DATABASE:
    # Railway gives mysql://, but SQLAlchemy needs mysql+pymysql://
    URL_DATABASE = URL_DATABASE.replace("mysql://", "mysql+pymysql://")
    print("Connected to Railway MySQL")
else:
    # Fallback for local development
    URL_DATABASE = 'mysql+pymysql://root:rokas@localhost:3306/saitynai'
    print("Using localhost MySQL")

engine = create_engine(URL_DATABASE, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()