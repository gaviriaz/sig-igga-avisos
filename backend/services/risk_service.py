from sqlalchemy.orm import Session
from database.models import Aviso
from datetime import datetime

class RiskScoreService:
    def __init__(self, db: Session):
        self.db = db

    def calculate_for_aviso(self, aviso_id: str):
        """
        Calcula el Risk Score (0-100) según el prompt:
        - Distancia copa-fase (si vegetación)
        - Observación de riesgo
        - Tipo de aviso / gestión
        - Antigüedad
        """
        aviso = self.db.query(Aviso).filter(Aviso.aviso == aviso_id).first()
        if not aviso:
            return 0

        score = 0

        # 1. Por Tipo de Gestión
        gestion_weights = {
            "VEGETACIÓN": 30,
            "CONSTRUCCIÓN": 40,
            "OBRAS": 20,
            "INSPECCIONES": 10
        }
        score += gestion_weights.get(aviso.tipo_de_gestion, 0)

        # 2. Por Distancia Copa-Fase (Vegetación)
        if aviso.tipo_de_gestion == "VEGETACIÓN" and aviso.distancia_copa_fase:
            try:
                # Extraer número si es string ej: "1.5m"
                dist = float(''.join(c for c in str(aviso.distancia_copa_fase) if c.isdigit() or c=='.'))
                if dist < 1.0: score += 50
                elif dist < 2.5: score += 30
                elif dist < 4.0: score += 10
            except:
                pass

        # 3. Por Prioridad Fuente
        prioridad_weights = {
            "CRÍTICA": 30,
            "ALTA": 20,
            "MEDIA": 10,
            "BAJA": 0
        }
        score += prioridad_weights.get(str(aviso.prioridad_fuente).upper(), 0)

        # Cap at 100
        final_score = min(score, 100)
        
        aviso.risk_score = final_score
        self.db.commit()
        return final_score

    def get_sla_status(self, aviso: Aviso):
        """Calcula el estado del SLA según prioridad."""
        if not aviso.fecha_aviso:
            return "NORMAL"
        
        # Deadlines según prompt
        # CRÍTICO 24h, ALTO 72h, MEDIO 7 días, BAJO 30 días
        now = datetime.now()
        delta = now - aviso.fecha_aviso
        hours = delta.total_seconds() / 3600
        
        prioridad = str(aviso.prioridad_fuente).upper()
        
        if prioridad == "CRÍTICA" and hours > 24: return "VENCIDO"
        if prioridad == "ALTA" and hours > 72: return "VENCIDO"
        if prioridad == "MEDIA" and hours > (7 * 24): return "VENCIDO"
        
        # Alerta próxima (6h antes de vencer)
        if prioridad == "CRÍTICA" and hours > 18: return "POR_VENCER"
        
        return "NORMAL"
