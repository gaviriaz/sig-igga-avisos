"""
Convierte coordenadas proyectadas EPSG:9377 (MAGNA-SIRGAS Colombia 2018) a WGS84
para los avisos que aun no tienen latitud/longitud validos.
"""
import sys, os
sys.stdout.reconfigure(encoding='utf-8')

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:lP5LvF5dkFzIjvEU@db.vdzfamjklmwlptitxvvd.supabase.co:5432/postgres"
)

def main():
    print("=" * 60)
    print("SCRIPT: Conversion EPSG:9377 -> WGS84 para avisos")
    print("=" * 60)

    import psycopg2
    from pyproj import Transformer

    # EPSG:9377 = MAGNA-SIRGAS 2018 / Colombia Origin
    # (False easting: 5,000,000; False northing: 2,000,000)
    transformer = Transformer.from_crs("EPSG:9377", "EPSG:4326", always_xy=True)

    print("Conectando a Supabase...")
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    print("  Conexion OK")

    cur.execute("""
        SELECT aviso, latitud_decimal, longitud_decimal
        FROM aviso
        WHERE latitud_decimal IS NOT NULL
          AND (
              latitud_decimal NOT BETWEEN -5 AND 15
              OR longitud_decimal NOT BETWEEN -82 AND -60
          )
        ORDER BY aviso
    """)
    avisos = cur.fetchall()
    print(f"\nAvisos con coordenadas NO-WGS84: {len(avisos)}")

    batch = []
    skipped = 0
    out_of_range = 0

    for (aviso_id, lat_proj, lon_proj) in avisos:
        try:
            x = float(lat_proj)
            y = float(lon_proj)

            lon_wgs84, lat_wgs84 = transformer.transform(x, y)

            if -82 <= lon_wgs84 <= -60 and -5 <= lat_wgs84 <= 15:
                batch.append((round(lat_wgs84, 7), round(lon_wgs84, 7), aviso_id))
            else:
                out_of_range += 1
                print(f"  OUT-OF-RANGE: {aviso_id} -> lat={lat_wgs84:.4f}, lon={lon_wgs84:.4f}")
        except Exception as e:
            print(f"  ERROR {aviso_id}: {e}")
            skipped += 1

    print(f"\nAvisos a actualizar: {len(batch)}")
    print(f"Fuera de rango Colombia: {out_of_range}")
    print(f"Errores: {skipped}")

    if batch:
        print("Actualizando en Supabase...")
        cur.executemany(
            "UPDATE aviso SET latitud_decimal = %s, longitud_decimal = %s WHERE aviso = %s",
            batch
        )
        conn.commit()
        print(f"  OK: {len(batch)} avisos actualizados!")

    cur.execute("""
        SELECT COUNT(*) as total,
               COUNT(CASE WHEN latitud_decimal BETWEEN -5 AND 15 
                           AND longitud_decimal BETWEEN -82 AND -60 
                      THEN 1 END) as wgs84
        FROM aviso
    """)
    row = cur.fetchone()
    total, wgs84 = row
    print(f"\nREPORTE FINAL:")
    print(f"  Total avisos:    {total}")
    print(f"  Con WGS84:       {wgs84} ({100*wgs84//total if total else 0}%)")
    print(f"  Pendientes:      {total - wgs84}")

    cur.close()
    conn.close()
    print("\nCOMPLETADO!")
    print("=" * 60)

if __name__ == "__main__":
    main()
