import os
import sys

# Define path and configure env to force SQLite properly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ["DATABASE_URL"] = "sqlite:///./sig_igga_local_dev.db"

from sqlalchemy import create_engine
from database.models import Base

def reset_db():
    print("Conectando a SQLite para regenerar esquema...")
    engine = create_engine("sqlite:///./sig_igga_local_dev.db")
    print("Eliminando tablas anteriores...")
    Base.metadata.drop_all(engine)
    print("Creando tablas basadas en modelos (models.py)...")
    Base.metadata.create_all(engine)
    print("Listo! Tablas regeneradas exitosamente.")

if __name__ == "__main__":
    reset_db()
