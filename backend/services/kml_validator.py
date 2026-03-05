import os
import json
from shapely.geometry import shape, Point
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime

class KMLValidatorService:
    """
    Servicio de validación QA/QC para archivos KML de campo (Costo 0).
    Lógica espacial: Valida si la geometría del KML está dentro del buffer del aviso.
    """
    def __init__(self, db: Session):
        self.db = db

    def validate_proximity(self, aviso_id: str, kml_geojson: dict):
        """
        Calcula si el KML está dentro del radio permitido por tipo de gestión.
        Buffers: VEG: 200m, CONS: 100m, OBRAS: 150m.
        """
        # 1. Obtener datos del aviso
        sql = text("SELECT latitud_decimal, longitud_decimal, tipo_de_gestion FROM aviso WHERE aviso = :id")
        aviso = self.db.execute(sql, {"id": aviso_id}).fetchone()
        
        if not aviso or not aviso[0] or not aviso[1]:
            return {"status": "NOT_EVALUATED", "msg": "Aviso sin coordenadas base."}

        # 2. Obtener buffer por tipo de gestión (desde la tabla de configuración)
        buffer_sql = text("SELECT buffer_m FROM cfg_kml_buffer_por_tipo_gestion WHERE tipo_gestion = :tipo")
        buffer_entry = self.db.execute(buffer_sql, {"tipo": aviso[2]}).fetchone()
        buffer_m = buffer_entry[0] if buffer_entry else 200 # Default 200m

        # 3. Punto del Aviso
        point = Point(aviso[1], aviso[0]) # (lon, lat)

        # 4. Parsear Geometrías del KML
        features = kml_geojson.get('features', [])
        within_buffer = False
        min_dist = float('inf')

        for feat in features:
            geom = shape(feat['geometry'])
            dist = point.distance(geom) * 111139 # Aprox grados a metros en Ecuador
            
            if dist < min_dist:
                min_dist = dist
            
            if dist <= buffer_m:
                within_buffer = True
        
        # 5. Guardar resultado en aviso_insumos
        status = "OK" if within_buffer else "OUT_OF_BUFFER"
        
        update_sql = text("""
            INSERT INTO aviso_insumos (aviso, kml_within_buffer, kml_proximity_status, kml_min_distance_m, updated_at)
            VALUES (:id, :within, :status, :dist, :now)
            ON CONFLICT (aviso) DO UPDATE SET 
                kml_within_buffer = EXCLUDED.kml_within_buffer,
                kml_proximity_status = EXCLUDED.kml_proximity_status,
                kml_min_distance_m = EXCLUDED.kml_min_distance_m,
                updated_at = EXCLUDED.updated_at
        """)
        self.db.execute(update_sql, {
            "id": aviso_id, "within": within_buffer, "status": status, 
            "dist": min_dist, "now": datetime.now()
        })
        self.db.commit()

        return {
            "aviso": aviso_id,
            "status": status,
            "min_distance_m": round(min_dist, 2),
            "buffer_limit_m": buffer_m,
            "within_buffer": within_buffer
        }
