import psycopg2
DSN = "postgresql://postgres:lP5LvF5dkFzIjvEU@db.vdzfamjklmwlptitxvvd.supabase.co:5432/postgres"

def check():
    conn = psycopg2.connect(DSN)
    cur = conn.cursor()
    tables = ['import_batch', 'avisos_raw', 'aviso', 'dominio', 'app_system_user']
    for t in tables:
        print(f"\n--- {t} ---")
        cur.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{t}'")
        for col in cur.fetchall():
            print(f"  {col[0]}: {col[1]}")
    conn.close()

if __name__ == "__main__":
    check()
