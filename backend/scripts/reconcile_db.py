import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

table_cols = {
    "import_batch": [
        ("batch_id", "TEXT"),
        ("fecha_corte", "TIMESTAMP"),
        ("anio", "INTEGER"),
        ("mes", "TEXT"),
        ("file_name", "TEXT"),
        ("file_hash", "TEXT"),
        ("filas_procesadas", "INTEGER"),
        ("estado", "TEXT"),
        ("created_at", "TIMESTAMP"),
    ],
    "avisos_raw": [
        ("batch_id", "TEXT"),
        ("aviso", "TEXT"),
        ("payload", "JSONB"),
        ("created_at", "TIMESTAMP"),
    ],
    "aviso": [
        ("aviso", "TEXT"),
        ("prioridad", "TEXT"), # Existent in DB but not in model, keeping it
        ("clase_aviso", "TEXT"),
        ("zona_trabajo", "TEXT"),
        ("ubicacion_tecnica", "TEXT"),
        ("sector", "TEXT"),
        ("denominacion", "TEXT"),
        ("descripcion", "TEXT"),
        ("fecha_aviso", "TIMESTAMP"),
        ("inicio_deseado", "TIMESTAMP"),
        ("fin_deseado", "TIMESTAMP"),
        ("fecha_cierre", "TIMESTAMP"),
        ("status_usuario", "TEXT"),
        ("status_sistema", "TEXT"),
        ("autor_aviso", "TEXT"),
        ("pto_trabajo_resp", "TEXT"),
        ("tipo_status", "TEXT"),
        ("gestion_ambiental_predial", "TEXT"),
        ("tipo_de_linea", "TEXT"),
        ("actividad_ambiental", "TEXT"),
        ("fecha_inicial_tapf", "TIMESTAMP"),
        ("fecha_final_tapf", "TIMESTAMP"),
        ("plazo_ejecucion", "TEXT"),
        ("estado_ambiental", "TEXT"),
        ("car", "TEXT"),
        ("predio_propietario", "TEXT"),
        ("municipio", "TEXT"),
        ("departamento", "TEXT"),
        ("gestor_predial", "TEXT"),
        ("asistente_predial", "TEXT"),
        ("analista_ambiental", "TEXT"),
        ("zona_ejecutora", "TEXT"),
        ("tipo_aviso", "TEXT"),
        ("tipo_de_gestion", "TEXT"),
        ("reprogramacion", "TEXT"),
        ("justificacion_repro", "TEXT"),
        ("distancia_copa_fase", "NUMERIC"),
        ("fecha_el_reporte", "TIMESTAMP"),
        ("observacion_riesgo", "TEXT"),
        ("especie_con_mas_riesgo", "TEXT"),
        ("altura_individuo", "NUMERIC"),
        ("cantidad_arboles", "INTEGER"),
        ("valor_acuerdo_presupuesto", "NUMERIC"),
        ("tipo_construccion", "TEXT"),
        ("latitud_decimal", "NUMERIC"),
        ("longitud_decimal", "NUMERIC"),
        ("actividad_predial", "TEXT"),
        ("observacion_predial", "TEXT"),
        ("programacion_gestor", "TEXT"),
        ("legalizacion", "TEXT"),
        ("fecha_reunion", "TIMESTAMP"),
        ("compromisos", "TEXT"),
        ("estado_workflow_interno", "TEXT"),
        ("not_presente_en_corte", "BOOLEAN"),
        ("fecha_ultimo_corte_visto", "TIMESTAMP"),
        ("batch_id_actual", "TEXT"),
        ("risk_score", "INTEGER"),
        ("prioridad_fuente", "TEXT"),
        ("prioridad_operativa", "TEXT"),
        ("flag_intervencion_franja", "BOOLEAN"),
        ("distancia_estructura", "NUMERIC"),
        ("riesgo_cimentacion", "TEXT"),
        ("ruta_insumos_onedrive", "TEXT"),
    ],
    "notificacion": [
        ("usuario", "TEXT"),
        ("titulo", "TEXT"),
        ("mensaje", "TEXT"),
        ("tipo", "TEXT"),
        ("leida", "BOOLEAN"),
        ("created_at", "TIMESTAMP"),
    ],
    "user_preference": [
        ("usuario", "TEXT"),
        ("theme", "TEXT"),
        ("zen_mode", "BOOLEAN"),
        ("notificaciones_email", "BOOLEAN"),
        ("config_json", "JSONB"),
        ("updated_at", "TIMESTAMP"),
    ],
    "aviso_comentario": [
        ("aviso_id", "TEXT"),
        ("comentario", "TEXT"),
        ("usuario", "TEXT"),
        ("created_at", "TIMESTAMP"),
    ]
}

with engine.connect() as conn:
    for table, cols in table_cols.items():
        print(f"Reconciling table {table}...")
        # Create table if not exists (minimal)
        conn.execute(text(f"CREATE TABLE IF NOT EXISTS {table} (id SERIAL PRIMARY KEY)"))
        conn.commit()
        
        for col, dtype in cols:
            try:
                print(f"  Adding {col} to {table}...")
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col} {dtype}"))
                conn.commit()
            except Exception as e:
                print(f"  Error adding {col} to {table}: {e}")

print("Done.")
