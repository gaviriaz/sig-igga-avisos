import psycopg2

def check_db():
    dsn = "postgresql://postgres:lP5LvF5dkFzIjvEU@db.vdzfamjklmwlptitxvvd.supabase.co:5432/postgres"
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    tables = ['import_batch', 'avisos_raw', 'aviso']
    for table in tables:
        print(f"\n--- Columns in {table} ---")
        cur.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table}'")
        for col in cur.fetchall():
            print(f"  {col[0]}: {col[1]}")
            
    cur.close()
    conn.close()

if __name__ == "__main__":
    check_db()
