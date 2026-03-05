import os
import sys
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Add backend to path
sys.path.append(r"C:\Users\AlbertG\IGGA.SAS\PERSONAL\DEV\SIG-IGGA-AVISOS\backend")

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

from database.models import Base, Aviso

engine = create_engine(DATABASE_URL)
inspector = inspect(engine)
existing_columns = [c['name'] for c in inspector.get_columns('aviso')]

print(f"Existing columns: {existing_columns}")

# Columns in model
model_columns = Aviso.__table__.columns.keys()
print(f"Model columns: {model_columns}")

missing_columns = [c for c in model_columns if c not in existing_columns]
print(f"Missing columns: {missing_columns}")

if missing_columns:
    with engine.connect() as conn:
        for col_name in missing_columns:
            column_obj = Aviso.__table__.columns[col_name]
            # Simple mapping of types for ALTER TABLE
            col_type = str(column_obj.type).upper()
            if "VARCHAR" in col_type or "STRING" in col_type:
                sql_type = "TEXT"
            elif "INTEGER" in col_type:
                sql_type = "INTEGER"
            elif "DATETIME" in col_type or "TIMESTAMP" in col_type:
                sql_type = "TIMESTAMP"
            elif "NUMERIC" in col_type:
                sql_type = "NUMERIC"
            elif "BOOLEAN" in col_type:
                sql_type = "BOOLEAN"
            elif "JSON" in col_type:
                sql_type = "JSONB"
            elif "GEOMETRY" in col_type:
                # Handle geometry specially if needed, but usually it's already there or needs postgis
                continue 
            else:
                sql_type = "TEXT"
            
            try:
                print(f"Adding column {col_name} with type {sql_type}...")
                conn.execute(text(f"ALTER TABLE aviso ADD COLUMN {col_name} {sql_type}"))
                conn.commit()
                print("Done.")
            except Exception as e:
                print(f"Failed to add {col_name}: {e}")
else:
    print("No missing columns.")
