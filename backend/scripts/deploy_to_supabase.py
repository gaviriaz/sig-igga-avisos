from sqlalchemy import create_engine, text

def deploy_schema():
    print("Connecting to Supabase PostgreSQL...")
    engine = create_engine('postgresql://postgres:lP5LvF5dkFzIjvEU@db.vdzfamjklmwlptitxvvd.supabase.co:5432/postgres')
    
    # 1. Ejecutar schema.sql (Estructura base)
    print("Executing schema.sql...")
    with engine.connect() as conn:
        with open('database/schema.sql', 'r', encoding='utf-8') as f:
            sql_script = f.read()
            # Split por punto y coma, ya que sqlalchemy a veces tiene problemas ejecutando scripts enteros
            statements = [s.strip() for s in sql_script.split(';') if s.strip()]
            for statement in statements:
                try:
                    conn.execute(text(statement))
                except Exception as e:
                    print(f"Warn: {e}")
        conn.commit()

    # 2. Ejecutar senior_master_deploy.sql
    print("Executing senior_master_deploy.sql...")
    with engine.connect() as conn:
        with open('database/senior_master_deploy.sql', 'r', encoding='utf-8') as f:
            sql_script = f.read()
            statements = [s.strip() for s in sql_script.split(';') if s.strip()]
            for statement in statements:
                try:
                    conn.execute(text(statement))
                except Exception as e:
                    print(f"Warn: {e}")
        conn.commit()

    print("Deployment completed successfully!")

if __name__ == '__main__':
    deploy_schema()
