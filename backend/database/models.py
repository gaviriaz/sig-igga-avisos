import os
from sqlalchemy import Column, String, Integer, DateTime, Boolean, JSON, Float, Text, ForeignKey
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()

class ImportBatch(Base):
    __tablename__ = 'import_batch'
    batch_id = Column(String, primary_key=True)
    fecha_corte = Column(DateTime)
    anio = Column(Integer)
    mes = Column(String)
    file_name = Column(String)
    file_hash = Column(String)
    filas_procesadas = Column(Integer)
    estado = Column(String, default='SUCCESS')
    created_at = Column(DateTime, default=datetime.utcnow)

class AvisosRaw(Base):
    __tablename__ = 'avisos_raw'
    id = Column(Integer, primary_key=True, autoincrement=True)
    batch_id = Column(String)
    aviso = Column(String)
    payload = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

class Aviso(Base):
    __tablename__ = 'aviso'
    aviso = Column(String, primary_key=True)
    clase_aviso = Column(String)
    denominacion = Column(String)
    descripcion = Column(Text)
    autor_aviso = Column(String)
    fecha_aviso = Column(DateTime)
    inicio_deseado = Column(DateTime)
    fin_deseado = Column(DateTime)
    fecha_cierre = Column(DateTime)
    prioridad_fuente = Column(String)
    prioridad_operativa = Column(String)
    zona_trabajo = Column(String)
    ubicacion_tecnica = Column(String)
    sector = Column(String)
    zona_ejecutora = Column(String)
    municipio = Column(String)
    departamento = Column(String)
    latitud_decimal = Column(Float)
    longitud_decimal = Column(Float)
    # Geometría siempre como String para compatibilidad SQLite/Postgres
    geom = Column(String)
    geom_operativa = Column(String)
    status_usuario = Column(String)
    status_sistema = Column(String)
    tipo_status = Column(String)
    estado_workflow_interno = Column(String)
    reprogramacion = Column(String)
    justificacion_repro = Column(Text)
    fecha_el_reporte = Column(DateTime)
    plazo_ejecucion = Column(String)
    estado_ambiental = Column(String)
    pto_trabajo_resp = Column(String)
    gestor_predial = Column(String)
    asistente_predial = Column(String)
    analista_ambiental = Column(String)
    programacion_gestor = Column(String)
    gestion_ambiental_predial = Column(String)
    actividad_ambiental = Column(String)
    fecha_inicial_tapf = Column(DateTime)
    fecha_final_tapf = Column(DateTime)
    car = Column(String)
    predio_propietario = Column(String)
    actividad_predial = Column(String)
    observacion_predial = Column(Text)
    legalizacion = Column(String)
    fecha_reunion = Column(DateTime)
    compromisos = Column(Text)
    tipo_de_gestion = Column(String)
    # Estos campos son TEXT en la DB real para evitar fallos de conversion masivos
    distancia_copa_fase = Column(String) 
    observacion_riesgo = Column(Text)
    especie_con_mas_riesgo = Column(String)
    altura_individuo = Column(String)
    cantidad_arboles = Column(String)
    tipo_construccion = Column(String)
    valor_acuerdo_presupuesto = Column(Float)
    tipo_de_linea = Column(String)
    tipo_aviso = Column(String)
    batch_id_actual = Column(String)
    risk_score = Column(Integer, default=0)
    flag_intervencion_franja = Column(Boolean, default=False)
    distancia_estructura = Column(Float)
    riesgo_cimentacion = Column(String)
    ruta_insumos_onedrive = Column(String)
    not_presente_en_corte = Column(Boolean, default=False)
    fecha_ultimo_corte_visto = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

class AvisoHistorial(Base):
    __tablename__ = 'aviso_historial'
    historial_id = Column(Integer, primary_key=True, autoincrement=True)
    aviso = Column(String, ForeignKey('aviso.aviso'))
    campo = Column(String)
    valor_anterior = Column(Text)
    valor_nuevo = Column(Text)
    usuario_id = Column(String)
    rol = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    comentario = Column(Text)
    batch_id = Column(String)

class Dominio(Base):
    __tablename__ = 'dominio'
    id = Column(Integer, primary_key=True)
    codigo = Column(String)
    tipo = Column(String, index=True)
    valor = Column(String)
    descripcion = Column(String)
    # Temporalmente comentamos activo si no existe en la DB
    # activo = Column(Boolean, default=True)


class Notificacion(Base):
    __tablename__ = 'notificacion'
    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario = Column(String)
    titulo = Column(String)
    mensaje = Column(Text)
    tipo = Column(String, default='INFO')  # INFO, WARNING, SUCCESS, ERROR
    leida = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class AvisoComentario(Base):
    __tablename__ = 'aviso_comentario'
    id = Column(Integer, primary_key=True, autoincrement=True)
    aviso_id = Column(String, ForeignKey('aviso.aviso'))
    comentario = Column(Text)
    usuario = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class UserPreference(Base):
    __tablename__ = 'user_preference'
    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario = Column(String, unique=True, index=True)
    theme = Column(String, default='dark')
    zen_mode = Column(Boolean, default=False)
    notificaciones_email = Column(Boolean, default=True)
    config_json = Column(JSON)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)


class SystemUser(Base):
    __tablename__ = 'app_system_user'
    id             = Column(Integer, primary_key=True, autoincrement=True)
    username       = Column(String, unique=True, index=True, nullable=False)
    full_name      = Column(String, nullable=False)
    email          = Column(String)
    role           = Column(String, default='Gestor de Campo')   # RBAC
    zona_ejecutora = Column(String)                              # Territorio asignado
    activo         = Column(Boolean, default=True)
    created_at     = Column(DateTime, default=datetime.utcnow)
    updated_at     = Column(DateTime, onupdate=datetime.utcnow)
