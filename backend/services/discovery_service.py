import re
from datetime import datetime, timedelta
import os

class DiscoveryService:
    @staticmethod
    def get_target_path():
        """
        Calcula la ruta esperada en SharePoint según el lineamiento 6.1.
        """
        now = datetime.now() # En producción ajustar a TZ Colombia
        anio = now.year
        
        meses = [
            "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
            "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
        ]
        mes_actual = meses[now.month - 1]
        
        # Patrón de archivo: GEAM_N2_dd_mm_yyyy.xlsx
        # Buscamos el viernes más cercano o el archivo con la fecha del nombre
        return {
            "root": "Gestion_Predial_OYM",
            "year": str(anio),
            "month": mes_actual,
            "expected_pattern": r"GEAM_N2_(\d{2})_(\d{2})_(\d{4})\.xlsx$"
        }

    @staticmethod
    def parse_date_from_filename(filename: str):
        pattern = r"GEAM_N2_(\d{2})_(\d{2})_(\d{4})\.xlsx$"
        match = re.search(pattern, filename)
        if match:
            day, month, year = match.groups()
            return datetime(int(year), int(month), int(day))
        return None

    @staticmethod
    def identify_latest_file(file_list: list):
        """
        Dada una lista de nombres de archivos, identifica el más reciente según la fecha del nombre.
        """
        valid_files = []
        for f in file_list:
            dt = DiscoveryService.parse_date_from_filename(f)
            if dt:
                valid_files.append({"name": f, "date": dt})
        
        if not valid_files:
            return None
            
        # Ordenar por fecha descendente
        valid_files.sort(key=lambda x: x['date'], reverse=True)
        return valid_files[0]
