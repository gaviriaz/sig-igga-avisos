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
    estado_sla = Column(String, default='NORMAL')                # NORMAL, POR_VENCER, VENCIDO
    flag_intervencion_franja = Column(Boolean, default=False)
    distancia_estructura = Column(Float)
    riesgo_cimentacion = Column(String)
    
    # Módulo de Insumos (OneDrive integration)
    ruta_insumos_onedrive = Column(String)
    estado_insumos = Column(String, default='NO_CREADO')         # NO_CREADO, CREADO, INCOMPLETO, COMPLETO
    fecha_creacion_carpeta = Column(DateTime)
    usuario_creacion_carpeta = Column(String)
    fecha_envio_insumos = Column(DateTime)
    usuario_envio_insumos = Column(String)
    
    assigned_to = Column(String)                                 # Username del Gestor
    assigned_to_name = Column(String)                            # Nombre completo del Gestor
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

class AvisoInsumo(Base):
    """Resultados de validación técnica de KML e Insumos."""
    __tablename__ = 'aviso_insumos'
    id = Column(Integer, primary_key=True, autoincrement=True)
    aviso_id = Column(String, ForeignKey('aviso.aviso'))
    kml_files_count = Column(Integer, default=0)
    kml_parse_ok = Column(Boolean, default=False)
    kml_feature_count = Column(Integer, default=0)
    kml_valid_geom_count = Column(Integer, default=0)
    kml_geom_types = Column(JSON)                                # Lista de tipos: ["Point", "Line"]
    kml_within_buffer = Column(Boolean, default=False)
    kml_min_distance_m = Column(Float)
    kml_buffer_used_m = Column(Integer)
    kml_proximity_status = Column(String, default='NOT_EVALUATED') # OK, OUT_OF_BUFFER, NOT_EVALUATED
    checklist_insumos = Column(JSON)                             # {"PREDIAL": true, "INVENTARIO": false...}
    observaciones_insumos = Column(Text)
    ultima_valid_insumos = Column(DateTime, default=datetime.utcnow)
    detalle_valid_json = Column(JSON)

class AvisoEvidencia(Base):
    """Fotos, Actas, Documentos de retorno de campo."""
    __tablename__ = 'aviso_evidencia'
    id = Column(Integer, primary_key=True, autoincrement=True)
    aviso_id = Column(String, ForeignKey('aviso.aviso'))
    tipo_evidencia = Column(String)                              # FOTO, ACTA, MANUAL, KML_RECORRIDO
    url_cloud = Column(String)
    nombre_archivo = Column(String)
    usuario = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    metadata_json = Column(JSON)

class Dominio(Base):
    __tablename__ = 'dominio'
    id = Column(Integer, primary_key=True)
    codigo = Column(String)
    tipo = Column(String, index=True)
    valor = Column(String)
    descripcion = Column(String)
    activo = Column(Boolean, default=True)

class CfgKmlBuffer(Base):
    """Configuración de buffers por tipo de gestión."""
    __tablename__ = 'cfg_kml_buffer_por_tipo_gestion'
    tipo_gestion = Column(String, primary_key=True)
    buffer_m = Column(Integer, nullable=False)
    activo = Column(Boolean, default=True)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

class CfgKmlValidacion(Base):
    """Reglas globales de validación KML."""
    __tablename__ = 'cfg_kml_validacion'
    id = Column(Integer, primary_key=True)
    min_valid_geometries = Column(Integer, default=1)
    require_within_buffer = Column(Boolean, default=True)
    allowed_geom_types = Column(JSON)                            # Default: ["Point", "LineString"...]
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

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
    cedula         = Column(String)                              # ID Document
    activo         = Column(Boolean, default=True)
    created_at     = Column(DateTime, default=datetime.utcnow)
    updated_at     = Column(DateTime, onupdate=datetime.utcnow)
