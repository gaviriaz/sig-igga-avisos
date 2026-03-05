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

# ─── DATABASE (siempre SQLite local para desarrollo) ─────────────────────────
DATABASE_URL = "sqlite:///./sig_igga_local_dev.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ─── CREAR TABLAS AL INICIO ───────────────────────────────────────────────────
from database.models import Base
Base.metadata.create_all(bind=engine)
print("✅ Tablas SQLite creadas/verificadas correctamente.")

# ─── FASTAPI APP ──────────────────────────────────────────────────────────────
app = FastAPI(title="SIG IGGA/ISA - Gestión Integral de Avisos v7.5")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servir capas GeoJSON estáticas
try:
    app.mount("/capas", StaticFiles(directory=r"C:\Users\AlbertG\IGGA.SAS\PERSONAL\DEV\SIG-IGGA-AVISOS\capas"), name="capas")
except Exception:
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ─── ENDPOINTS ────────────────────────────────────────────────────────────────

@app.get("/")
def health_check():
    from database.models import Aviso
    db = SessionLocal()
    try:
        count = db.query(Aviso).count()
    except:
        count = 0
    finally:
        db.close()
    return {"status": "online", "db": "SQLite", "avisos": count, "timestamp": str(datetime.now())}


@app.post("/dev/seed")
def seed_database(db: Session = Depends(get_db)):
    from services.ingesta_service import IngestaService
    from database.models import Dominio, Notificacion, Aviso

    real_excel = r"C:\Users\AlbertG\IGGA.SAS\PERSONAL\DEV\SIG-IGGA-AVISOS\capas\GEAM_N2_27_02_2026.xlsx"
    use_real = os.path.exists(real_excel)

    # Seed dominios
    if db.query(Dominio).count() == 0:
        dominios = [
            Dominio(codigo="INGRESADO",  tipo="workflow_status", valor="INGRESADO",  descripcion="Ingresado"),
            Dominio(codigo="EN_GESTION", tipo="workflow_status", valor="EN_GESTION", descripcion="En Gestión de Campo"),
            Dominio(codigo="VALIDAR_QA", tipo="workflow_status", valor="VALIDAR_QA", descripcion="Pendiente QA"),
            Dominio(codigo="APROBADO",   tipo="workflow_status", valor="APROBADO",   descripcion="Aprobado"),
            Dominio(codigo="CERRADO",    tipo="workflow_status", valor="CERRADO",    descripcion="Cerrado"),
            Dominio(codigo="VEGETA",     tipo="gestion_type",    valor="VEGETACIÓN", descripcion="Gestión Vegetación"),
            Dominio(codigo="CONSTRUC",   tipo="gestion_type",    valor="CONSTRUCCIÓN",descripcion="Gestión Construcción"),
        ]
        for d in dominios:
            db.add(d)
        db.flush()

    # ── Seed usuarios del sistema (roles IGGA reales) ──────────────────────────
    from database.models import SystemUser
    if db.query(SystemUser).count() == 0:
        usuarios_base = [
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
            # Datos de demostración mínimos si no hay Excel
            from generate_test_data import generate_dummy_geam
            dummy = "GEAM_SEED_TEMP.xlsx"
            generate_dummy_geam(dummy)
            batch_id = ingesta.process_excel(dummy, datetime.now(), "DEMO")
            os.remove(dummy)

        # Notificación de bienvenida
        if db.query(Notificacion).count() == 0:
            db.add(Notificacion(
                usuario="sistema",
                titulo="🚀 Sistema Inicializado",
                mensaje=f"Se cargaron {db.query(Aviso).count()} avisos desde {'Excel real' if use_real else 'datos demo'}.",
                tipo="SUCCESS"
            ))

        db.commit()
        return {
            "message": f"✅ {'Excel real' if use_real else 'Demo'} cargado correctamente",
            "batch_id": batch_id,
            "count": db.query(Aviso).count()
        }
    except Exception as e:
        import traceback
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
    """Agrega un comentario/comunicación a un aviso. Registra usuario y timestamp."""
    from database.models import AvisoComentario
    try:
        payload = await request.json()
    except Exception:
        payload = {}
    comentario_texto = str(payload.get("comentario", "")).strip()
    if not comentario_texto:
        raise HTTPException(status_code=400, detail="El comentario no puede estar vacío")
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


# ── ROLES DEL SISTEMA IGGA ────────────────────────────────────────────────────
# Roles con permisos de modificar workflow/estado/asignación (RBAC field-level):
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
        raise HTTPException(status_code=400, detail=f"Rol inválido. Opciones: {ALL_ROLES}")
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
            raise HTTPException(status_code=400, detail=f"Rol inválido")
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
    from database.models import Aviso
    aviso = db.query(Aviso).filter(Aviso.aviso == aviso_id).first()
    if not aviso:
        raise HTTPException(status_code=404, detail="Aviso no encontrado")

    # Insight determinístico según variables de riesgo (sin IA externa)
    risk = aviso.risk_score or 0
    tipo = (aviso.tipo_de_gestion or "").upper()
    prio = (aviso.prioridad_fuente or "").upper()
    dist = aviso.distancia_copa_fase
    estado = aviso.estado_workflow_interno or "INGRESADO"

    # Construir resumen
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

    # Detalle adicional para vegetación
    if "VEGETA" in tipo and dist is not None:
        recommendation += f" Distancia copa-fase registrada: {dist}m — {'⚠️ Peligrosa (<2.5m)' if dist < 2.5 else '✅ Dentro de margen'}."

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
        {"label": "Archivo KML / Geometría",      "ok": tiene_geom},
        {"label": "Geometría dentro del Buffer",  "ok": (aviso.risk_score or 0) < 90},
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


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
