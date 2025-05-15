from sqlalchemy import create_engine, Column, Integer, Float, String, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import time
import os

Base = declarative_base()

class User(Base):
    __tablename__ = 'user'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    username = Column(String, unique=True, nullable=False)
    photoLink = Column(String, nullable=False)
    photos = relationship("Photo", back_populates="user", cascade="all, delete-orphan") # Relación con Photo


class Photo(Base):
    __tablename__ = 'photo'

    id = Column(Integer, primary_key=True, autoincrement=True, nullable=False)
    base64 = Column(Text, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    imageName = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey('user.id', ondelete="CASCADE"), nullable=False)
    user = relationship("User", back_populates="photos") # Relación con User


# Crear carpeta si no existe
db_path = "/app/ecotrackdb/data/ecotrack.db"
os.makedirs(os.path.dirname(db_path), exist_ok=True)

# Conectar a la base de datos persistente
engine = create_engine(f'sqlite:///{db_path}')
Base.metadata.create_all(engine)

print("Base de datos creada en:", db_path)
# Mantener el contenedor corriendo

while True:
    time.sleep(3600)