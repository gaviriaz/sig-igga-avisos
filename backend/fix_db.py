import os
from sqlalchemy import create_engine, text

url = "postgresql://postgres.vdzfamjklmwlptitxvvd:lP5LvF5dkFzIjvEU@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
engine = create_engine(url)

try:
    with engine.connect() as conn:
        print("Columns for aviso_historial:")
        res_h = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'aviso_historial';"))
        for r in res_h:
            print(r)
        
        print("\nColumns for aviso:")
        res_a = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'aviso';"))
        for r in res_a:
            print(r)
except Exception as e:
    print('Error:', e)
