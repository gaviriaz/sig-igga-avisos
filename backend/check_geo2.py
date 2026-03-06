import psycopg2
from decimal import Decimal

conn = psycopg2.connect(
    "postgresql://postgres:lP5LvF5dkFzIjvEU@db.vdzfamjklmwlptitxvvd.supabase.co:5432/postgres"
)
cur = conn.cursor()

# Check the 80 remaining avisos
cur.execute("""
    SELECT aviso, denominacion, latitud_decimal, longitud_decimal
    FROM aviso
    WHERE latitud_decimal IS NOT NULL
      AND (latitud_decimal NOT BETWEEN -5 AND 15 OR longitud_decimal NOT BETWEEN -82 AND -60)
    LIMIT 10
""")
print("Avisos con coords NO-WGS84 aun:")
for row in cur.fetchall():
    print(f"  {row[0]} | {row[1]} | lat={row[2]} | lon={row[3]}")

cur.execute("""
    SELECT COUNT(*) FROM aviso
    WHERE latitud_decimal IS NOT NULL
      AND (latitud_decimal NOT BETWEEN -5 AND 15 OR longitud_decimal NOT BETWEEN -82 AND -60)
""")
print(f"\nTotal pendientes con coords proyectadas: {cur.fetchone()[0]}")

cur.execute("""
    SELECT COUNT(*) FROM aviso WHERE latitud_decimal IS NULL
""")
print(f"Total sin coordenadas: {cur.fetchone()[0]}")

# Check aviso 5766094 specifically
cur.execute("SELECT aviso, denominacion, latitud_decimal, longitud_decimal, ubicacion_tecnica FROM aviso WHERE aviso = '5766094'")
row = cur.fetchone()
print(f"\nAviso 5766094: {row}")

conn.close()
