import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from services.ingesta_service import IngestaService
from datetime import datetime
from dotenv import load_dotenv
import pandas as pd

load_dotenv()

DATABASE_URL = "postgresql://postgres:lP5LvF5dkFzIjvEU@db.vdzfamjklmwlptitxvvd.supabase.co:5432/postgres"

def debug_seed_small():
    print("LOG: Starting Small Debug Seed...")
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        real_excel = r"C:\Users\AlbertG\IGGA.SAS\PERSONAL\DEV\SIG-IGGA-AVISOS\capas\GEAM_N2_27_02_2026.xlsx"
        df = pd.read_excel(real_excel, engine='openpyxl')
        df_small = df.head(5)
        
        # Guardar el temporal pequeño
        small_excel = "small_test.xlsx"
        df_small.to_excel(small_excel, index=False)
        
        ingesta = IngestaService(db)
        print(f"INFO: Processing {len(df_small)} rows...")
        batch_id = ingesta.process_excel(small_excel, datetime.now(), "DEBUG_LOCAL_SMALL")
        
        db.commit()
        print(f"SUCCESS: Batch ID: {batch_id}")
        
    except Exception as e:
        import traceback
        print("ERROR:")
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()
        if os.path.exists("small_test.xlsx"):
            os.remove("small_test.xlsx")

if __name__ == "__main__":
    debug_seed_small()
