import asyncio
import httpx
import time
import statistics

# Configuración del test
RENDER_BASE_URL = "https://sig-igga-avisos.onrender.com"
CONCURRENT_USERS = 30
REQUESTS_PER_USER = 3
ENDPOINTS = [
    "/avisos",
    "/stats/strategic",
    "/domains/tipo_status",
    "/heartbeat"
]

async def simulate_user(user_id, results):
    """Simula un usuario navegando por la plataforma."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        user_times = []
        for i in range(REQUESTS_PER_USER):
            # Rotar endpoints
            endpoint = ENDPOINTS[i % len(ENDPOINTS)]
            start_time = time.time()
            try:
                print(f"User {user_id} requesting {endpoint}...")
                response = await client.get(f"{RENDER_BASE_URL}{endpoint}")
                duration = time.time() - start_time
                
                status = "OK" if response.status_code == 200 else f"ERROR {response.status_code}"
                results.append({
                    "user": user_id,
                    "endpoint": endpoint,
                    "duration": duration,
                    "status": status
                })
                print(f"User {user_id} - {endpoint}: {status} in {duration:.2f}s")
            except Exception as e:
                duration = time.time() - start_time
                results.append({
                    "user": user_id,
                    "endpoint": endpoint,
                    "duration": duration,
                    "status": f"FAILED: {str(e)}"
                })
                print(f"User {user_id} - {endpoint}: FAILED in {duration:.2f}s")
            
            # Pequeña espera entre clicks
            await asyncio.sleep(0.5)

async def run_load_test():
    print(f"🚀 Iniciando prueba de carga: {CONCURRENT_USERS} usuarios simultáneos...")
    print(f"Target: {RENDER_BASE_URL}")
    
    results = []
    tasks = []
    
    # Iniciar usuarios con un pequeño desfase para simular realidad (Senior Master Test)
    # pero manteniendo la concurrencia alta.
    start_test = time.time()
    for i in range(CONCURRENT_USERS):
        tasks.append(simulate_user(i, results))
        await asyncio.sleep(0.1)  # Staggered entry (3s total ramp up)
    
    await asyncio.gather(*tasks)
    total_time = time.time() - start_test
    
    # Reporte
    print("\n--- INFORME DE RENDIMIENTO ---")
    print(f"Tiempo Total: {total_time:.2f}s")
    
    durations = [r["duration"] for r in results if "OK" in r["status"]]
    errors = [r for r in results if "OK" not in r["status"]]
    
    if durations:
        print(f"Latencia Media: {statistics.mean(durations):.2f}s")
        print(f"Latencia Máxima: {max(durations):.2f}s")
        print(f"Latencia Mínima: {min(durations):.2f}s")
    
    print(f"Peticiones Totales: {len(results)}")
    print(f"Peticiones Exitosas: {len(durations)}")
    print(f"Peticiones Fallidas: {len(errors)}")
    
    if errors:
        print("\nDetalle de errores:")
        for e in errors[:5]:  # Mostrar los primeros 5
            print(f"- User {e['user']} en {e['endpoint']}: {e['status']}")

if __name__ == "__main__":
    asyncio.run(run_load_test())
