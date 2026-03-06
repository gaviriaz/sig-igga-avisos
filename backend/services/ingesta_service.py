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

    def process_excel(self, file_path: str, fecha_corte: datetime, source_name: str = "SYSTEM"):
        """
        Procesa el Excel de IGGA y realiza la ingesta RAW y Normalizada.
        Implementación Senior Master: Trazabilidad total y Contrato de Datos.
        """
        print(f"DEBUG: Iniciando Ingesta de {file_path}")
        try:
            df = pd.read_excel(file_path)
            df.columns = [c.strip() for c in df.columns]
        except Exception as e:
            raise Exception(f"No se pudo leer el archivo Excel: {str(e)}")
        
        # 1. Crear Batch de Importación
        batch_id = str(uuid.uuid4())
        batch = ImportBatch(
            batch_id=batch_id,
            fecha_corte=fecha_corte,
            anio=fecha_corte.year,
            mes=str(fecha_corte.month),
            file_name=file_path.split("/")[-1] if "/" in file_path else file_path.split("\\")[-1],
            filas_procesadas=len(df),
            estado='PROCESSING'
        )
        self.db.add(batch)
        self.db.flush()

        records_processed = 0
        for _, row in df.iterrows():
            try:
                aviso_id = str(row.get('Aviso'))
                if not aviso_id or aviso_id == 'nan':
                    continue

                # 2. Guardar Snapshot RAW (Inmutable)
                # Convertimos a dict y manejamos NaNs para el JSON
                row_dict = row.to_dict()
                clean_row = {k: (None if pd.isna(v) else v) for k, v in row_dict.items()}
                
                self.db.execute(text("""
                    INSERT INTO avisos_raw (aviso_id, batch_id, raw_content, created_at)
                    VALUES (:aviso, :batch, :raw, :now)
                """), {
                    "aviso": aviso_id,
                    "batch": batch_id,
                    "raw": json.dumps(clean_row),
                    "now": datetime.now()
                })

                # 3. Mapeo Normalizado (Contrato de Datos)
                prioridad_f = str(row.get('Prioridad', 'BAJA'))
                
                aviso_data = {
                    "aviso": aviso_id,
                    "prioridad_fuente": prioridad_f,
                    "prioridad_operativa": prioridad_f, 
                    "clase_aviso": str(row.get('Clase de aviso')) if pd.notna(row.get('Clase de aviso')) else None,
                    "denominacion": str(row.get('Denominación')) if pd.notna(row.get('Denominación')) else None,
                    "descripcion": str(row.get('Descripción')) if pd.notna(row.get('Descripción')) else None,
                    "zona_trabajo": str(row.get('Zona trabajo')) if pd.notna(row.get('Zona trabajo')) else None,
                    "ubicacion_tecnica": str(row.get('Ubicac.técnica')) if pd.notna(row.get('Ubicac.técnica')) else None,
                    "sector": str(row.get('Sector')) if pd.notna(row.get('Sector')) else None,
                    "municipio": str(row.get('Municipio')) if pd.notna(row.get('Municipio')) else None,
                    "departamento": str(row.get('Departamento')) if pd.notna(row.get('Departamento')) else None,
                    "latitud_decimal": row.get('LATITUD (DEC)') if pd.notna(row.get('LATITUD (DEC)')) else None,
                    "longitud_decimal": row.get('LONGITUD (DEC)') if pd.notna(row.get('LONGITUD (DEC)')) else None,
                    "estado_workflow_interno": "INGRESADO",
                    "tipo_status": str(row.get('TIPO STATUS', 'VALIDAR')),
                    "gestor_predial": str(row.get('GESTOR PREDIAL')) if pd.notna(row.get('GESTOR PREDIAL')) else None,
                    "tipo_de_gestion": str(row.get('TIPO DE GESTIÓN')) if pd.notna(row.get('TIPO DE GESTIÓN')) else None,
                    "batch_id_actual": batch_id,
                    "not_presente_en_corte": False,
                    "fecha_ultimo_corte_visto": fecha_corte,
                    "updated_at": datetime.now()
                }

                # 4. Cálculo de Riesgo Inicial
                from services.risk_service import RiskScoreService
                risk_svc = RiskScoreService()
                risk_data = risk_svc.calculate_risk(aviso_data)
                aviso_data.update(risk_data)

                # UPSERT en tabla operativa
                self._upsert_aviso(aviso_data)
                records_processed += 1

            except Exception as e:
                print(f"WARN: Error procesando fila {row.get('Aviso')}: {str(e)}")
                continue
        
        batch.estado = 'SUCCESS'
        batch.filas_procesadas = records_processed
        self.db.commit()
        return {"batch_id": batch_id, "processed": records_processed}

    def _upsert_aviso(self, data: dict):
        existing = self.db.query(Aviso).filter(Aviso.aviso == data['aviso']).first()
        if existing:
            for key, value in data.items():
                if hasattr(existing, key):
                    setattr(existing, key, value)
        else:
            new_aviso = Aviso(**data)
            self.db.add(new_aviso)
