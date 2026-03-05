import os
import json
from sqlalchemy import create_engine, text
from shapely.geometry import shape
from datetime import datetime

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@db.supabase.co:5432/postgres")
engine = create_engine(DATABASE_URL)

def import_geojson(file_path: str, table_name: str, mapping_fn):
    """
    Importa un archivo GeoJSON a una tabla de Postgres/PostGIS.
    Mapping_fn convierte las propiedades del GeoJSON a columnas de la tabla.
    """
    if not os.path.exists(file_path):
        print(f"Archivo no encontrado: {file_path}")
        return

    print(f"Importando {file_path} a {table_name}...")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    features = data.get('features', [])
    count = 0
    
    with engine.begin() as conn:
        for feature in features:
            props = feature.get('properties', {})
            geom = feature.get('geometry')
            
            if not geom:
                continue
                
            # Convertir geom a WKT para PostGIS
            wkt = shape(geom).wkt
            
            # Obtener columnas personalizadas
            fields = mapping_fn(props)
            fields['geom'] = wkt
            
            # Construir SQL dinámico (Costo 0 - Manual Insert)
            cols = ", ".join(fields.keys())
            placeholders = ", ".join([f":{k}" for k in fields.keys()])
            
            # Usar ST_GeomFromText para la geometría
            sql = f"INSERT INTO {table_name} ({cols.replace('geom', 'geom')}) VALUES ({placeholders.replace(':geom', 'ST_GeomFromText(:geom, 4326)')})"
            
            conn.execute(text(sql), fields)
            count += 1
            
            if count % 100 == 0:
                print(f"Procesados {count}/{len(features)}...")

    print(f"Finalizado: {count} registros insertados en {table_name}.")

# Mappings
def map_lineas(p):
    return {"nombre": p.get('nombre') or p.get('NOMBRE') or 'N/A', "voltaje": str(p.get('voltaje') or p.get('VOLTAJE') or '')}

def map_torres(p):
    return {"nombre": p.get('nombre') or p.get('TORRE') or 'N/A', "tipo": p.get('tipo') or 'N/A'}

def map_servidumbre(p):
    return {"nombre": p.get('nombre') or 'N/A', "area_m2": p.get('area') or p.get('AREA') or 0}

def map_predios_catastro(p):
    return {"chip": p.get('chip') or p.get('CHIP'), "propietario": p.get('propietario'), "fuente": "CATASTRO"}

def map_predios_sitco(p):
    return {"chip": p.get('chip') or p.get('CHIP'), "propietario": p.get('propietario'), "fuente": "SITCO"}

if __name__ == "__main__":
    CAPAS_DIR = r"C:\Users\AlbertG\IGGA.SAS\PERSONAL\DEV\SIG-IGGA-AVISOS\capas"
    
    # Ejecutar importaciones
    # import_geojson(os.path.join(CAPAS_DIR, "Lineas_Transmision_Energia.geojson"), "infra_lineas", map_lineas)
    # import_geojson(os.path.join(CAPAS_DIR, "Torres.geojson"), "infra_torres", map_torres)
    # import_geojson(os.path.join(CAPAS_DIR, "Servidumbre.geojson"), "infra_servidumbre", map_servidumbre)
    print("Módulo de importación listo. Use import_geojson() para cargar capas.")
