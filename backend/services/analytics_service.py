from sqlalchemy.orm import Session
from sqlalchemy import func, text
from database.models import Aviso, SystemUser
from datetime import datetime, timedelta

class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_strategic_stats(self):
        """
        Retorna estadísticas estratégicas para el dashboard de Oficina.
        Criterio: Eficiencia SLA, Riesgo, Distribución Territorial.
        """
        now = datetime.now()
        
        # 1. Totales por Estado de Workflow
        states_raw = self.db.query(
            Aviso.estado_workflow_interno, 
            func.count(Aviso.aviso)
        ).group_by(Aviso.estado_workflow_interno).all()
        
        states = {str(k or 'INGRESADO').upper(): v for k, v in states_raw}

        # 2. Riesgo y SLA
        total_avisos = self.db.query(func.count(Aviso.aviso)).scalar() or 1
        critical_count = self.db.query(func.count(Aviso.aviso)).filter(Aviso.risk_score > 75).scalar() or 0
        vencidos_count = self.db.query(func.count(Aviso.aviso)).filter(Aviso.fin_deseado < now).scalar() or 0
        
        sla_efficiency = round(((total_avisos - vencidos_count) / total_avisos) * 100, 1)

        # 3. Datos por Municipio (Top 5 con más alertas)
        municipios_raw = self.db.query(
            Aviso.municipio, 
            func.count(Aviso.aviso)
        ).filter(Aviso.municipio.isnot(None))\
         .group_by(Aviso.municipio)\
         .order_by(func.count(Aviso.aviso).desc())\
         .limit(5).all()
        
        municipios = [{"name": n, "count": c} for n, c in municipios_raw]

        # 4. Tendencia (Avisos creados en los últimos 7 días)
        seven_days_ago = now - timedelta(days=7)
        new_this_week = self.db.query(func.count(Aviso.aviso)).filter(Aviso.created_at >= seven_days_ago).scalar() or 0

        # 5. Carga por Rol (Gestores activos)
        gestores_load = self.db.query(
            Aviso.gestor_predial, 
            func.count(Aviso.aviso)
        ).filter(Aviso.gestor_predial.isnot(None))\
         .group_by(Aviso.gestor_predial).all()
        
        gestores = [{"name": n, "count": c} for n, c in gestores_load]

        return {
            "summary": {
                "total": total_avisos,
                "critical": critical_count,
                "overdue": vencidos_count,
                "sla_efficiency": sla_efficiency,
                "new_this_week": new_this_week
            },
            "by_state": states,
            "top_municipios": municipios,
            "gestores_load": gestores,
            "timestamp": now.isoformat()
        }
