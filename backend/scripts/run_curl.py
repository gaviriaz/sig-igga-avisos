import requests; print(" Iniciando HTTP Request a SQLite...\); r = requests.post(\http://localhost:8000/dev/seed\); print(r.status_code); print(r.text)
