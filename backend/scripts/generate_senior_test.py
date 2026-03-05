import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_senior_test_excel(filename="PLATINUM_TEST_DATA.xlsx"):
    """
    Genera un archivo Excel compatible con el nuevo modelo Senior Master.
    Incluye casos de Vegetación y Construcción para probar las reglas de validación.
    """
    data = [
        {
            "Aviso": "1000202601",
            "Denominación": "TORRE 45 - PODA CRÍTICA",
            "Tipo de Gestión": "VEGETACIÓN",
            "Prioridad": "CRÍTICO",
            "Distancia Copa - Fase ó Fase Tierra": 1.5,
            "Altura Individuo": 12.0,
            "Municipio": "MEDELLÍN",
            "Departamento": "ANTIOQUIA",
            "Latitud (Dec)": 6.2442,
            "Longitud (Dec)": -75.5812,
            "Status Usuario": "EN GESTIÓN",
            "TIPO STATUS": "GEAM",
            "Descripción": "Arbol de gran altura con riesgo de contacto inminente."
        },
        {
            "Aviso": "1000202602",
            "Denominación": "CONSTRUCCIÓN ILEGAL KM 12",
            "Tipo de Gestión": "CONSTRUCCIÓN",
            "Prioridad": "ALTO",
            "Tipo Construcción": "Vivienda Familiar",
            "Municipio": "BELLO",
            "Departamento": "ANTIOQUIA",
            "Latitud (Dec)": 6.3373,
            "Longitud (Dec)": -75.5579,
            "Status Usuario": "VALIDAR",
            "TIPO STATUS": "VALIDAR",
            "Descripción": "Excavación profunda iniciada en franja de servidumbre."
        }
    ]
    
    df = pd.DataFrame(data)
    # Rellenar con columnas faltantes para que el mapeador no falle
    all_cols = [
        "Aviso", "Clase de aviso", "Zona trabajo", "Ubicac.técnica", "Sector",
        "Denominación", "Descripción", "Fecha de aviso", "Inicio deseado",
        "Fin deseado", "Fecha de cierre", "Status usuario", "Status sistema",
        "Autor del aviso", "Pto.tbjo.resp.", "TIPO STATUS", "GESTIÓN AMBIENTAL PREDIAL",
        "TIPO DE LINEA", "ACTIVIDAD AMBIENTAL", "FECHA INICIAL TAPF", "FECHA FINAL TAPF",
        "PLAZO EJECUCIÓN", "ESTADO AMBIENTAL", "CAR", "PREDIO/PROPIETARIO",
        "MUNICIPIO", "DEPARTAMENTO", "GESTOR PREDIAL", "ASISTENTE PREDIAL",
        "ANALISTA AMBIENTAL", "ZONA EJECUTORA", "TIPO AVISO", "TIPO DE GESTIÓN",
        "REPROGRAMACIÓN", "JUSTIFICACIÓN REPRO", "DISTANCIA COPA - FASE Ó FASE TIERRA",
        "FECHA EL REPORTE", "OBSERVACIÓN DE RIESGO", "ESPECIE CON MÁS RIESGO",
        "ALTURA INDIVIDUO", "CANTIDAD DE ARBOLES", "VALOR ACUERDO / PRESUPUESTO",
        "TIPO CONSTRUCCIÓN", "LATITUD (DEC)", "LONGITUD (DEC)", "ACTIVIDAD PREDIAL",
        "OBSERVACIÓN PREDIAL", "PROGRAMACIÓN GESTOR (semana)", "LEGALIZACIÓN",
        "FECHA REUNIÓN", "COMPROMISOS"
    ]
    
    for col in all_cols:
        if col not in df.columns:
            df[col] = np.nan
            
    df.to_excel(filename, index=False)
    print(f"✅ Excel de prueba '{filename}' generado con éxito.")

if __name__ == "__main__":
    generate_senior_test_excel()
