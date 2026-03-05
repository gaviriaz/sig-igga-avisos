import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

query = "SELECT column_name FROM information_schema.columns WHERE table_name = 'aviso'"

with engine.connect() as conn:
    res = conn.execute(text(query))
    cols = [r[0] for r in res]
    for col in cols:
        print(col)
    
    if 'fin_deseado' in cols:
        print("fin_deseado EXISTS")
    else:
        print("fin_deseado MISSING")
