"""
Insumos Service - SIG IGGA Senior Master
Valida los insumos de campo: estructura de carpetas OneDrive, KML, checklist.
Gate de workflow: un aviso NO puede ir a campo si estado_insumos != COMPLETO.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session

from services.kml_validator import (
    validate_kml_content,
    check_proximity,
    get_buffer_for_tipo_gestion,
    validate_checklist
)


class InsumosService:
    """Servicio Principal de Insumos de Campo."""

    def __init__(self, db: Session):
        self.db = db

    def validate_from_url(self, aviso_id: str) -> dict:
        """
        Punto de entrada: valida los insumos asociados a un aviso.
        Como no tenemos acceso directo a OneDrive en este MVP,
        valida lo que ya fue registrado en la tabla aviso_insumos.
        """
        from database.models import Aviso, AvisoInsumo
        aviso = self.db.query(Aviso).filter(Aviso.aviso == aviso_id).first()
        if not aviso:
            return {"error": f"Aviso {aviso_id} no encontrado"}

        insumo = self.db.query(AvisoInsumo).filter(
            AvisoInsumo.aviso_id == aviso_id
        ).order_by(AvisoInsumo.ultima_valid_insumos.desc()).first()

        if not insumo:
            return {
                "aviso": aviso_id,
                "estado_insumos": "NO_CREADO",
                "message": "No se han registrado insumos para este aviso. Ingrese la URL de OneDrive."
            }

        return {
            "aviso": aviso_id,
            "estado_insumos": aviso.estado_insumos,
            "kml_files_count": insumo.kml_files_count,
            "kml_parse_ok": insumo.kml_parse_ok,
            "kml_within_buffer": insumo.kml_within_buffer,
            "kml_proximity_status": insumo.kml_proximity_status,
            "kml_min_distance_m": insumo.kml_min_distance_m,
            "kml_buffer_used_m": insumo.kml_buffer_used_m,
            "checklist_insumos": insumo.checklist_insumos,
            "ultima_validacion": insumo.ultima_valid_insumos.isoformat() if insumo.ultima_valid_insumos else None,
            "detalle": insumo.detalle_valid_json
        }

    def validate_kml_and_save(
        self,
        aviso_id: str,
        kml_content: str,
        subfolder_counts: dict,
        operator_user: str = "system"
    ) -> dict:
        """
        Valida un archivo KML cargado manualmente y actualiza el estado del aviso.
        
        Args:
            aviso_id: ID del aviso
            kml_content: Contenido XML del archivo KML
            subfolder_counts: {"predial": N, "inventario": N, "shp": N, "reporte": N}
            operator_user: Username del operador que carga el KML
        """
        from database.models import Aviso, AvisoInsumo

        aviso = self.db.query(Aviso).filter(Aviso.aviso == aviso_id).first()
        if not aviso:
            return {"error": f"Aviso {aviso_id} no encontrado"}

        # 1. Validar KML
        kml_result = validate_kml_content(kml_content)
        
        # 2. Verificar proximidad si hay coordenadas
        buffer_m = get_buffer_for_tipo_gestion(aviso.tipo_de_gestion, self.db)
        proximity = {"within_buffer": False, "min_distance_m": None, "proximity_status": "NOT_EVALUATED"}
        
        if aviso.latitud_decimal and aviso.longitud_decimal and kml_result["all_coords"]:
            proximity = check_proximity(
                kml_result["all_coords"],
                aviso.latitud_decimal,
                aviso.longitud_decimal,
                buffer_m
            )

        # 3. Validar checklist de subcarpetas
        checklist = validate_checklist(subfolder_counts, aviso.tipo_de_gestion)

        # 4. Determinar estado_insumos
        kml_ok = (
            kml_result["parse_ok"] and
            kml_result["valid_geom_count"] >= 1
        )
        geo_ok = (
            proximity["proximity_status"] in ("OK", "NOT_EVALUATED")
        )
        nuevo_estado = "COMPLETO" if (kml_ok and geo_ok and checklist["all_ok"]) else "INCOMPLETO"

        # 5. Guardar o actualizar en DB
        detalle = {
            "kml_validation": kml_result,
            "proximity": proximity,
            "checklist": checklist,
            "subfolder_counts": subfolder_counts,
            "operator": operator_user,
            "timestamp": datetime.utcnow().isoformat()
        }
        # Quitar coords para no saturar la DB
        detalle["kml_validation"].pop("all_coords", None)

        insumo = self.db.query(AvisoInsumo).filter(AvisoInsumo.aviso_id == aviso_id).first()
        if not insumo:
            insumo = AvisoInsumo(aviso_id=aviso_id)
            self.db.add(insumo)

        insumo.kml_files_count = 1
        insumo.kml_parse_ok = kml_result["parse_ok"]
        insumo.kml_feature_count = kml_result["feature_count"]
        insumo.kml_valid_geom_count = kml_result["valid_geom_count"]
        insumo.kml_geom_types = kml_result["geom_types"]
        insumo.kml_within_buffer = proximity["within_buffer"]
        insumo.kml_min_distance_m = proximity["min_distance_m"]
        insumo.kml_buffer_used_m = buffer_m
        insumo.kml_proximity_status = proximity["proximity_status"]
        insumo.checklist_insumos = checklist["checks"]
        insumo.ultima_valid_insumos = datetime.utcnow()
        insumo.detalle_valid_json = detalle

        # Actualizar estado en el aviso
        aviso.estado_insumos = nuevo_estado

        self.db.commit()

        return {
            "aviso": aviso_id,
            "estado_insumos": nuevo_estado,
            "kml_parse_ok": kml_result["parse_ok"],
            "kml_features": kml_result["feature_count"],
            "kml_valid_geoms": kml_result["valid_geom_count"],
            "kml_geom_types": kml_result["geom_types"],
            "kml_within_buffer": proximity["within_buffer"],
            "kml_min_distance_m": proximity["min_distance_m"],
            "kml_proximity_status": proximity["proximity_status"],
            "buffer_usado_m": buffer_m,
            "checklist": checklist["checks"],
            "gate_aprobado": nuevo_estado == "COMPLETO",
            "mensaje": "✅ Gate APROBADO - Aviso listo para campo." if nuevo_estado == "COMPLETO"
                       else "⚠️ Gate PENDIENTE - Faltan elementos antes de enviar a campo."
        }

    def can_go_to_field(self, aviso_id: str) -> dict:
        """
        Gate check: ¿Puede el aviso pasar a campo?
        """
        from database.models import Aviso
        aviso = self.db.query(Aviso).filter(Aviso.aviso == aviso_id).first()
        if not aviso:
            return {"can_go": False, "reason": "Aviso no encontrado"}

        blockers = []
        if aviso.estado_insumos != "COMPLETO":
            blockers.append(f"estado_insumos = '{aviso.estado_insumos}' (requiere COMPLETO)")
        if not aviso.assigned_to:
            blockers.append("Sin Gestor de Campo asignado")
        if not aviso.latitud_decimal or not aviso.longitud_decimal:
            blockers.append("Sin coordenadas georreferenciadas")

        return {
            "aviso": aviso_id,
            "can_go": len(blockers) == 0,
            "blockers": blockers if blockers else None,
            "estado_insumos": aviso.estado_insumos,
            "assigned_to": aviso.assigned_to
        }
