"""
fix_dates.py — Script puntual de limpieza de BD.
Convierte strings no-fecha en columnas DateTime de la tabla 'aviso' a NULL.
Ejecutar UNA VEZ tras el cambio en ingesta_service.py:
    venv\Scripts\python.exe fix_dates.py
"""

import sqlite3
import re

DB_PATH = "sig_igga_local_dev.db"

DATE_COLUMNS = [
    "fecha_aviso", "inicio_deseado", "fin_deseado", "fecha_cierre",
    "fecha_inicial_tapf", "fecha_final_tapf", "fecha_el_reporte",
    "fecha_reunion", "fecha_ultimo_corte_visto", "created_at", "updated_at",
]

# Patrón básico ISO: empieza con 4 dígitos (año)
ISO_PATTERN = re.compile(r'^\d{4}[-/]\d{2}[-/]\d{2}')

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

for col in DATE_COLUMNS:
    # Verificar que la columna existe
    cur.execute("PRAGMA table_info(aviso)")
    cols = {row[1] for row in cur.fetchall()}
    if col not in cols:
        continue

    # Obtener valores distintos no-NULL ni vacíos en esa columna
    cur.execute(f'SELECT DISTINCT "{col}" FROM aviso WHERE "{col}" IS NOT NULL AND "{col}" != ""')
    values = [row[0] for row in cur.fetchall()]

    invalid = [v for v in values if not ISO_PATTERN.match(str(v))]

    if invalid:
        print(f"  [{col}] {len(invalid)} valores inválidos → NULL: {invalid[:5]}")
        for bad_val in invalid:
            cur.execute(
                f'UPDATE aviso SET "{col}" = NULL WHERE "{col}" = ?',
                (bad_val,)
            )
    else:
        print(f"  [{col}] OK — sin valores inválidos")

conn.commit()
conn.close()
print("\n✅ Limpieza de fechas completada. Reinicia el backend.")
