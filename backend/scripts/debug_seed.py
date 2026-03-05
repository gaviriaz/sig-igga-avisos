import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from services.ingesta_service import IngestaService
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = "postgresql://postgres:lP5LvF5dkFzIjvEU@db.vdzfamjklmwlptitxvvd.supabase.co:5432/postgres"

def debug_seed():
    print("LOG: Starting Debug Seed...")
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        real_excel = r"C:\Users\AlbertG\IGGA.SAS\PERSONAL\DEV\SIG-IGGA-AVISOS\capas\GEAM_N2_27_02_2026.xlsx"
        if not os.path.exists(real_excel):
            print(f"❌ Excel not found at {real_excel}")
            return

        ingesta = IngestaService(db)
        print(f"INFO: Processing {real_excel}...")
        batch_id = ingesta.process_excel(real_excel, datetime.now(), "DEBUG_LOCAL")
        
        db.commit()
        print(f"SUCCESS: Batch ID: {batch_id}")
        
    except Exception as e:
        import traceback
        print("❌ Error during seed:")
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    debug_seed()
