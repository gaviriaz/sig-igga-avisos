import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:lP5LvF5dkFzIjvEU@db.vdzfamjklmwlptitxvvd.supabase.co:5432/postgres")

def run_setup():
    print(f"📡 Conectando a la DB para configurar auditoría...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        sql_path = os.path.join(os.path.dirname(__file__), "setup_audit.sql")
        with open(sql_path, "r", encoding="utf-8") as f:
            sql = f.read()
        
        print("🛠️ Ejecutando DDL (Tablas y Triggers)...")
        cur.execute(sql)
        conn.commit()
        
        print("✅ Configuración de auditoría completada con éxito.")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error configurando auditoría: {e}")

if __name__ == "__main__":
    run_setup()
