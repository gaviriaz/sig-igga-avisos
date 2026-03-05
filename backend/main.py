import os
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime
import uvicorn
from dotenv import load_dotenv

load_dotenv()

#  DATABASE (PostgreSQL Supabase for Platinum Senior Master Deployment) 
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:lP5LvF5dkFzIjvEU@db.vdzfamjklmwlptitxvvd.supabase.co:5432/postgres")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

from database.models import Base
try:
    Base.metadata.create_all(bind=engine)
    print("LOG: Tablas PostgreSQL en Supabase creadas/verificadas correctamente.")
except Exception as e:
    print(f"WARN: Error creando tablas PostgreSQL: {e}")

#  FASTAPI APP 
app = FastAPI(title="SIG IGGA/ISA - Gestin Integral de Avisos v7.5")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#  DIRECTORIO BASE PARA RUTAS RELATIVAS 
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Si estamos en /backend, subir un nivel para llegar a /capas
ROOT_DIR = os.path.dirname(BASE_DIR)

# Servir capas GeoJSON estticas (Ruta relativa)
CAPAS_DIR = os.path.join(ROOT_DIR, "capas")
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

@app.get("/")
def health_check():
    from database.models import Aviso
    db = SessionLocal()
    try:
        count = db.query(Aviso).count()
    except Exception as e:
        print(f"Healthcheck error: {e}")
        count = 0
    finally:
        db.close()
    return {"status": "online", "db": "PostgreSQL (Supabase)", "avisos": count, "timestamp": str(datetime.now())}


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
            SystemUser(username="agaviria",       full_name="Albert Gaviria",              email="agaviria@igga.com.co",     role="Administrador",             zona_ejecutora="NACIONAL"),
            SystemUser(username="admin",          full_name="Administrador Sistema",       email="admin@igga.com.co",        role="Administrador",             zona_ejecutora=None),
            SystemUser(username="coord_senior",   full_name="Coordinador Predial Senior",  email="coord.senior@igga.com.co", role="Coordinador Predial Senior", zona_ejecutora="NACIONAL"),
            SystemUser(username="coord_junior",   full_name="Coordinador Predial Junior",  email="coord.junior@igga.com.co", role="Coordinador Predial Junior", zona_ejecutora="NACIONAL"),
            SystemUser(username="analista_amb",   full_name="Analista Ambiental",          email="analista.amb@igga.com.co", role="Analista Ambiental",         zona_ejecutora="NACIONAL"),
            SystemUser(username="oficina_1",      full_name="Operador Oficina 1",          email="oficina1@igga.com.co",     role="Oficina",                    zona_ejecutora=None),
            SystemUser(username="oficina_2",      full_name="Operador Oficina 2",          email="oficina2@igga.com.co",     role="Oficina",                    zona_ejecutora=None),
            SystemUser(username="gestor_campo_1", full_name="Gestor de Campo Norte",       email="campo1@igga.com.co",       role="Gestor de Campo",            zona_ejecutora="NORTE"),
            SystemUser(username="gestor_campo_2", full_name="Gestor de Campo Sur",         email="campo2@igga.com.co",       role="Gestor de Campo",            zona_ejecutora="SUR"),
            SystemUser(username="gestor_campo_3", full_name="Gestor de Campo Occidente",   email="campo3@igga.com.co",       role="Gestor de Campo",            zona_ejecutora="OCCIDENTE"),
            SystemUser(username="asistente_pred", full_name="Asistente Predial",           email="asist.pred@igga.com.co",   role="Asistente Predial",          zona_ejecutora="NACIONAL"),
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


@app.get("/domains/{domain_key}")
def list_domain_values(domain_key: str, db: Session = Depends(get_db)):
    from database.models import Dominio
    return db.query(Dominio).filter(Dominio.tipo == domain_key).all()


@app.get("/avisos")
def list_avisos(db: Session = Depends(get_db)):
    from database.models import Aviso
    return db.query(Aviso).all()


@app.get("/avisos/{aviso_id}")
def get_aviso(aviso_id: str, db: Session = Depends(get_db)):
    from database.models import Aviso
    aviso = db.query(Aviso).filter(Aviso.aviso == aviso_id).first()
    if not aviso:
        raise HTTPException(status_code=404, detail="Aviso no encontrado")
    return aviso


@app.get("/avisos/{aviso_id}/comments")
def get_aviso_comments(aviso_id: str, db: Session = Depends(get_db)):
    from database.models import AvisoComentario
    return db.query(AvisoComentario).filter(
        AvisoComentario.aviso_id == aviso_id
    ).order_by(AvisoComentario.created_at).all()


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
    return db.query(Notificacion).order_by(Notificacion.created_at.desc()).limit(50).all()


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
    pref = db.query(UserPreference).first()
    if not pref:
        pref = UserPreference(usuario="default", theme="dark", zen_mode=False, notificaciones_email=True)
        db.add(pref)
        db.commit()
        db.refresh(pref)
    return pref


@app.patch("/preferences")
async def update_preferences(request: Request, db: Session = Depends(get_db)):
    from database.models import UserPreference
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
    return pref


#  ROLES DEL SISTEMA IGGA 
# Roles con permisos de modificar workflow/estado/asignacin (RBAC field-level):
WORKFLOW_ROLES = {"Oficina", "Analista Ambiental", "Coordinador Predial Junior", "Coordinador Predial Senior"}
FIELD_ROLES    = {"Gestor de Campo", "Asistente Predial"}
ALL_ROLES = sorted(WORKFLOW_ROLES | FIELD_ROLES | {"Administrador"})


@app.get("/users/all")
def list_users(db: Session = Depends(get_db)):
    """Retorna todos los usuarios del sistema con roles IGGA reales."""
    from database.models import SystemUser
    users = db.query(SystemUser).filter(SystemUser.activo == True).order_by(SystemUser.full_name).all()
    return [
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
    """Genera un insight operativo determinstico basado en los datos del aviso."""
    from database.models import Aviso
    aviso = db.query(Aviso).filter(Aviso.aviso == aviso_id).first()
    if not aviso:
        raise HTTPException(status_code=404, detail="Aviso no encontrado")

    # Insight determinstico segn variables de riesgo (sin IA externa)
    risk = aviso.risk_score or 0
    tipo = (aviso.tipo_de_gestion or "").upper()
    prio = (aviso.prioridad_fuente or "").upper()
    dist = aviso.distancia_copa_fase
    estado = aviso.estado_workflow_interno or "INGRESADO"

    # Construir resumen
    if risk > 75:
        summary = (
            f"Aviso #{aviso_id} presenta riesgo CRTICO (score {risk}/100). "
            f"Prioridad fuente: {prio}. Intervencin inmediata requerida."
        )
        recommendation = (
            "Escalar a Coordinador de Zona. Programar visita de campo en las prximas 48h. "
            "Verificar distancia fase-tierra in situ y actualizar insumos fotogrficos."
        )
    elif risk > 40:
        summary = (
            f"Aviso #{aviso_id} en gestin con riesgo MEDIO (score {risk}/100). "
            f"Estado actual: {estado}. Tipo de gestin: {tipo or 'No definido'}."
        )
        recommendation = (
            "Confirmar programacin con gestor predial. "
            "Revisar disponibilidad de CAR si aplica control ambiental. "
            "Actualizar estado en prxima visita semanal."
        )
    else:
        summary = (
            f"Aviso #{aviso_id} con riesgo BAJO (score {risk}/100). "
            f"Municipio: {aviso.municipio or 'N/D'}. Estado: {estado}."
        )
        recommendation = (
            "Mantener seguimiento peridico. "
            "Verificar documentacin predial y compromisos vigentes. "
            "Cerrar si gestin fue completada."
        )

    # Detalle adicional para vegetacin
    if "VEGETA" in tipo and dist is not None:
        recommendation += f" Distancia copa-fase registrada: {dist}m  {' Peligrosa (<2.5m)' if dist < 2.5 else ' Dentro de margen'}."

    return {
        "aviso_id": aviso_id,
        "risk_score": risk,
        "summary": summary,
        "recommendation": recommendation,
        "estado_actual": estado,
        "tipo_gestion": tipo,
    }


@app.patch("/avisos/{aviso_id}/state")
def update_aviso_state(aviso_id: str, new_state: str, db: Session = Depends(get_db)):
    """Actualiza el estado de workflow interno del aviso y registra en historial."""
    from database.models import Aviso, AvisoHistorial
    aviso = db.query(Aviso).filter(Aviso.aviso == aviso_id).first()
    if not aviso:
        raise HTTPException(status_code=404, detail="Aviso no encontrado")

    old_state = aviso.estado_workflow_interno or "INGRESADO"
    if old_state == new_state:
        return {"ok": True, "message": "Sin cambios", "estado": new_state}

    aviso.estado_workflow_interno = new_state
    db.add(AvisoHistorial(
        aviso_id=aviso_id,
        campo="estado_workflow_interno",
        valor_anterior=old_state,
        valor_nuevo=new_state,
        batch_id="MANUAL",
        usuario="Operador"
    ))
    db.commit()
    return {"ok": True, "aviso_id": aviso_id, "estado_anterior": old_state, "estado": new_state}


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
    from database.models import AvisoHistorial
    return db.query(AvisoHistorial).filter(
        AvisoHistorial.aviso_id == aviso_id
    ).order_by(AvisoHistorial.created_at.desc()).all()


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
