from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.engine.url import URL

<<<<<<< HEAD
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
=======
# Temporarily hardcode the connection string to test
URL_DATABASE = "mysql+pymysql://root:kLFmcKOQaKdogRKnPvWfQENxkarAhzip@crossover.proxy.rlwy.net:34987/railway"

print("Using hardcoded Railway MySQL connection")

engine = create_engine(URL_DATABASE, pool_pre_ping=True)
>>>>>>> a15049cc5201844a30841e61ff9b5cbab25aa624
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()