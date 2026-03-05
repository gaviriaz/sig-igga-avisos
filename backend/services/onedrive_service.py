import requests
from typing import Dict, Any, List

class OneDriveInsumosService:
    """
    Control de estructura de carpetas de Insumos para Gestores de Campo.
    Estructura: {Aviso}/(PREDIAL | INVENTARIO | SHP | REPORTE)
    Costo 0 - MS Graph API.
    """

    SUB_FOLDERS = ["PREDIAL", "INVENTARIO", "SHP", "REPORTE"]

    def __init__(self, access_token: str, site_id: str):
        self.access_token = access_token
        self.site_id = site_id

    def validate_folder_structure(self, aviso_id: str, parent_folder_id: str) -> Dict[str, Any]:
        """
        Busca la carpeta {Aviso} y valida que sus subcarpetas existan y tengan contenido.
        """
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        # 1. Buscar carpeta raíz por nombre (Aviso)
        search_url = f"https://graph.microsoft.com/v1.0/sites/{self.site_id}/drive/items/{parent_folder_id}/children?$filter=name eq '{aviso_id}'"
        res = requests.get(search_url, headers=headers)
        res.raise_for_status()
        
        items = res.json().get("value", [])
        if not items:
            return {"status": "NO_CREADO", "missing": self.SUB_FOLDERS}
            
        aviso_folder_id = items[0]["id"]
        
        # 2. Listar hijos de la carpeta Aviso
        children_url = f"https://graph.microsoft.com/v1.0/sites/{self.site_id}/drive/items/{aviso_folder_id}/children"
        children_res = requests.get(children_url, headers=headers)
        children_res.raise_for_status()
        
        children = children_res.json().get("value", [])
        children_names = [c["name"].upper() for c in children]
        
        missing = [f for f in self.SUB_FOLDERS if f not in children_names]
        
        # 3. Validar contenido específico (Ej: SHP debe tener .kml)
        shp_content_status = self._check_shp_for_kml(children, headers)
        
        if not missing and shp_content_status["has_kml"]:
            return {"status": "COMPLETO", "missing": [], "details": shp_content_status}
        else:
            return {"status": "INCOMPLETO", "missing": missing, "details": shp_content_status}

    def _check_shp_for_kml(self, children: List[Dict], headers: Dict) -> Dict:
        """Busca archivos .kml dentro de la carpeta SHP."""
        shp_folder = next((c for c in children if c["name"].upper() == "SHP"), None)
        if not shp_folder:
            return {"has_kml": False, "count": 0}
            
        url = f"https://graph.microsoft.com/v1.0/sites/{self.site_id}/drive/items/{shp_folder['id']}/children"
        res = requests.get(url, headers=headers)
        res.raise_for_status()
        
        items = res.json().get("value", [])
        kml_files = [i for i in items if i["name"].lower().endswith(".kml")]
        
        return {
            "has_kml": len(kml_files) > 0,
            "count": len(kml_files),
            "files": [k["name"] for k in kml_files]
        }
