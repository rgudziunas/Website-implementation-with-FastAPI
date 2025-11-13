from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.engine.url import URL

# Create URL object to handle special characters properly
url_object = URL.create(
    "mysql+pymysql",
    username="root",
    password="kLFmcKOQaKdogRKnPvWfQENxkarAhzip",
    host="crossover.proxy.rlwy.net",
    port=34987,
    database="railway"
)

engine = create_engine(url_object, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()