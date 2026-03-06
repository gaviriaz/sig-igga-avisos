import psycopg2
conn = psycopg2.connect("postgresql://postgres:lP5LvF5dkFzIjvEU@db.vdzfamjklmwlptitxvvd.supabase.co:5432/postgres")
cur = conn.cursor()
cur.execute("UPDATE system_config SET value = %s WHERE key = %s", ('http://localhost:8000', 'gateway_url'))
conn.commit()
print("Supabase Bridge actualizado: Auto-Discovery ahora apunta a http://localhost:8000")
conn.close()
