import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def deploy_schema():
    print("🚀 Connecting to Supabase via psycopg2...")
    dsn = os.environ.get("DATABASE_URL", "postgresql://postgres:lP5LvF5dkFzIjvEU@db.vdzfamjklmwlptitxvvd.supabase.co:5432/postgres")
    
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    cur = conn.cursor()
    
    scripts = ['database/schema.sql', 'database/senior_master_deploy.sql']
    
    for script_path in scripts:
        print(f"📖 Reading {script_path}...")
        with open(script_path, 'r', encoding='utf-8') as f:
            sql = f.read()
            try:
                # Ejecutar el script completo. psycopg2 maneja bien los bloques $$
                cur.execute(sql)
                print(f"✅ Executed {script_path} successfully.")
            except Exception as e:
                print(f"❌ Error in {script_path}: {e}")
                conn.rollback() # En caso de que autocommit esté apagado o algo falle
                
    cur.close()
    conn.close()
    print("🎉 Done!")

if __name__ == '__main__':
    deploy_schema()
