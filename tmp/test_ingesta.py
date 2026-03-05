import os
import sys
import pandas as pd
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend to path
sys.path.append(r"C:\Users\AlbertG\IGGA.SAS\PERSONAL\DEV\SIG-IGGA-AVISOS\backend")

DATABASE_URL = "sqlite:///./test_debug.db"
os.environ["DATABASE_URL"] = DATABASE_URL

from database.models import Base
from services.ingesta_service import IngestaService

engine = create_engine(DATABASE_URL)
Base.metadata.create_all(bind=engine)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

excel_path = r"C:\Users\AlbertG\IGGA.SAS\PERSONAL\DEV\SIG-IGGA-AVISOS\capas\GEAM_N2_27_02_2026.xlsx"

if not os.path.exists(excel_path):
    print(f"File not found: {excel_path}")
    sys.exit(1)

service = IngestaService(db)
try:
    print("Starting ingestion...")
    service.process_excel(excel_path, datetime.now(), "DEBUG_LOCAL")
    print("Success!")
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
    if os.path.exists("./test_debug.db"):
        os.remove("./test_debug.db")
