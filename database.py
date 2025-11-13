import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Get the MySQL URL from environment
URL_DATABASE = os.getenv("MYSQL_URL")

if URL_DATABASE:
    # Convert mysql:// to mysql+pymysql://
    URL_DATABASE = URL_DATABASE.replace("mysql://", "mysql+pymysql://")
    print("Connected to Railway MySQL")
else:
    # Fallback - this will fail in production
    URL_DATABASE = 'mysql+pymysql://root:rokas@localhost:3306/saitynai'
    print("ERROR: MYSQL_URL not found in environment")

engine = create_engine(URL_DATABASE, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()