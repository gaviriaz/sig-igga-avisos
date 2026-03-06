import psycopg2

conn = psycopg2.connect(
    "postgresql://postgres:lP5LvF5dkFzIjvEU@db.vdzfamjklmwlptitxvvd.supabase.co:5432/postgres"
)
cur = conn.cursor()

cur.execute("""
    SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN latitud_decimal BETWEEN -5 AND 15 
                   AND longitud_decimal BETWEEN -82 AND -60 
              THEN 1 END) as wgs84
    FROM aviso
""")
r = cur.fetchone()
print("Total avisos:", r[0])
print("Con WGS84 OK:", r[1])
print("Pendientes:  ", r[0] - r[1])

cur.execute("""
    SELECT aviso, denominacion, latitud_decimal, longitud_decimal 
    FROM aviso 
    WHERE latitud_decimal BETWEEN -5 AND 15 
    LIMIT 5
""")
print("\nSample avisos con WGS84 valido:")
for row in cur.fetchall():
    print(" ", row)

conn.close()
print("\nDone.")
