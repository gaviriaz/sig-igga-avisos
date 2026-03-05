import os
import json
import uuid
import pandas as pd
from datetime import datetime
from typing import Optional

# Columnas que deben almacenarse como DateTime (None si el valor no es fecha válida)
DATE_COLUMNS = {
    "fecha_aviso", "inicio_deseado", "fin_deseado", "fecha_cierre",
    "fecha_inicial_tapf", "fecha_final_tapf", "fecha_el_reporte",
    "fecha_reunion", "fecha_ultimo_corte_visto", "created_at", "updated_at",
}
from sqlalchemy.orm import Session
from sqlalchemy import text
from services.asset_service import AssetService


class IngestaService:
    """
    Servicio de Ingesta y Upsert de Avisos (Versión Senior Master Platinum - SQLite Edition).
    """

    # Mapeo de columnas Excel -> Base de Datos
    COL_MAPPING = {
        "Aviso": "aviso",
        "Clase de aviso": "clase_aviso",
        "Zona trabajo": "zona_trabajo",
        "Ubicac.técnica": "ubicacion_tecnica",
        "Sector": "sector",
        "Denominación": "denominacion",
        "Descripción": "descripcion",
        "Fecha de aviso": "fecha_aviso",
        "Inicio deseado": "inicio_deseado",
        "Fin deseado": "fin_deseado",
        "Fecha de cierre": "fecha_cierre",
        "Status usuario": "status_usuario",
        "Status sistema": "status_sistema",
        "Autor del aviso": "autor_aviso",
        "Pto.tbjo.resp.": "pto_trabajo_resp",
        "TIPO STATUS": "tipo_status",
        "GESTIÓN AMBIENTAL PREDIAL": "gestion_ambiental_predial",
        "TIPO DE LINEA": "tipo_de_linea",
        "ACTIVIDAD AMBIENTAL": "actividad_ambiental",
        "FECHA INICIAL TAPF": "fecha_inicial_tapf",
        "FECHA FINAL TAPF": "fecha_final_tapf",
        "PLAZO EJECUCIÓN": "plazo_ejecucion",
        "ESTADO AMBIENTAL": "estado_ambiental",
        "CAR": "car",
        "PREDIO/PROPIETARIO": "predio_propietario",
        "MUNICIPIO": "municipio",
        "DEPARTAMENTO": "departamento",
        "GESTOR PREDIAL": "gestor_predial",
        "ASISTENTE PREDIAL": "asistente_predial",
        "ANALISTA AMBIENTAL": "analista_ambiental",
        "ZONA EJECUTORA": "zona_ejecutora",
        "TIPO AVISO": "tipo_aviso",
        "TIPO DE GESTIÓN": "tipo_de_gestion",
        "REPROGRAMACIÓN": "reprogramacion",
        "JUSTIFICACIÓN REPRO": "justificacion_repro",
        "DISTANCIA COPA - FASE Ó FASE TIERRA": "distancia_copa_fase",
        "FECHA EL REPORTE": "fecha_el_reporte",
        "OBSERVACIÓN DE RIESGO": "observacion_riesgo",
        "ESPECIE CON MÁS RIESGO": "especie_con_mas_riesgo",
        "ALTURA INDIVIDUO": "altura_individuo",
        "CANTIDAD DE ARBOLES": "cantidad_arboles",
        "VALOR ACUERDO / PRESUPUESTO": "valor_acuerdo_presupuesto",
        "TIPO CONSTRUCCIÓN": "tipo_construccion",
        "LATITUD (DEC)": "latitud_decimal",
        "LONGITUD (DEC)": "longitud_decimal",
        "ACTIVIDAD PREDIAL": "actividad_predial",
        "OBSERVACIÓN PREDIAL": "observacion_predial",
        "PROGRAMACIÓN GESTOR (semana)": "programacion_gestor",
        "LEGALIZACIÓN": "legalizacion",
        "FECHA REUNIÓN": "fecha_reunion",
        "COMPROMISOS": "compromisos",
        "PRIORIDAD": "prioridad_fuente",
    }

    def __init__(self, db_session: Session):
        self.db = db_session

    def _safe_value(self, v):
        """Convierte valores pandas a tipos Python seguros para SQLite."""
        if v is None:
            return None
        if isinstance(v, float) and (v != v):  # NaN check
            return None
        if isinstance(v, (pd.Timestamp, datetime)):
            return v.isoformat() if hasattr(v, 'isoformat') else str(v)
        if hasattr(v, 'item'):  # numpy scalars
            return v.item()
        return v

    def _safe_date(self, v):
        """Retorna un string ISO de fecha válido o None.
        Descarta strings no-fecha como 'NO APLICA', 'N/A', 'SIN FECHA', etc.
        """
        if v is None:
            return None
        if isinstance(v, float) and (v != v):  # NaN
            return None
        if isinstance(v, (pd.Timestamp, datetime)):
            return v.isoformat()
        # Si es string, intentar parsearlo
        s = str(v).strip()
        if not s or s.upper() in (
            'NO APLICA', 'NO APLICA.', 'N/A', 'NA', 'SIN FECHA',
            'PENDIENTE', 'NAN', 'NONE', '-', '--', ''
        ):
            return None
        try:
            return pd.to_datetime(s, dayfirst=True, errors='raise').isoformat()
        except Exception:
            return None

    def process_excel(self, file_path: str, fecha_corte: datetime, sharepoint_path: str) -> str:
        # 1. Leer Excel
        df = pd.read_excel(file_path, engine='openpyxl')
        batch_id = str(uuid.uuid4())
        file_name = os.path.basename(file_path)

        # 2. Registrar batch
        self.db.execute(text("""
            INSERT OR REPLACE INTO import_batch (batch_id, fecha_corte, anio, mes, file_name, filas_procesadas)
            VALUES (:b, :fc, :a, :m, :f, :r)
        """), {
            "b": batch_id,
            "fc": fecha_corte.isoformat(),
            "a": fecha_corte.year,
            "m": fecha_corte.strftime('%B').upper(),
            "f": file_name,
            "r": len(df)
        })

        # 3. Procesar filas
        ok = 0
        errors = []
        for idx, row in df.iterrows():
            aviso_id = str(row.get("Aviso", "")).strip()
            if not aviso_id or aviso_id.lower() == 'nan':
                continue
            try:
                # Snapshot RAW
                raw = {str(k): self._safe_value(v) for k, v in row.to_dict().items()}
                self.db.execute(text("""
                    INSERT INTO avisos_raw (batch_id, aviso, payload)
                    VALUES (:b, :a, :p)
                """), {"b": batch_id, "a": aviso_id, "p": json.dumps(raw, default=str)})

                # Upsert operacional
                self._upsert_operational(row, batch_id, fecha_corte)
                ok += 1
            except Exception as e:
                errors.append(f"Fila {idx} ({aviso_id}): {str(e)}")
                continue

        # 4. Marcar ausentes
        self._mark_absent(batch_id, fecha_corte)
        self.db.flush()

        if errors:
            print(f"⚠️ {len(errors)} filas con error en batch {batch_id}:")
            for err in errors[:5]:
                print(f"  - {err}")

        print(f"✅ Batch {batch_id}: {ok}/{len(df)} avisos procesados.")
        return batch_id

    def _upsert_operational(self, row: pd.Series, batch_id: str, fecha_corte: datetime):
        # Normalizar diccionario de fila
        row_dict = {}
        for k, v in row.to_dict().items():
            key = str(k).strip()
            row_dict[key] = self._safe_value(v)

        aviso_id = str(row_dict.get("Aviso", "")).strip()

        # Construir dict de datos mapeados
        data = {
            "aviso": aviso_id,
            "batch_id_actual": batch_id,
            "fecha_ultimo_corte_visto": fecha_corte.isoformat(),
            "not_presente_en_corte": 0,  # SQLite usa 0/1 para bool
        }

        for excel_col, db_col in self.COL_MAPPING.items():
            val = row_dict.get(excel_col)
            # Sanitizar campos de fecha: valores inválidos → None
            if db_col in DATE_COLUMNS:
                data[db_col] = self._safe_date(val)
            else:
                data[db_col] = val

        # Prioridad operativa solo en primer insert
        existing = self.db.execute(
            text("SELECT aviso FROM aviso WHERE aviso = :id"), {"id": aviso_id}
        ).fetchone()
        if not existing:
            data["prioridad_operativa"] = data.get("prioridad_fuente")

        # Risk Score
        risk = 0
        prio = str(data.get('prioridad_fuente', '')).upper()
        if 'CRÍTICO' in prio or 'CRITICO' in prio:
            risk += 50
        elif 'ALTO' in prio:
            risk += 30
        elif 'MEDIO' in prio:
            risk += 15

        gestion = str(data.get('tipo_de_gestion', '')).upper()
        if 'VEGETACIÓN' in gestion or 'VEGETACION' in gestion:
            try:
                dist = float(data.get('distancia_copa_fase') or 10)
                if dist < 2.5:
                    risk += 40
            except:
                pass

        data['risk_score'] = min(risk, 100)
        data['estado_workflow_interno'] = 'VALIDAR' if risk > 70 else 'Ingresado'

        # Geometría como WKT String (compatible SQLite)
        if data.get('latitud_decimal') and data.get('longitud_decimal'):
            try:
                lon = float(data['longitud_decimal'])
                lat = float(data['latitud_decimal'])
                if -180 <= lon <= 180 and -90 <= lat <= 90:
                    data['geom'] = f"POINT({lon} {lat})"
            except:
                pass

        # Auditoría de cambios
        if existing:
            existing_row = self.db.execute(
                text("SELECT * FROM aviso WHERE aviso = :id"), {"id": aviso_id}
            ).fetchone()
            if existing_row:
                existing_dict = dict(existing_row._mapping)
                for field, new_val in data.items():
                    if field in existing_dict and field not in ['batch_id_actual', 'fecha_ultimo_corte_visto', 'updated_at']:
                        old_val = existing_dict[field]
                        if str(old_val) != str(new_val) and old_val is not None and new_val is not None:
                            try:
                                self.db.execute(text("""
                                    INSERT INTO aviso_historial (aviso_id, campo, valor_anterior, valor_nuevo, batch_id, usuario)
                                    VALUES (:id, :c, :o, :n, :b, 'SISTEMA_ETL')
                                """), {"id": aviso_id, "c": field, "o": str(old_val), "n": str(new_val), "b": batch_id})
                            except:
                                pass

        # UPSERT final - INSERT OR REPLACE es más limpio y seguro en SQLite
        col_str = ", ".join(f'"{k}"' for k in data.keys())
        placeholder_str = ", ".join(f":{k}" for k in data.keys())
        self.db.execute(
            text(f"INSERT OR REPLACE INTO aviso ({col_str}) VALUES ({placeholder_str})"),
            data
        )

    def _mark_absent(self, batch_id: str, fecha_corte: datetime):
        self.db.execute(text("""
            UPDATE aviso
            SET not_presente_en_corte = 1
            WHERE batch_id_actual != :b AND not_presente_en_corte = 0
        """), {"b": batch_id})
