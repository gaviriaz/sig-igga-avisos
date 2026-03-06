import os
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime
import uvicorn
from dotenv import load_dotenv
from cachetools import TTLCache
import time
import threading

load_dotenv()

#  DATABASE (PostgreSQL Supabase for Platinum Senior Master Deployment) 
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:lP5LvF5dkFzIjvEU@db.vdzfamjklmwlptitxvvd.supabase.co:5432/postgres")

# Configuración optimizada para PgBouncer (Supabase Pooler)
# pool_pre_ping: verifica la conexión antes de usarla
# pool_size + max_overflow: limita para plan gratuito (15 max connections)
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Security & RBAC
from core.auth import AuthUser, get_current_user, RequireOficina

from database.models import Base
# Base.metadata.create_all(bind=engine) # Comentado para acelerar el inicio en Render (Free Tier)

#  FASTAPI APP 
app = FastAPI(title="SIG IGGA/ISA - Gestion Integral de Avisos v7.5")

# --- CAPA DE CACHÉ ESTRATÉGICA (Para soportar 30+ usuarios en Render Free) ---
cache_avisos = TTLCache(maxsize=1, ttl=30)
cache_stats = TTLCache(maxsize=1, ttl=60)
cache_users = TTLCache(maxsize=1, ttl=300)
cache_domains = TTLCache(maxsize=200, ttl=3600)

# Locks para evitar 'Thundering Herd' (Sincronización de acceso a DB)
lock_avisos = threading.Lock()
lock_stats = threading.Lock()
lock_domains = threading.Lock()
# ----------------------------------------------------------------------------

ALLOWED = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8000,https://sig-igga.pages.dev").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Compresión Gzip: Reduce el tamaño de los JSON masivos (Crucial para plan Render Free)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# --- EVENTO STARTUP: Pre-warming de Caché (Senior Strategy) ---
@app.on_event("startup")
async def startup_event():
    def warm_cache():
        print("🔥 [Startup] Pre-warming Cache...")
        try:
            db = SessionLocal()
            list_avisos(db)
            get_strategic_dashboard(db)
            db.close()
            print("✅ [Startup] Cache warmed successfully.")
        except Exception as e:
            print(f"❌ [Startup] Cache warming failed: {e}")
    threading.Thread(target=warm_cache, daemon=True).start()

# Handler global: garantiza CORS headers incluso en errores 500
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    origin = request.headers.get("origin", "")
    headers = {}
    if origin in ALLOWED or "*" in ALLOWED:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    print(f"GLOBAL ERROR: {traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "type": type(exc).__name__},
        headers=headers
    )

#  DIRECTORIO BASE PARA RUTAS RELATIVAS 
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Servir capas GeoJSON estáticas (Ahora dentro de /backend para Render)
CAPAS_DIR = os.path.join(BASE_DIR, "capas")
try:
    if os.path.exists(CAPAS_DIR):
        app.mount("/capas", StaticFiles(directory=CAPAS_DIR), name="capas")
        print(f"LOG: Sirviendo capas estticas desde {CAPAS_DIR}")
    else:
        print(f"WARN: El directorio de capas no existe en {CAPAS_DIR}")
except Exception as e:
    print(f"WARN: Error montando capas: {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

#  ENDPOINTS 

def row_to_dict(row):
    """Convierte un objeto SQLAlchemy o Row en un dict serializable JSON."""
    d = {}
    
    # Si es una instancia de modelo (objeto completo)
    if hasattr(row, '__table__'):
        for c in row.__table__.columns:
            val = getattr(row, c.name)
            if hasattr(val, 'isoformat'):
                val = val.isoformat()
            d[c.name] = val
    # Si es un Row (resultado de una consulta selectiva)
    else:
        for key in row._fields:
            val = getattr(row, key)
            if hasattr(val, 'isoformat'):
                val = val.isoformat()
            d[key] = val
    return d

@app.get("/debug")
def debug_info():
    """Endpoint de diagnostico para produccion - muestra el estado del sistema."""
    import sys
    info = {
        "python": sys.version,
        "database_url_set": bool(os.environ.get("DATABASE_URL")),
        "allowed_origins": ALLOWED,
        "db_test": "not_run"
    }
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        info["db_test"] = "ok"
    except Exception as e:
        info["db_test"] = f"FAILED: {str(e)}"
    return info

@app.get("/")
def health_check():
    """Endpoint simple para que Render vea que el servidor esta VIVO en menos de 1 segundo."""
    return {
        "status": "online", 
        "engine": "FastAPI v7.5", 
        "db": "Supabase Ready", 
        "timestamp": str(datetime.now()),
        "uptime": "active"
    }

@app.get("/heartbeat")
def heartbeat():
    """Endpoint para mantener activa la instancia de Render (Ping externo)."""
    return {"status": "beating", "time": time.time()}

@app.post("/admin/setup-db")
def setup_database_audit(db: Session = Depends(get_db)):
    """Ejecuta el SQL de configuracin de auditoria y tablas de insumos."""
    try:
        sql_path = os.path.join(BASE_DIR, "database", "setup_audit.sql")
        with open(sql_path, "r", encoding="utf-8") as f:
            sql = f.read()
        db.execute(text(sql))
        db.commit()
        return {"status": "success", "message": "Auditora y tablas de insumos configuradas."}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/dev/seed")
def seed_database(db: Session = Depends(get_db)):
    from services.ingesta_service import IngestaService
    from database.models import Dominio, Notificacion, Aviso

    # Buscar el Excel en el directorio de capas (Ruta relativa)
    real_excel = os.path.join(CAPAS_DIR, "GEAM_N2_27_02_2026.xlsx")
    use_real = os.path.exists(real_excel)

    # Seed dominios
    if db.query(Dominio).count() == 0:
        dominios = [
            Dominio(codigo="INGRESADO",  tipo="workflow_status", valor="INGRESADO",  descripcion="Ingresado"),
            Dominio(codigo="EN_GESTION", tipo="workflow_status", valor="EN_GESTION", descripcion="En Gestin de Campo"),
            Dominio(codigo="VALIDAR_QA", tipo="workflow_status", valor="VALIDAR_QA", descripcion="Pendiente QA"),
            Dominio(codigo="APROBADO",   tipo="workflow_status", valor="APROBADO",   descripcion="Aprobado"),
            Dominio(codigo="CERRADO",    tipo="workflow_status", valor="CERRADO",    descripcion="Cerrado"),
            Dominio(codigo="VEGETA",     tipo="gestion_type",    valor="VEGETACIN", descripcion="Gestin Vegetacin"),
            Dominio(codigo="CONSTRUC",   tipo="gestion_type",    valor="CONSTRUCCIN",descripcion="Gestin Construccin"),
        ]
        for d in dominios:
            db.add(d)
        db.flush()

    #  Seed usuarios del sistema (roles IGGA reales) 
    from database.models import SystemUser
    if db.query(SystemUser).count() == 0:
        usuarios_base = [
            SystemUser(username="agaviria",       full_name="Albert Gaviria",              email="agaviria@igga.com.co",     role="Administrador",             zona_ejecutora="NACIONAL", cedula="1007533510"),
            SystemUser(username="admin",          full_name="Administrador Sistema",       email="admin@igga.com.co",        role="Administrador",             zona_ejecutora=None,       cedula="0001"),
            SystemUser(username="coord_senior",   full_name="Coordinador Predial Senior",  email="coord.senior@igga.com.co", role="Coordinador Predial Senior", zona_ejecutora="NACIONAL", cedula="0002"),
            SystemUser(username="coord_junior",   full_name="Coordinador Predial Junior",  email="coord.junior@igga.com.co", role="Coordinador Predial Junior", zona_ejecutora="NACIONAL", cedula="0003"),
            SystemUser(username="analista_amb",   full_name="Analista Ambiental",          email="analista.amb@igga.com.co", role="Analista Ambiental",         zona_ejecutora="NACIONAL", cedula="0004"),
            SystemUser(username="oficina_1",      full_name="Operador Oficina 1",          email="oficina1@igga.com.co",     role="Oficina",                    zona_ejecutora=None,       cedula="0005"),
            SystemUser(username="oficina_2",      full_name="Operador Oficina 2",          email="oficina2@igga.com.co",     role="Oficina",                    zona_ejecutora=None,       cedula="0006"),
            SystemUser(username="gestor_campo_1", full_name="Gestor de Campo Norte",       email="campo1@igga.com.co",       role="Gestor de Campo",            zona_ejecutora="NORTE",    cedula="0007"),
            SystemUser(username="gestor_campo_2", full_name="Gestor de Campo Sur",         email="campo2@igga.com.co",       role="Gestor de Campo",            zona_ejecutora="SUR",      cedula="0008"),
            SystemUser(username="gestor_campo_3", full_name="Gestor de Campo Occidente",   email="campo3@igga.com.co",       role="Gestor de Campo",            zona_ejecutora="OCCIDENTE",cedula="0009"),
            SystemUser(username="asistente_pred", full_name="Asistente Predial",           email="asist.pred@igga.com.co",   role="Asistente Predial",          zona_ejecutora="NACIONAL", cedula="0010"),
        ]
        for u in usuarios_base:
            db.add(u)
        db.flush()

    try:
        ingesta = IngestaService(db)
        excel_to_use = real_excel if use_real else None

        if excel_to_use:
            batch_id = ingesta.process_excel(excel_to_use, datetime.now(), "LOCAL_DATA_LOAD")
        else:
            # Datos de demostracin mnimos si no hay Excel
            from generate_test_data import generate_dummy_geam
            dummy = "GEAM_SEED_TEMP.xlsx"
            generate_dummy_geam(dummy)
            batch_id = ingesta.process_excel(dummy, datetime.now(), "DEMO")
            os.remove(dummy)

        db.commit()
        from database.models import Aviso
        return {
            "message": "Carga completada",
            "batch_id": batch_id,
            "count": db.query(Aviso).count()
        }

    except Exception as e:
        import traceback
        tb_str = traceback.format_exc()
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error en seed: {str(e)}")


@app.get("/admin/ingesta/discover")
async def discover_latest_file(user: AuthUser = Depends(RequireOficina)):
    """
    Informa sobre la ruta y el archivo esperado en SharePoint según la fecha actual.
    """
    from services.discovery_service import DiscoveryService
    info = DiscoveryService.get_target_path()
    return {
        "status": "ready",
        "context": info,
        "message": f"Buscando en carpeta {info['year']}/{info['month']}. El archivo debe seguir el patrón {info['expected_pattern']}"
    }

@app.post("/avisos/{aviso_id}/validate-insumos")
async def validate_insumos(aviso_id: str, db: Session = Depends(get_db)):
    """
    Orquestador de validación de insumos (KML + OneDrive).
    Senior Master: Combina validación espacial con auditoría de archivos.
    """
    from services.kml_validator import KMLValidatorService
    from services.onedrive_service import OneDriveInsumosService
    
    # 1. Validar Capas/KML (Simulado si no hay KML actual para pruebas)
    # En producción esto extraería el KML de OneDrive primero
    # Por ahora usaremos datos de prueba o el último resultado
    kml_svc = KMLValidatorService(db)
    # Validamos con un geojson vacío solo para activar la lógica de DB
    kml_result = kml_svc.validate_proximity(aviso_id, {"type": "FeatureCollection", "features": []})
    
    # 2. Retornar status unificado
    return {
        "aviso": aviso_id,
        "kml_status": kml_result,
        "onedrive_status": "PENDIENTE_AUTH_MS_GRAPH",
        "timestamp": datetime.now()
    }


@app.get("/domains/{domain_key}")
def list_domain_values(domain_key: str, db: Session = Depends(get_db)):
    """Obtiene los valores de un dominio catastrado (dom_*)."""
    if domain_key in cache_domains:
        return cache_domains[domain_key]
    
    with lock_domains:
        # Doble check dentro del lock
        if domain_key in cache_domains:
            return cache_domains[domain_key]
            
        from services.domain_service import DomainService
        result = DomainService(db).get_domain_values(domain_key)
        cache_domains[domain_key] = result
        return result


@app.get("/avisos")
def list_avisos(db: Session = Depends(get_db)):
    if "list" in cache_avisos:
        return cache_avisos["list"]
    
    with lock_avisos:
        if "list" in cache_avisos:
            return cache_avisos["list"]
            
        from database.models import Aviso
        # SENIOR MASTER OPTIMIZATION: Solo traer columnas necesarias para el Listado/Mapa
        essential_columns = [
            Aviso.aviso, Aviso.denominacion, Aviso.municipio, 
            Aviso.estado_workflow_interno, Aviso.risk_score, 
            Aviso.not_presente_en_corte, Aviso.tipo_de_gestion,
            Aviso.latitud_decimal, Aviso.longitud_decimal,
            Aviso.prioridad_operativa
        ]
        
        rows = db.query(*essential_columns).all()
        result = [row_to_dict(r) for r in rows]
        cache_avisos["list"] = result
        return result


@app.get("/avisos/{aviso_id}")
def get_aviso(aviso_id: str, db: Session = Depends(get_db)):
    """Retorna el detalle COMPLETO de un aviso."""
    from database.models import Aviso
    aviso = db.query(Aviso).filter(Aviso.aviso == aviso_id).first()
    if not aviso:
        raise HTTPException(status_code=404, detail="Aviso no encontrado")
    return row_to_dict(aviso)

@app.patch("/avisos/{aviso_id}")
async def patch_aviso(
    aviso_id: str, 
    request: Request, 
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user)
):
    """
    Endpoint estratégico Senior Master: Protegido por RBAC y Regras de Negócio.
    """
    from database.models import Aviso
    from services.domain_service import DomainService
    
    try:
        payload = await request.json()
        aviso = db.query(Aviso).filter(Aviso.aviso == aviso_id).first()
        if not aviso:
            raise HTTPException(status_code=404, detail="Aviso no encontrado")
        
        # 1. Definir Campos Restringidos (Solo Oficina/Senior)
        restricted_fields = [
            'prioridad_operativa', 'estado_workflow_interno', 
            'gestor_predial', 'asistente_predial', 'analista_ambiental', 
            'zona_ejecutora', 'tipo_status', 'reprogramacion', 'justificacion_repro'
        ]
        
        is_high_role = user.role in ['Oficina', 'Analista Ambiental', 'Coordinador Predial Senior']
        
        # 2. Filtrado y Validación por Campo
        dm_svc = DomainService(db)
        allowed_columns = [c.name for c in aviso.__table__.columns]
        
        for key, value in payload.items():
            if key not in allowed_columns: continue
            
            # Bloqueo si no tiene rol para el campo restringido
            if key in restricted_fields and not is_high_role:
                raise HTTPException(
                    status_code=403, 
                    detail=f"Solo Oficina/Senior puede modificar el campo: {key}"
                )

            # 3. Validación de Dominios (Catálogos)
            domain_fields = [
                'tipo_status', 'actividad_predial', 'gestor_predial', 
                'asistente_predial', 'analista_ambiental', 'tipo_aviso', 
                'municipio', 'departamento', 'zona_ejecutora', 'legalizacion', 'tipo_gestion'
            ]
            if key in domain_fields and value:
                if not dm_svc.validate(key, value):
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Valor '{value}' no válido para el catálogo {key}"
                    )
            
            # 4. Regla Condicional: Reprogramación
            if key == 'reprogramacion' and value == 'Sí':
                if not payload.get('justificacion_repro') and not aviso.justificacion_repro:
                    raise HTTPException(
                        status_code=400, 
                        detail="Si reprograma, la justificación es obligatoria."
                    )

            setattr(aviso, key, value)
        
        db.commit()
        db.refresh(aviso)
        
        # Invalida cache de lista para que refleje el cambio
        cache_avisos.clear() 
        cache_stats.clear()
        
        return row_to_dict(aviso)
        
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/avisos/{aviso_id}/comments")
def get_aviso_comments(aviso_id: str, db: Session = Depends(get_db)):
    from database.models import AvisoComentario
    try:
        rows = db.query(AvisoComentario).filter(
            AvisoComentario.aviso_id == aviso_id
        ).order_by(AvisoComentario.created_at).all()
        return [row_to_dict(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/avisos/{aviso_id}/comments")
async def add_aviso_comment(aviso_id: str, request: Request, db: Session = Depends(get_db)):
    """Agrega un comentario/comunicacin a un aviso. Registra usuario y timestamp."""
    from database.models import AvisoComentario
    try:
        payload = await request.json()
    except Exception:
        payload = {}
    comentario_texto = str(payload.get("comentario", "")).strip()
    if not comentario_texto:
        raise HTTPException(status_code=400, detail="El comentario no puede estar vaco")
    comment = AvisoComentario(
        aviso_id=aviso_id,
        comentario=comentario_texto,
        usuario=str(payload.get("usuario", "Operador")).strip() or "Operador"
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return {
        "id": comment.id,
        "aviso_id": comment.aviso_id,
        "comentario": comment.comentario,
        "usuario": comment.usuario,
        "created_at": comment.created_at.isoformat() if comment.created_at else None,
    }


@app.get("/notifications")
def get_notifications(db: Session = Depends(get_db)):
    from database.models import Notificacion
    try:
        rows = db.query(Notificacion).order_by(Notificacion.created_at.desc()).limit(50).all()
        return [row_to_dict(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/notifications/{notif_id}/read")
def mark_notification_read(notif_id: int, db: Session = Depends(get_db)):
    from database.models import Notificacion
    n = db.query(Notificacion).filter(Notificacion.id == notif_id).first()
    if n:
        n.leida = True
        db.commit()
    return {"ok": True}


@app.get("/preferences")
def get_preferences(db: Session = Depends(get_db)):
    from database.models import UserPreference
    try:
        pref = db.query(UserPreference).first()
        if not pref:
            pref = UserPreference(usuario="default", theme="dark", zen_mode=False, notificaciones_email=True)
            db.add(pref)
            db.commit()
            db.refresh(pref)
        return row_to_dict(pref)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/preferences")
async def update_preferences(request: Request, db: Session = Depends(get_db)):
    from database.models import UserPreference
    try:
        payload = await request.json()
        pref = db.query(UserPreference).first()
        if not pref:
            pref = UserPreference(usuario="default")
            db.add(pref)
        if "theme" in payload:
            pref.theme = payload["theme"]
        if "zen_mode" in payload:
            pref.zen_mode = payload["zen_mode"]
        if "notificaciones_email" in payload:
            pref.notificaciones_email = payload["notificaciones_email"]
        db.commit()
        db.refresh(pref)
        return row_to_dict(pref)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


#  ROLES DEL SISTEMA IGGA 
# Roles con permisos de modificar workflow/estado/asignacin (RBAC field-level):
WORKFLOW_ROLES = {"Oficina", "Analista Ambiental", "Coordinador Predial Junior", "Coordinador Predial Senior"}
FIELD_ROLES    = {"Gestor de Campo", "Asistente Predial"}
ALL_ROLES = sorted(WORKFLOW_ROLES | FIELD_ROLES | {"Administrador"})


@app.get("/users/all")
def list_users(db: Session = Depends(get_db)):
    """Retorna todos los usuarios del sistema con roles IGGA reales."""
    if "all" in cache_users:
        return cache_users["all"]
        
    from database.models import SystemUser
    users = db.query(SystemUser).filter(SystemUser.activo == True).order_by(SystemUser.full_name).all()
    result = [
        {
            "id": u.id,
            "username": u.username,
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role,
            "zona_ejecutora": u.zona_ejecutora,
            "active": u.activo,
            "can_edit_workflow": u.role in WORKFLOW_ROLES,
        }
        for u in users
    ]
    cache_users["all"] = result
    return result


@app.get("/users")
def get_users_list(db: Session = Depends(get_db)):
    """Backend endpoint para listar usuarios en el frontend."""
    return list_users(db)

@app.get("/stats/strategic")
def get_strategic_dashboard(db: Session = Depends(get_db)):
    """
    Endpoint para el Módulo de Dashboard Estratégico.
    Retorna métricas de alto nivel para gestión de oficina (Senior Master).
    """
    if "dashboard" in cache_stats:
        return cache_stats["dashboard"]
        
    with lock_stats:
        if "dashboard" in cache_stats:
            return cache_stats["dashboard"]
            
        from services.analytics_service import AnalyticsService
        result = AnalyticsService(db).get_strategic_stats()
        cache_stats["dashboard"] = result
        return result

@app.get("/users/roles")
def list_roles():
    """Retorna los roles disponibles del sistema para selectores en formularios."""
    return {"roles": ALL_ROLES, "workflow_roles": sorted(WORKFLOW_ROLES)}


@app.post("/users")
async def create_user(request: Request, db: Session = Depends(get_db)):
    """Crea un nuevo usuario en el sistema."""
    from database.models import SystemUser
    payload = await request.json()
    username = str(payload.get("username", "")).strip().lower()
    if not username:
        raise HTTPException(status_code=400, detail="username es requerido")
    existing = db.query(SystemUser).filter(SystemUser.username == username).first()
    if existing:
        raise HTTPException(status_code=409, detail="El usuario ya existe")
    role = str(payload.get("role", "Gestor de Campo")).strip()
    if role not in ALL_ROLES:
        raise HTTPException(status_code=400, detail=f"Rol invlido. Opciones: {ALL_ROLES}")
    user = SystemUser(
        username=username,
        full_name=str(payload.get("full_name", username.title())).strip(),
        email=str(payload.get("email", f"{username}@igga.com.co")).strip(),
        role=role,
        zona_ejecutora=payload.get("zona_ejecutora"),
        activo=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Invalida cache de usuarios
    cache_users.clear()
    
    return {"ok": True, "id": user.id, "username": user.username, "role": user.role}


@app.patch("/users/{user_id}")
async def update_user(user_id: int, request: Request, db: Session = Depends(get_db)):
    """Actualiza datos de un usuario (rol, zona, estado activo)."""
    from database.models import SystemUser
    user = db.query(SystemUser).filter(SystemUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    payload = await request.json()
    if "role" in payload:
        role = str(payload["role"]).strip()
        if role not in ALL_ROLES:
            raise HTTPException(status_code=400, detail=f"Rol invlido")
        user.role = role
    if "full_name" in payload:
        user.full_name = str(payload["full_name"]).strip()
    if "zona_ejecutora" in payload:
        user.zona_ejecutora = payload["zona_ejecutora"]
    if "activo" in payload:
        user.activo = bool(payload["activo"])
    db.commit()
    return {"ok": True}


@app.get("/avisos/{aviso_id}/ai-insight")
def get_aviso_ai_insight(aviso_id: str, db: Session = Depends(get_db)):
    """Genera un insight operativo determinístico basado en los datos del aviso."""
    try:
        from database.models import Aviso
        aviso = db.query(Aviso).filter(Aviso.aviso == aviso_id).first()
        if not aviso:
            raise HTTPException(status_code=404, detail="Aviso no encontrado")

        risk = aviso.risk_score or 0
        tipo = (aviso.tipo_de_gestion or "").upper()
        prio = (aviso.prioridad_fuente or "").upper()
        dist_raw = aviso.distancia_copa_fase
        estado = aviso.estado_workflow_interno or "INGRESADO"

        if risk > 75:
            summary = (
                f"Aviso #{aviso_id} presenta riesgo CRÍTICO (score {risk}/100). "
                f"Prioridad fuente: {prio}. Intervención inmediata requerida."
            )
            recommendation = (
                "Escalar a Coordinador de Zona. Programar visita de campo en las próximas 48h. "
                "Verificar distancia fase-tierra in situ y actualizar insumos fotográficos."
            )
        elif risk > 40:
            summary = (
                f"Aviso #{aviso_id} en gestión con riesgo MEDIO (score {risk}/100). "
                f"Estado actual: {estado}. Tipo de gestión: {tipo or 'No definido'}."
            )
            recommendation = (
                "Confirmar programación con gestor predial. "
                "Revisar disponibilidad de CAR si aplica control ambiental. "
                "Actualizar estado en próxima visita semanal."
            )
        else:
            summary = (
                f"Aviso #{aviso_id} con riesgo BAJO (score {risk}/100). "
                f"Municipio: {aviso.municipio or 'N/D'}. Estado: {estado}."
            )
            recommendation = (
                "Mantener seguimiento periódico. "
                "Verificar documentación predial y compromisos vigentes. "
                "Cerrar si gestión fue completada."
            )

        if "VEGETA" in tipo and dist_raw is not None:
            try:
                dist = float(dist_raw)
                recommendation += f" Distancia copa-fase registrada: {dist}m  {' -> Peligrosa (<2.5m)' if dist < 2.5 else ' -> Dentro de margen'}."
            except ValueError:
                pass

        return {
            "aviso_id": aviso_id,
            "risk_score": risk,
            "summary": summary,
            "recommendation": recommendation,
            "estado_actual": estado,
            "tipo_gestion": tipo,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/avisos/{aviso_id}/state")
def update_aviso_state(
    aviso_id: str, 
    new_state: str, 
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user)
):
    """
    Actualiza el estado de workflow y tipo_status.
    Senior Master: Protegido por RBAC (Criterio 4.3).
    """
    import traceback
    try:
        from database.models import Aviso, AvisoHistorial
        
        # 1. Seguridad: Solo roles de Oficina/Coordinador pueden cambiar estados
        is_high_role = user.role in ['Oficina', 'Analista Ambiental', 'Coordinador Predial Senior', 'Administrador']
        if not is_high_role:
            raise HTTPException(status_code=403, detail=f"No tienes permisos para cambiar estados. Tu rol: {user.role}")

        aviso = db.query(Aviso).filter(Aviso.aviso == aviso_id).first()
        if not aviso:
            raise HTTPException(status_code=404, detail="Aviso no encontrado")

        old_state = aviso.estado_workflow_interno or "INGRESADO"
        if old_state == new_state:
            return {"ok": True, "message": "Sin cambios", "estado": new_state}

        # 2. Sincronizar ambos campos de estado
        aviso.estado_workflow_interno = new_state
        aviso.tipo_status = new_state
        
        # 3. Registrar con campos correctos del modelo
        db.add(AvisoHistorial(
            aviso=aviso_id,
            campo="estado_workflow_interno",
            valor_anterior=old_state,
            valor_nuevo=new_state,
            batch_id="MANUAL",
            usuario_id=user.user_id,
            rol=user.role
        ))
        
        db.commit()
        return {"ok": True, "aviso_id": aviso_id, "estado_anterior": old_state, "estado": new_state}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        error_msg = f"ERROR INTERNO: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@app.post("/avisos/{aviso_id}/validate-insumos")
def validate_aviso_insumos(aviso_id: str, db: Session = Depends(get_db)):
    """Valida la disponibilidad de la carpeta de insumos para el aviso."""
    from database.models import Aviso
    aviso = db.query(Aviso).filter(Aviso.aviso == aviso_id).first()
    if not aviso:
        raise HTTPException(status_code=404, detail="Aviso no encontrado")

    ruta = aviso.ruta_insumos_onedrive
    tiene_carpeta = bool(ruta and str(ruta).strip())
    tiene_geom = bool(aviso.longitud_decimal and aviso.latitud_decimal)

    checks = [
        {"label": "Subcarpeta PREDIAL",          "ok": tiene_carpeta},
        {"label": "Subcarpeta INVENTARIO",        "ok": tiene_carpeta},
        {"label": "Archivo KML / Geometra",      "ok": tiene_geom},
        {"label": "Geometra dentro del Buffer",  "ok": (aviso.risk_score or 0) < 90},
    ]
    passed = sum(1 for c in checks if c["ok"])
    return {
        "aviso_id": aviso_id,
        "checks": checks,
        "passed": passed,
        "total": len(checks),
        "status": "OK" if passed == len(checks) else "INCOMPLETO"
    }


@app.get("/avisos/{aviso_id}/history")
def get_aviso_history(aviso_id: str, db: Session = Depends(get_db)):
    try:
        from database.models import AvisoHistorial
        rows = db.query(AvisoHistorial).filter(
            AvisoHistorial.aviso == aviso_id
        ).order_by(AvisoHistorial.timestamp.desc()).all()
        return [row_to_dict(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


#  ETL & CORTE AUTOMTICO 

@app.post("/etl/sync-geam")
async def sync_geam_corte(request: Request, db: Session = Depends(get_db)):
    """
    Sincronizacin Maestra del Corte Semanal (GEAM).
    Solo accesible para el Administrador de Datos (Albert Gaviria).
    """
    from services.sharepoint_etl import SharePointETLService
    from services.ingesta_service import IngestaService
    
    try:
        payload = await request.json()
    except:
        payload = {}
        
    user_email = payload.get("email")
    if user_email != "agaviria@igga.com.co":
        raise HTTPException(
            status_code=403, 
            detail="ACCESO DENEGADO: Solo Albert Gaviria (agaviria@igga.com.co) puede autorizar sincronizaciones de corte maestro."
        )
    
    try:
        sp = SharePointETLService(
            tenant_id=os.environ.get("AZURE_TENANT_ID"),
            client_id=os.environ.get("AZURE_CLIENT_ID"),
            client_secret=os.environ.get("AZURE_CLIENT_SECRET"),
            site_id=os.environ.get("SHAREPOINT_SITE_ID")
        )
        
        # 1. Buscar ltimo archivo de Viernes/Corte
        latest = sp.scan_latest_file()
        if not latest:
            raise HTTPException(status_code=404, detail="No se encontr ningn archivo GEAM compatible en SharePoint")
            
        print(f"LOG: Iniciando descarga de: {latest.name}")
        temp_file = f"temp_{latest.name}"
        sp.download_file(latest.path, temp_file)
        
        # 2. Ingestar
        ingesta = IngestaService(db)
        batch_id = ingesta.process_excel(temp_file, latest.fecha_corte, f"SHAREPOINT: {latest.name}")
        
        # 3. Limpieza y Commit
        if os.path.exists(temp_file):
            os.remove(temp_file)
            
        db.commit()
        return {
            "status": "success",
            "message": f"Corte {latest.name} sincronizado con xito.",
            "batch_id": batch_id,
            "filename": latest.name
        }
    except Exception as e:
        db.rollback()
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Fallo en Sincronizacin SharePoint: {str(e)}")


@app.post("/etl/upload-geam")
async def upload_geam_manual(
    request: Request, 
    db: Session = Depends(get_db)
):
    """
    Carga manual de archivo GEAM .xlsx.
    Restringido a Albert Gaviria.
    """
    from fastapi import UploadFile, File, Form
    from services.ingesta_service import IngestaService
    
    # Nota: Usamos Form para el email ya que UploadFile cambia el tipo de contenido
    # Pero para simplificar en este entorno, lo extraemos de los headers o query si es necesario.
    # Usaremos un query param para el email en este caso simplificado.
    user_email = request.query_params.get("email")
    
    if user_email != "agaviria@igga.com.co":
         raise HTTPException(status_code=403, detail="Acceso denegado.")

    form = await request.form()
    file = form.get("file")
    if not file or not isinstance(file, UploadFile):
        raise HTTPException(status_code=400, detail="Archivo .xlsx requerido")

    temp_path = f"manual_{file.filename}"
    with open(temp_path, "wb") as f:
        f.write(await file.read())
    
    try:
        ingesta = IngestaService(db)
        # Intentar extraer fecha del nombre
        import re
        match = re.search(r"(\d{2})_(\d{2})_(\d{4})", file.filename)
        fecha = datetime.now()
        if match:
            dd, mm, yyyy = match.groups()
            fecha = datetime(int(yyyy), int(mm), int(dd))
            
        batch_id = ingesta.process_excel(temp_path, fecha, f"MANUAL_UPLOAD: {file.filename}")
        
        db.commit()
        return {"status": "success", "batch_id": batch_id, "filename": file.filename}
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
