from sqlalchemy import create_all
from database.db import engine, SessionLocal
from database.models import Base
import os

def check_db():
    print("Iniciando Verificación de Base de Datos...")
    try:
        # Esto creará las tablas si NO existen, pero NO altera las existentes.
        Base.metadata.create_all(bind=engine)
        print("✅ create_all ejecutado.")
    except Exception as e:
        print(f"❌ Error en create_all: {e}")

if __name__ == "__main__":
    check_db()
