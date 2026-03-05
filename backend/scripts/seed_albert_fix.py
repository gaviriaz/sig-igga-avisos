import psycopg2
DSN = "postgresql://postgres:lP5LvF5dkFzIjvEU@db.vdzfamjklmwlptitxvvd.supabase.co:5432/postgres"

def seed_albert():
    conn = psycopg2.connect(DSN)
    cur = conn.cursor()
    
    # Asegurar que existan los dominios básicos para que el frontend no falle
    cur.execute("DELETE FROM dominio") # Limpiar para re-seed
    dominios = [
        ('INGRESADO', 'workflow_status', 'INGRESADO', 'Ingresado'),
        ('EN_GESTION', 'workflow_status', 'EN_GESTION', 'En Gestión de Campo'),
        ('VALIDAR_QA', 'workflow_status', 'VALIDAR_QA', 'Pendiente QA'),
        ('APROBADO', 'workflow_status', 'APROBADO', 'Aprobado'),
        ('CERRADO', 'workflow_status', 'CERRADO', 'Cerrado')
    ]
    for d in dominios:
        cur.execute("INSERT INTO dominio (codigo, tipo, valor, descripcion) VALUES (%s, %s, %s, %s)", d)

    # Seed Albert
    cur.execute("""
        INSERT INTO app_system_user (username, full_name, email, role, zona_ejecutora, activo, created_at) 
        VALUES ('agaviria', 'Albert Gaviria', 'agaviria@igga.com.co', 'Administrador', 'NACIONAL', true, NOW())
        ON CONFLICT (username) DO NOTHING
    """)
    
    conn.commit()
    cur.close()
    conn.close()
    print("SUCCESS: Albert and Domains seeded.")

if __name__ == "__main__":
    seed_albert()
