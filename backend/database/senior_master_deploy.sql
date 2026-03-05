-- =============================================================================
-- SIG IGGA / ISA - MASTER DEPLOYMENT SCRIPT v7.5 (Platinum Edition)
-- Propósito: Setup completo de esquema PostgreSQL con PostGIS + Dominios
-- =============================================================================

-- 0. Habilitar Extensiones Necesarias
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. TABLAS DE DOMINIOS (Catálogos)
CREATE TABLE IF NOT EXISTS dom_tipo_de_gestion (valor TEXT PRIMARY KEY);

CREATE TABLE IF NOT EXISTS dom_tipo_status (valor TEXT PRIMARY KEY);

CREATE TABLE IF NOT EXISTS dom_departamento (valor TEXT PRIMARY KEY);

CREATE TABLE IF NOT EXISTS dom_municipio (valor TEXT PRIMARY KEY);

CREATE TABLE IF NOT EXISTS dom_zona_ejecutora (valor TEXT PRIMARY KEY);

CREATE TABLE IF NOT EXISTS dom_actividad_predial (valor TEXT PRIMARY KEY);

CREATE TABLE IF NOT EXISTS dom_legalizacion (valor TEXT PRIMARY KEY);

CREATE TABLE IF NOT EXISTS dom_gestor_predial (valor TEXT PRIMARY KEY);

CREATE TABLE IF NOT EXISTS dom_asistente_predial (valor TEXT PRIMARY KEY);

CREATE TABLE IF NOT EXISTS dom_analista_ambiental (valor TEXT PRIMARY KEY);

-- 2. TABLAS MAESTRAS
CREATE TABLE IF NOT EXISTS import_batch (
    batch_id TEXT PRIMARY KEY,
    fecha_corte TIMESTAMP
    WITH
        TIME ZONE NOT NULL,
        anio INTEGER,
        mes TEXT,
        file_name TEXT,
        file_hash TEXT,
        filas_procesadas INTEGER,
        estado TEXT DEFAULT 'SUCCESS',
        created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS aviso (
    aviso TEXT PRIMARY KEY,
    clase_aviso TEXT,
    denominacion TEXT,
    descripcion TEXT,
    autor_aviso TEXT,
    fecha_aviso TIMESTAMP,
    inicio_deseado TIMESTAMP,
    fin_deseado TIMESTAMP,
    fecha_cierre TIMESTAMP,
    zona_trabajo TEXT,
    ubicacion_tecnica TEXT,
    sector TEXT,
    zona_ejecutora TEXT,
    municipio TEXT,
    departamento TEXT,
    latitud_decimal NUMERIC,
    longitud_decimal NUMERIC,
    status_usuario TEXT,
    status_sistema TEXT,
    tipo_status TEXT,
    estado_workflow_interno TEXT DEFAULT 'Ingresado',
    prioridad_fuente TEXT,
    prioridad_operativa TEXT,
    pto_trabajo_resp TEXT,
    gestor_predial TEXT,
    asistente_predial TEXT,
    analista_ambiental TEXT,
    programacion_gestor TEXT,
    gestion_ambiental_predial TEXT,
    actividad_ambiental TEXT,
    fecha_inicial_tapf TIMESTAMP,
    fecha_final_tapf TIMESTAMP,
    plazo_ejecucion TEXT,
    estado_ambiental TEXT,
    car TEXT,
    predio_propietario TEXT,
    actividad_predial TEXT,
    observacion_predial TEXT,
    legalizacion TEXT,
    fecha_reunion TIMESTAMP,
    compromisos TEXT,
    especie_con_mas_riesgo TEXT,
    distancia_copa_fase NUMERIC,
    altura_individuo NUMERIC,
    cantidad_arboles INTEGER,
    observacion_riesgo TEXT,
    tipo_construccion TEXT,
    valor_acuerdo_presupuesto NUMERIC,
    flag_intervencion_franja BOOLEAN DEFAULT FALSE,
    tipo_de_linea TEXT,
    distancia_estructura NUMERIC,
    riesgo_cimentacion TEXT,
    ruta_insumos_onedrive TEXT,
    not_presente_en_corte BOOLEAN DEFAULT FALSE,
    fecha_ultimo_corte_visto TIMESTAMP,
    batch_id_actual TEXT REFERENCES import_batch (batch_id),
    risk_score INTEGER DEFAULT 0,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        geom GEOMETRY (POINT, 4326)
);

CREATE TABLE IF NOT EXISTS avisos_raw (
    id SERIAL PRIMARY KEY,
    batch_id TEXT REFERENCES import_batch (batch_id),
    aviso TEXT,
    payload JSONB,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS aviso_historial (
    id SERIAL PRIMARY KEY,
    aviso_id TEXT REFERENCES aviso (aviso),
    campo TEXT,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    usuario TEXT,
    batch_id TEXT,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS aviso_evidencia (
    id SERIAL PRIMARY KEY,
    aviso_id TEXT REFERENCES aviso (aviso),
    url TEXT,
    tipo TEXT,
    lat NUMERIC,
    lon TEXT,
    metadata_json JSONB,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- 3. CARGA DE DATOS MAESTROS (SEED)
INSERT INTO
    dom_tipo_de_gestion (valor)
VALUES ('VEGETACIÓN'),
    ('CONSTRUCCIÓN'),
    ('OBRAS TERCEROS'),
    ('INSPECCIÓN') ON CONFLICT (valor) DO NOTHING;

INSERT INTO
    dom_tipo_status (valor)
VALUES ('VALIDAR'),
    ('GEAM'),
    ('GPRE'),
    ('PRER'),
    ('TAMB'),
    ('AMPO'),
    ('COMPLETO') ON CONFLICT (valor) DO NOTHING;

INSERT INTO
    dom_departamento (valor)
VALUES ('ANTIOQUIA'),
    ('CUNDINAMARCA'),
    ('VALLE DEL CAUCA'),
    ('SANTANDER') ON CONFLICT (valor) DO NOTHING;

INSERT INTO
    dom_gestor_predial (valor)
VALUES ('ALBERT DANIEL GAVIRIA'),
    ('JUAN CARREÑO'),
    ('ISABELA LONDOÑO') ON CONFLICT (valor) DO NOTHING;

-- Trigger para actualización automática de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_aviso_updated_at ON aviso;

CREATE TRIGGER update_aviso_updated_at BEFORE UPDATE ON aviso
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();