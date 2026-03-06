"""
KML Validator Service - SIG IGGA Senior Master
Valida estructura, geometría y proximidad espacial de archivos KML
contra el punto operativo del aviso.
"""
import xml.etree.ElementTree as ET
import math
from typing import Optional

# Namespace KML estándar
KML_NS = "{http://www.opengis.net/kml/2.2}"

def _haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distancia en metros entre dos puntos geográficos (Haversine)."""
    R = 6371000  # Radio de la Tierra en metros
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def _extract_coords_from_element(element) -> list:
    """Extrae todas las coordenadas (lon, lat) de un elemento KML."""
    coords = []
    for tag in ['coordinates', f'{KML_NS}coordinates']:
        for c_elem in element.iter(tag):
            text = c_elem.text.strip() if c_elem.text else ""
            for pair in text.split():
                parts = pair.split(',')
                if len(parts) >= 2:
                    try:
                        lon, lat = float(parts[0]), float(parts[1])
                        if -180 <= lon <= 180 and -90 <= lat <= 90:
                            coords.append((lon, lat))
                    except ValueError:
                        pass
    return coords

def validate_kml_content(kml_content: str) -> dict:
    """
    Valida el contenido de un archivo KML.
    Retorna un dict con el resultado de la validación.
    """
    result = {
        "parse_ok": False,
        "feature_count": 0,
        "valid_geom_count": 0,
        "geom_types": [],
        "all_coords": [],
        "error": None
    }

    try:
        root = ET.fromstring(kml_content)
    except ET.ParseError as e:
        result["error"] = f"KML Parse Error: {e}"
        return result

    result["parse_ok"] = True

    # Elementos de geometría válidos en KML
    geom_tags = [
        'Point', 'LineString', 'Polygon',
        'MultiGeometry', 'MultiPoint', 'MultiLineString', 'MultiPolygon',
        f'{KML_NS}Point', f'{KML_NS}LineString', f'{KML_NS}Polygon',
        f'{KML_NS}MultiGeometry',
    ]

    found_types = set()
    for tag in geom_tags:
        elements = root.iter(tag)
        for elem in elements:
            coords = _extract_coords_from_element(elem)
            if coords:
                short_tag = tag.replace(KML_NS, "")
                found_types.add(short_tag)
                result["all_coords"].extend(coords)
                result["valid_geom_count"] += 1

    # Contar Placemarks como features
    for tag in ['Placemark', f'{KML_NS}Placemark']:
        result["feature_count"] += len(list(root.iter(tag)))

    result["geom_types"] = list(found_types)
    return result


def check_proximity(kml_coords: list, aviso_lat: float, aviso_lon: float, buffer_m: int) -> dict:
    """
    Evalúa si alguna coordenada del KML cae dentro del buffer del aviso.
    """
    if not kml_coords or aviso_lat is None or aviso_lon is None:
        return {
            "within_buffer": False,
            "min_distance_m": None,
            "proximity_status": "NOT_EVALUATED"
        }

    min_dist = float('inf')
    for lon, lat in kml_coords:
        dist = _haversine_distance_m(aviso_lat, aviso_lon, lat, lon)
        if dist < min_dist:
            min_dist = dist

    within = min_dist <= buffer_m
    return {
        "within_buffer": within,
        "min_distance_m": round(min_dist, 2),
        "proximity_status": "OK" if within else "OUT_OF_BUFFER"
    }


def get_buffer_for_tipo_gestion(tipo_gestion: Optional[str], db=None) -> int:
    """
    Obtiene el buffer en metros para un tipo de gestión.
    Prioriza la configuración de la DB, con fallback a valores fijos.
    """
    # Valores por defecto del contrato de datos
    defaults = {
        "VEGETACIÓN": 200,
        "CONSTRUCCIÓN": 100,
        "OBRAS": 150,
    }

    if db and tipo_gestion:
        try:
            from sqlalchemy import text
            result = db.execute(
                text("SELECT buffer_m FROM cfg_kml_buffer_por_tipo_gestion WHERE tipo_gestion = :tg AND activo = TRUE"),
                {"tg": tipo_gestion.upper()}
            ).fetchone()
            if result:
                return result[0]
        except Exception:
            pass

    if tipo_gestion:
        return defaults.get(tipo_gestion.upper(), 150)
    return 150


def validate_checklist(counts: dict, tipo_gestion: Optional[str]) -> dict:
    """
    Valida que se cumplan los mínimos de archivos por subcarpeta
    según el tipo de gestión.
    """
    tg = (tipo_gestion or "").upper()
    checklist = {
        "PREDIAL": counts.get("predial", 0) >= 1,
        "INVENTARIO": counts.get("inventario", 0) >= 0,  # Siempre opcional
        "SHP": counts.get("shp", 0) >= 1,
        "REPORTE": counts.get("reporte", 0) >= 1,
    }

    if tg == "VEGETACIÓN":
        checklist["REPORTE"] = counts.get("reporte", 0) >= 1

    elif tg in ("CONSTRUCCIÓN", "OBRAS"):
        checklist["PREDIAL"] = counts.get("predial", 0) >= 1
        checklist["REPORTE"] = counts.get("reporte", 0) >= 1

    all_ok = all(checklist.values())
    return {"checks": checklist, "all_ok": all_ok}
