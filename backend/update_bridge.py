import psycopg2
conn = psycopg2.connect("postgresql://postgres:lP5LvF5dkFzIjvEU@db.vdzfamjklmwlptitxvvd.supabase.co:5432/postgres")
cur = conn.cursor()
# link de Render (segun la respuesta del usuario)
render_url = 'https://sig-igga-avisos.onrender.com'
cur.execute("UPDATE system_config SET value = %s WHERE key = %s", (render_url, 'gateway_url'))
conn.commit()
print(f"Supabase Bridge actualizado: Auto-Discovery ahora apunta a {render_url}")
conn.close()
