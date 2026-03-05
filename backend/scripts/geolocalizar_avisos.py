import json
import psycopg2
from psycopg2.extras import execute_values
import os
from dotenv import load_dotenv

load_dotenv()

DSN = "postgresql://postgres:lP5LvF5dkFzIjvEU@db.vdzfamjklmwlptitxvvd.supabase.co:5432/postgres"

def run_geolocalization():
    print("LOG: Starting Geolocation Process...")
    conn = psycopg2.connect(DSN)
    cur = conn.cursor()

    try:
        # 1. Preparar tabla de torres
        print("INFO: Creating/Cleaning table 'capa_torres'...")
        cur.execute("DROP TABLE IF EXISTS capa_torres CASCADE;")
        cur.execute("""
            CREATE TABLE capa_torres (
                id SERIAL PRIMARY KEY,
                torre_no TEXT,
                id_linea_f TEXT,
                geom GEOMETRY(Point, 4326)
            );
            CREATE INDEX idx_capa_torres_logic ON capa_torres(torre_no, id_linea_f);
            CREATE INDEX idx_capa_torres_geom ON capa_torres USING GIST(geom);
        """)

        # 2. Leer GeoJSON y cargar en batches
        geojson_path = r"C:\Users\AlbertG\IGGA.SAS\PERSONAL\DEV\SIG-IGGA-AVISOS\capas\Torres.geojson"
        print(f"INFO: Loading data from {geojson_path}...")
        with open(geojson_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            features = data['features']
        
        batch_data = []
        for feat in features:
            props = feat['properties']
            geom = feat['geometry']
            
            torre_no = str(props.get('Torre_No', '')).strip()
            id_linea_f = str(props.get('ID_Linea_F', '')).strip()
            
            if geom and geom['type'] == 'Point':
                coords = geom['coordinates']
                # PostGIS POINT(lon lat)
                wkt = f"POINT({coords[0]} {coords[1]})"
                batch_data.append((torre_no, id_linea_f, wkt))

        print(f"INFO: Inserting {len(batch_data)} towers into database...")
        execute_values(cur, 
            "INSERT INTO capa_torres (torre_no, id_linea_f, geom) VALUES %s", 
            batch_data,
            template="(%s, %s, ST_GeomFromText(%s, 4326))"
        )
        conn.commit()
        print("SUCCESS: Reference towers loaded.")

        # 3. Cruzar con Avisos
        print("INFO: Updating 'aviso' coordinates based on tower match...")
        # Limpiar espacios y normalizar para el join
        cur.execute("""
            UPDATE aviso a
            SET geom = t.geom
            FROM capa_torres t
            WHERE TRIM(a.denominacion) = t.torre_no
              AND TRIM(a.ubicacion_tecnica) = t.id_linea_f
              AND a.geom IS NULL;
        """)
        updated = cur.rowcount
        conn.commit()
        print(f"SUCCESS: {updated} avisos geolocated successfully!")

        # 4. Reporte final
        cur.execute("SELECT COUNT(*) FROM aviso WHERE geom IS NOT NULL")
        total_geo = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM aviso")
        total = cur.fetchone()[0]
        print(f"REPORT: Total avisos with geometry: {total_geo} / {total}")

    except Exception as e:
        print(f"ERROR: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    run_geolocalization()
