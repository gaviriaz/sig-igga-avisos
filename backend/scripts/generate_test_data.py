import pandas as pd
from datetime import datetime, timedelta
import random

def generate_dummy_geam(output_path: str):
    """
    Generador de datos GEAM ficticios para pruebas del sistema SIG IGGA (Costo 0).
    Alineado con las columnas reales del Excel de SharePoint.
    """
    
    avisos = [str(random.randint(60000000, 60999999)) for _ in range(10)]
    
    data = {
        "Aviso": avisos,
        "Prioridad": [random.choice(["CRÍTICO", "ALTO", "MEDIO", "BAJO"]) for _ in range(10)],
        "Tipo de gestión": [random.choice(["VEGETACIÓN", "CONSTRUCCIÓN", "OBRAS"]) for _ in range(10)],
        "Denominación": ["TRABAJO DE PRUEBA " + a for a in avisos],
        "Fecha de aviso": [(datetime.now() - timedelta(days=random.randint(1, 30))).strftime("%Y-%m-%d") for _ in range(10)],
        "Latitud (DEC)": [4.6 + (random.random() * 2) for _ in range(10)],
        "Longitud (DEC)": [-74.0 + (random.random() * 2) for _ in range(10)],
        "Status usuario": ["ABIE" for _ in range(10)],
        "Sector": ["NORTE" if i < 5 else "SUR" for i in range(10)],
        "Gestor predial": ["GESTO_A" if i % 2 == 0 else "GESTOR_B" for i in range(10)],
        "Municipio": ["BOGOTÁ" for _ in range(10)],
        "Departamento": ["CUNDINAMARCA" for _ in range(10)]
    }
    
    df = pd.DataFrame(data)
    df.to_excel(output_path, index=False)
    print(f"Excel de prueba generado: {output_path}")

if __name__ == "__main__":
    generate_dummy_geam("GEAM_N2_TEST.xlsx")
