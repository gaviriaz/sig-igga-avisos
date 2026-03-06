import os
import sqlalchemy
from sqlalchemy import text
from dotenv import load_dotenv

def apply_performance_boost():
    load_dotenv()
    # Usamos el puerto 6543 (Pooler) que suele ser más estable en algunas redes
    base_url = os.environ.get("DATABASE_URL", "postgresql://postgres:lP5LvF5dkFzIjvEU@db.vdzfamjklmwlptitxvvd.supabase.co:5432/postgres")
    
    if ":5432" in base_url:
        db_url = base_url.replace(":5432", ":6543")
    else:
        db_url = base_url
    
    print(f"Conectando a {db_url.split('@')[-1]} (Pooler Mode)...")
    engine = sqlalchemy.create_engine(db_url, connect_args={"connect_timeout": 10})
    
    with engine.connect() as conn:
        with open("database/performance_boost.sql", "r", encoding="utf-8") as f:
            sql = f.read()
            
        print("Aplicando índices de rendimiento...")
        # Ejecutar por bloques separados por punto y coma si es necesario, 
        # pero text(sql) suele funcionar para scripts simples.
        # Para mayor seguridad ejecutamos cada comando.
        commands = sql.split(";")
        for cmd in commands:
            cmd = cmd.strip()
            if cmd:
                try:
                    conn.execute(text(cmd))
                    print(f"OK: {cmd[:50]}...")
                except Exception as e:
                    print(f"ERROR en: {cmd[:50]} -> {e}")
        
        conn.commit()
    print("¡Optimización de Base de Datos completada!")

if __name__ == "__main__":
    apply_performance_boost()
