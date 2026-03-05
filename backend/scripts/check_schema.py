import sqlite3
import os

db_path = "sig_igga_local_dev.db"
if not os.path.exists(db_path):
    print(f"Error: {db_path} no existe")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("--- Tablas ---")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    for t in tables:
        print(f"Tabla: {t[0]}")
        cursor.execute(f"PRAGMA table_info({t[0]})")
        cols = cursor.fetchall()
        for c in cols:
            print(f"  Col: {c[1]} ({c[2]})")
            
    print("\n--- Vistas ---")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='view';")
    views = cursor.fetchall()
    for v in views:
        print(f"Vista: {v[0]}")
        
    conn.close()
