import pandas as pd
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text
from database.models import Aviso, AvisosRaw, ImportBatch, Dominio
import json

class IngestaService:
    def __init__(self, db: Session):
        self.db = db

    def process_excel(self, file_path: str, fecha_corte: datetime, source_name: str):
        """
        Procesa el Excel de IGGA y realiza la ingesta RAW y Normalizada.
        """
        print(f"DEBUG: Leyendo Excel {file_path}")
        df = pd.read_excel(file_path)
        
        # Generar ID de lote
        batch_id = str(uuid.uuid4())
        batch = ImportBatch(
            batch_id=batch_id,
            fecha_corte=fecha_corte,
            anio=fecha_corte.year,
            mes=str(fecha_corte.month),
            file_name=file_path.split("/")[-1],
            filas_procesadas=len(df),
            estado='SUCCESS'
        )
        self.db.add(batch)
        self.db.flush()

        count_new = 0
        count_updated = 0

        # Mapeo de columnas Excel -> Modelo (Normalización)
        # Adaptado a la tabla operativa del prompt
        mapping = {
            "Aviso": "aviso",
            "Prioridad": "prioridad_fuente",
            "Clase de aviso": "clase_aviso",
            "Zona trabajo": "zona_trabajo",
            "Ubicac.técnica": "ubicacion_tecnica",
            "Sector": "sector",
            "Denominación": "denominacion",
            "Descripción": "descripcion",
            "Fecha de aviso": "fecha_aviso",
            "Fin deseado": "fin_deseado",
            "Status usuario": "status_usuario",
            "Autor del aviso": "autor_aviso",
            "Pto.tbjo.resp.": "pto_trabajo_resp",
            "TIPO STATUS": "tipo_status",
            "TIPO DE LINEA": "tipo_de_linea",
            "MUNICIPIO": "municipio",
            "DEPARTAMENTO": "departamento",
            "LONGITUD (DEC)": "longitud_decimal",
            "LATITUD (DEC)": "latitud_decimal",
            "ZONA EJECUTORA": "zona_ejecutora",
            "GESTOR PREDIAL": "gestor_predial",
            "ASISTENTE PREDIAL": "asistente_predial",
            "ANALISTA AMBIENTAL": "analista_ambiental",
            "TIPO AVISO": "tipo_aviso",
            "TIPO DE GESTIÓN": "tipo_de_gestion",
            "REPROGRAMACIÓN": "reprogramacion",
            "JUSTIFICACIÓN REPRO": "justificacion_repro",
            "DISTANCIA COPA - FASE Ó FASE TIERRA": "distancia_copa_fase",
            "ALTURA INDIVIDUO": "altura_individuo",
            "CANTIDAD DE ARBOLES": "cantidad_arboles"
        }

        for _, row in df.iterrows():
            aviso_id = str(row.get("Aviso")).strip()
            if not aviso_id or aviso_id == "nan":
                continue

            # 1. Guardar en RAW (Inmutable)
            raw_entry = AvisosRaw(
                batch_id=batch_id,
                aviso=aviso_id,
                payload=row.to_dict()
            )
            self.db.add(raw_entry)

            # 2. Upsert en NORMALIZADA (aviso)
            aviso_obj = self.db.query(Aviso).filter(Aviso.aviso == aviso_id).first()
            is_new = False
            if not aviso_obj:
                aviso_obj = Aviso(aviso=aviso_id)
                self.db.add(aviso_obj)
                is_new = True
                count_new += 1
            else:
                count_updated += 1

            # Actualizar campos dinámicamente según mapeo
            for excel_col, model_attr in mapping.items():
                if excel_col in row:
                    val = row[excel_col]
                    # Limpieza básica de NaN
                    if pd.isna(val):
                        val = None
                    setattr(aviso_obj, model_attr, val)

            # Camper operativos extra
            aviso_obj.batch_id_actual = batch_id
            aviso_obj.not_presente_en_corte = False
            aviso_obj.fecha_ultimo_corte_visto = fecha_corte

        self.db.commit()
        print(f"LOG: Ingesta finalizada. Nuevos: {count_new}, Actualizados: {count_updated}")
        return batch_id
