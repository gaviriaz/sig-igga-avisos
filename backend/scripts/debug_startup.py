import sys
from sqlalchemy import create_engine
from database.models import Base
import traceback

DATABASE_URL = "postgresql://postgres:lP5LvF5dkFzIjvEU@db.vdzfamjklmwlptitxvvd.supabase.co:5432/postgres"

def debug_startup():
    print("LOG: Starting Backend DB Debug...")
    try:
        engine = create_engine(DATABASE_URL)
        print("INFO: Engine created. Attempting metadata.create_all...")
        Base.metadata.create_all(bind=engine)
        print("SUCCESS: metadata.create_all finished.")
    except Exception as e:
        print("CRITICAL: metadata.create_all failed!")
        traceback.print_exc()
        
if __name__ == "__main__":
    debug_startup()
