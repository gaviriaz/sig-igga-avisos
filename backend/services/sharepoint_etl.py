import os
import re
import requests
from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel

class SharePointFile(BaseModel):
    name: str
    path: str
    last_modified: datetime
    fecha_corte: datetime
    size: int

class SharePointETLService:
    """
    Servicio de descubrimiento y descarga de archivos Excel en SharePoint. 
    Alineado a la estructura AÑO/MES (MAYÚSCULAS).
    0 USD - Usa MS Graph API con Auth Delegado.
    """
    
    FILE_PATTERN = re.compile(r"^GEAM_N2_(\d{2})_(\d{2})_(\d{4})\.xlsx$")
    MESES = [
        "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
        "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
    ]

    def __init__(self, tenant_id: str, client_id: str, client_secret: str, site_id: str):
        self.tenant_id = (tenant_id or "").strip()
        self.client_id = (client_id or "").strip()
        self.client_secret = (client_secret or "").strip()
        self.site_id = (site_id or "").strip()
        self.access_token: Optional[str] = None


    def get_token(self):
        """Autenticación 0 USD via MS Graph App registration."""
        url = f"https://login.microsoftonline.com/{self.tenant_id}/oauth2/v2.0/token"
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "scope": "https://graph.microsoft.com/.default",
            "grant_type": "client_credentials"
        }
        res = requests.post(url, data=data)
        if res.status_code != 200:
            error_details = res.json()
            error_msg = error_details.get("error_description", error_details.get("error", "Error desconocido en Azure AD"))
            print(f"❌ Error de Token Azure: {error_msg}")
            raise Exception(f"Autenticación Fallida: {error_msg}")
            
        self.access_token = res.json()["access_token"]
        return self.access_token


    def scan_latest_file(self) -> Optional[SharePointFile]:
        """
        Escanea la ruta específica de Consultas Semanales (Section 1).
        Estructura: GESTIÓN PREDIAL OYM/1. MTTO_2025/3. CONSULTAS SEMANALES/2026/MARZO/GEAM_N2_02_03_2026.xlsx
        """
        now = datetime.now()
        anio = str(now.year)
        mes_idx = now.month - 1
        mes_actual = self.MESES[mes_idx]
        
        # Ruta base según URL del usuario: O&M -> MTTO_2025 -> CONSULTAS SEMANALES
        # El encoding en Graph es vital: GESTION%20PREDIAL%20OYM
        base_path = f"GESTI%C3%93N%20PREDIAL%20OYM/1.%20MTTO_2025/3.%20CONSULTAS%20SEMANALES/{anio}/{mes_actual}"
        
        found_files: List[SharePointFile] = []
        files = self._list_graph_files(base_path)
        
        for f in files:
            if not f.get("file"): continue # Ignorar carpetas
            
            match = self.FILE_PATTERN.match(f["name"])
            if match:
                dd, mm, yyyy = match.groups()
                fecha_corte = datetime(int(yyyy), int(mm), int(dd))
                found_files.append(SharePointFile(
                    name=f["name"],
                    path=f["id"], # Graph DriveItem ID
                    last_modified=datetime.fromisoformat(f["lastModifiedDateTime"].replace("Z", "+00:00")),
                    fecha_corte=fecha_corte,
                    size=f["size"]
                ))
        
        if not found_files:
            # Fallback mes anterior si no hay datos en el actual aún
            mes_anterior = self.MESES[mes_idx - 1] if mes_idx > 0 else "DICIEMBRE"
            anio_fallback = anio if mes_idx > 0 else str(now.year - 1)
            fallback_path = f"GESTI%C3%93N%20PREDIAL%20OYM/1.%20MTTO_2025/3.%20CONSULTAS%20SEMANALES/{anio_fallback}/{mes_anterior}"
            files = self._list_graph_files(fallback_path)
            for f in files:
                if not f.get("file"): continue
                match = self.FILE_PATTERN.match(f["name"])
                if match:
                    dd, mm, yyyy = match.groups()
                    fecha_corte = datetime(int(yyyy), int(mm), int(dd))
                    found_files.append(SharePointFile(
                        name=f["name"],
                        path=f["id"],
                        last_modified=datetime.fromisoformat(f["lastModifiedDateTime"].replace("Z", "+00:00")),
                        fecha_corte=fecha_corte,
                        size=f["size"]
                    ))

        if not found_files:
            return None
        
        # Ordenar por fecha_corte y luego por fecha modificación
        latest = sorted(found_files, key=lambda x: (x.fecha_corte, x.last_modified), reverse=True)[0]
        return latest

    def _list_graph_files(self, folder_path: str) -> List[Dict]:
        """Llamada a MS Graph para listar archivos en una ruta específica."""
        if not self.access_token:
            self.get_token()
            
        # Graph API Endpoint para drive del sitio
        url = f"https://graph.microsoft.com/v1.0/sites/{self.site_id}/drive/root:/{folder_path}:/children"
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        res = requests.get(url, headers=headers)
        if res.status_code == 404:
            return []
        res.raise_for_status()
        return res.json().get("value", [])

    def download_file(self, drive_item_id: str, target_path: str):
        """Descarga el contenido del archivo desde Graph."""
        if not self.access_token:
            self.get_token()
            
        url = f"https://graph.microsoft.com/v1.0/sites/{self.site_id}/drive/items/{drive_item_id}/content"
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        res = requests.get(url, headers=headers, stream=True)
        res.raise_for_status()
        
        with open(target_path, "wb") as f:
            for chunk in res.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        return target_path

