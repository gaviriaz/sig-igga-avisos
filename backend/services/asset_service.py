import os
from sqlalchemy.orm import Session
from sqlalchemy import text
import json

class AssetService:
    """
    Servicio Geográfico Senior Master.
    Maneja el snapping de avisos a activos de ISA y cálculos espaciales.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.is_postgres = 'sqlite' not in os.getenv('DATABASE_URL', '')

    def snap_aviso_to_asset(self, aviso_id: str):
        """
        Busca el activo ISA más cercano (Línea o Torre) y calcula:
        1. Distancia
        2. Tramo / Código Línea
        """
        if not self.is_postgres:
            return {"status": "SKIPPED", "reason": "Requiere PostGIS para análisis espacial avanzado"}

        try:
            # 1. Buscar Torre más cercana
            query_torre = text("""
                SELECT codigo, linea_vinc, 
                       ST_Distance(a.geom, t.geom) as distancia
                FROM aviso a, activo_isa t
                WHERE a.aviso = :id AND t.tipo = 'TORRE'
                ORDER BY a.geom <-> t.geom
                LIMIT 1
            """)
            torre = self.db.execute(query_torre, {"id": aviso_id}).fetchone()

            if torre:
                # Actualizar aviso con datos del activo
                self.db.execute(text("""
                    UPDATE aviso 
                    SET ubicacion_tecnica = :ut,
                        tipo_de_linea = :linea
                    WHERE aviso = :id
                """), {
                    "ut": torre.codigo,
                    "linea": torre.linea_vinc,
                    "id": aviso_id
                })
                return {"status": "SUCCESS", "torre": torre.codigo, "distancia": torre.distancia}
            
            return {"status": "NOT_FOUND"}
        except Exception as e:
            return {"status": "ERROR", "detail": str(e)}

    def calculate_risk_by_proximity(self, aviso_id: str):
        """
        Aumenta el Risk Score si el aviso está dentro de una zona de amenaza o
        muy cerca de una fase activa.
        """
        # Logic for spatial intersection with threat zones...
        pass
