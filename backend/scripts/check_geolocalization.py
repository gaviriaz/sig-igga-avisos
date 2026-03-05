import psycopg2
DSN = "postgresql://postgres:lP5LvF5dkFzIjvEU@db.vdzfamjklmwlptitxvvd.supabase.co:5432/postgres"

def check():
    conn = psycopg2.connect(DSN)
    cur = conn.cursor()
    
    print("--- Searching for specific tower in capa_torres ---")
    cur.execute("SELECT torre_no, id_linea_f FROM capa_torres WHERE torre_no = 'Torre 2' LIMIT 10")
    for r in cur.fetchall():
        print(r)
        
    print("\n--- Searching for specific line in capa_torres ---")
    cur.execute("SELECT DISTINCT id_linea_f FROM capa_torres WHERE id_linea_f LIKE 'CMAQ%' LIMIT 10")
    for r in cur.fetchall():
        print(r)

    print("\n--- Checking counts ---")
    cur.execute("SELECT COUNT(*) FROM aviso")
    print(f"Total avisos: {cur.fetchone()[0]}")
    cur.execute("SELECT COUNT(*) FROM aviso WHERE geom IS NOT NULL")
    print(f"Geolocated avisos: {cur.fetchone()[0]}")

    cur.close()
    conn.close()

if __name__ == "__main__":
    check()
