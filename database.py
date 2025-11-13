from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Temporarily hardcode the connection string to test
URL_DATABASE = "mysql+pymysql://root:kLFmcKOQaKdogRKnPvWfQENxkarAhzip@crossover.proxy.rlwy.net:34987/railway"

print("Using hardcoded Railway MySQL connection")

engine = create_engine(URL_DATABASE, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()