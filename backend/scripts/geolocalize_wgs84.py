"""
SCRIPT: Geolocalizacion WGS84 de Avisos desde Torres GeoJSON
Lee Torres.geojson (MAGNA-SIRGAS/ESRI:103599),
convierte a WGS84, cruza con avisos y actualiza latitud_decimal/longitud_decimal en Supabase.
"""

import json, os, sys
sys.stdout.reconfigure(encoding='utf-8')

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:lP5LvF5dkFzIjvEU@db.vdzfamjklmwlptitxvvd.supabase.co:5432/postgres"
)
TORRES_GEOJSON = os.path.normpath(
    os.path.join(os.path.dirname(__file__), '..', 'capas', 'Torres.geojson')
)

def main():
    print("=" * 60)
    print("SCRIPT: Geolocalizacion WGS84 de Avisos")
    print("=" * 60)

    try:
        import psycopg2
        from pyproj import Transformer
    except ImportError as e:
        print(f"ERROR: Dependencia faltante: {e}")
        print("   Instala con: pip install psycopg2-binary pyproj")
        sys.exit(1)

    # 1. Cargar GeoJSON
    print(f"\nCargando: {TORRES_GEOJSON}")
    if not os.path.exists(TORRES_GEOJSON):
        print(f"ERROR: No se encontro Torres.geojson en: {TORRES_GEOJSON}")
        sys.exit(1)

    with open(TORRES_GEOJSON, 'r', encoding='utf-8') as f:
        geojson = json.load(f)
    features = geojson.get('features', [])
    print(f"OK: {len(features)} torres cargadas")

    # 2. Configurar transformador de CRS
    print("\nConfigurando transformador MAGNA-SIRGAS -> WGS84...")
    try:
        # EPSG:3116 = MAGNA-SIRGAS / Colombia West
        transformer = Transformer.from_crs("EPSG:3116", "EPSG:4326", always_xy=True)
    except Exception as e:
        # Fallback: intentar con el CRS de ESRI directamente
        try:
            transformer = Transformer.from_crs("+proj=tmerc +lat_0=4.596200416666666 +lon_0=-74.07750791666666 +k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 +units=m +no_defs", "EPSG:4326", always_xy=True)
            print("  Usando WKT fallback para MAGNA-SIRGAS")
        except Exception as e2:
            print(f"ERROR transformador: {e2}")
            sys.exit(1)

    # 3. Construir mapa de torres con WGS84
    print("\nConvirtiendo coordenadas a WGS84...")
    tower_map = {}
    converted = 0
    errors = 0

    for feat in features:
        props = feat.get('properties', {})
        geom = feat.get('geometry', {})
        if not geom or geom.get('type') != 'Point':
            continue
        coords = geom.get('coordinates', [])
        if len(coords) < 2:
            continue

        x, y = float(coords[0]), float(coords[1])
        torre_no = str(props.get('Torre_No', '') or '').strip()
        linea_id = str(props.get('ID_Linea_F', '') or '').strip()

        if not torre_no and not linea_id:
            continue

        try:
            lon_wgs84, lat_wgs84 = transformer.transform(x, y)
            if not (-82 <= lon_wgs84 <= -60 and -5 <= lat_wgs84 <= 15):
                errors += 1
                continue
            key = (torre_no.lower(), linea_id.lower())
            tower_map[key] = (round(lat_wgs84, 7), round(lon_wgs84, 7))
            converted += 1
        except Exception:
            errors += 1

    print(f"  OK: {converted} torres convertidas")
    if errors:
        print(f"  WARN: {errors} torres con error de conversion (ignoradas)")

    # 4. Conectar a Supabase
    print(f"\nConectando a Supabase...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        print("  OK: Conexion exitosa")
    except Exception as e:
        print(f"  ERROR de conexion: {e}")
        sys.exit(1)

    # 5. Leer avisos
    print("\nLeyendo avisos de la base de datos...")
    cur.execute("""
        SELECT aviso, denominacion, ubicacion_tecnica, latitud_decimal, longitud_decimal
        FROM aviso
        WHERE denominacion IS NOT NULL
        ORDER BY aviso
    """)
    avisos = cur.fetchall()
    print(f"  Total avisos: {len(avisos)}")

    # 6. Cruzar y actualizar
    print("\nCruzando avisos con torres y actualizando...")
    updated = 0
    not_found = 0
    already_ok = 0
    batch = []

    for (aviso_id, denominacion, ubicacion_tecnica, lat_actual, lon_actual) in avisos:
        den = str(denominacion or '').strip().lower()
        ub  = str(ubicacion_tecnica or '').strip().lower()

        # Saltar si ya tiene WGS84 valido
        if (lat_actual and lon_actual and
                -5 <= float(lat_actual) <= 15 and -82 <= float(lon_actual) <= -60):
            already_ok += 1
            continue

        # Match exacto (denominacion + linea)
        coords = tower_map.get((den, ub))

        # Match por denominacion sola
        if not coords:
            for (t, l), c in tower_map.items():
                if t == den:
                    coords = c
                    break

        if coords:
            batch.append((coords[0], coords[1], aviso_id))
            updated += 1
        else:
            not_found += 1

    if batch:
        print(f"  Actualizando {len(batch)} avisos en batch...")
        cur.executemany(
            "UPDATE aviso SET latitud_decimal = %s, longitud_decimal = %s WHERE aviso = %s",
            batch
        )
        conn.commit()
        print(f"  OK: {updated} avisos actualizados!")
    else:
        print("  INFO: No hay avisos para actualizar.")

    print(f"  Ya tenian WGS84: {already_ok}")
    print(f"  Sin match en torres: {not_found}")

    # 7. Reporte final
    print("\nREPORTE FINAL:")
    cur.execute("""
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN latitud_decimal BETWEEN -5 AND 15 
                       AND longitud_decimal BETWEEN -82 AND -60 
                  THEN 1 END) as con_wgs84
        FROM aviso
    """)
    row = cur.fetchone()
    total = row[0] if row else 0
    con_wgs84 = row[1] if row else 0
    pct = int(100 * con_wgs84 / total) if total > 0 else 0
    print(f"  Total avisos:    {total}")
    print(f"  Con WGS84:       {con_wgs84} ({pct}%)")
    print(f"  Pendientes:      {total - con_wgs84}")

    cur.close()
    conn.close()

    print("\nCOMPLETADO - Recarga la web para ver los avisos geolocalizados!")
    print("=" * 60)


if __name__ == "__main__":
    main()
