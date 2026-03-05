-- ==============================================================
-- SIG IGGA/ISA - Esquema de Base de Datos PostGIS
-- Objetivo: Costo 0 (Supabase Free Tier)
-- ==============================================================

-- 0. Extensiones
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Registro de Lotes de Importación (ETL)
CREATE TABLE IF NOT EXISTS import_batch (
    batch_id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    fecha_corte DATE NOT NULL,
    anio INTEGER NOT NULL,
    mes TEXT NOT NULL,
    sharepoint_path TEXT,
    file_name TEXT NOT NULL,
    file_hash TEXT, -- SHA256 para evitar duplicidad
    filas_leidas INTEGER DEFAULT 0,
    filas_validas INTEGER DEFAULT 0,
    filas_error INTEGER DEFAULT 0,
    estado_batch TEXT DEFAULT 'INICIADO', -- 'OK', 'WARN', 'ERROR', 'INICIADO'
    detalle_error TEXT,
    timestamp_ingesta TIMESTAMPTZ DEFAULT now()
);

-- 2. Snapshot RAW (Copia exacta de cada fila del Excel por batch)
-- Se usa JSONB para almacenar todas las columnas variables del Excel sin perder nada.
CREATE TABLE IF NOT EXISTS avisos_raw (
    raw_id BIGSERIAL PRIMARY KEY,
    batch_id UUID REFERENCES import_batch (batch_id),
    aviso TEXT NOT NULL,
    data_raw JSONB NOT NULL, -- Snapshot total de la fila
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabla Operacional (Single Source of Truth)
CREATE TABLE IF NOT EXISTS aviso (
    aviso TEXT PRIMARY KEY, -- Identificador único oficial del Excel

-- Campos Originales Fuente (Selección clave)
prioridad TEXT,
clase_aviso TEXT,
zona_trabajo TEXT,
ubicacion_tecnica TEXT,
sector TEXT,
denominacion TEXT,
descripcion TEXT,
fecha_aviso DATE,
inicio_deseado DATE,
fin_deseado DATE,
fecha_cierre DATE,
status_usuario TEXT,
status_sistema TEXT,
autor_aviso TEXT,
pto_trabajo_resp TEXT,
tipo_status TEXT,
gestion_ambiental_predial TEXT,
tipo_de_linea TEXT,
actividad_ambiental TEXT,
fecha_inicial_tapf DATE,
fecha_final_tapf DATE,
plazo_ejecucion TEXT,
estado_ambiental TEXT,
car TEXT,
predio_propietario TEXT,
municipio TEXT,
departamento TEXT,
gestor_predial TEXT,
asistente_predial TEXT,
analista_ambiental TEXT,
zona_ejecutora TEXT,
tipo_aviso TEXT,
tipo_de_gestion TEXT,
reprogramacion TEXT,
justificacion_repro TEXT,
distancia_copa_fase TEXT,
fecha_el_reporte DATE,
observacion_riesgo TEXT,
especie_con_mas_riesgo TEXT,
altura_individuo TEXT,
cantidad_arboles TEXT,
valor_acuerdo_presupuesto NUMERIC,
tipo_construccion TEXT,
latitud_decimal NUMERIC,
longitud_decimal NUMERIC,
actividad_predial TEXT,
observacion_predial TEXT,
programacion_gestor TEXT,
legalizacion TEXT,
fecha_reunion DATE,
compromisos TEXT,

-- Campos Operativos del Sistema
estado_workflow_interno TEXT DEFAULT 'Ingresado',
not_presente_en_corte BOOLEAN DEFAULT FALSE,
fecha_ultimo_corte_visto DATE,
risk_score INTEGER DEFAULT 0, -- 0-100
geom GEOMETRY (POINT, 4326),
geom_operativa GEOMETRY (GEOMETRY, 4326), -- Captura manual en mapa

-- Auditoría
batch_id_actual UUID REFERENCES import_batch(batch_id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Historial de Cambios (Auditoría por campo)
CREATE TABLE IF NOT EXISTS aviso_historial (
    historial_id BIGSERIAL PRIMARY KEY,
    aviso TEXT REFERENCES aviso (aviso),
    campo TEXT NOT NULL,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    usuario_id UUID, -- Referencia a auth.users de Supabase
    rol TEXT,
    timestamp TIMESTAMPTZ DEFAULT now(),
    comentario TEXT
);

-- 5. Insumos a Gestor de Campo
CREATE TABLE IF NOT EXISTS aviso_insumos (
    aviso TEXT PRIMARY KEY REFERENCES     aviso(aviso),
    ruta_insumos_onedrive TEXT,
    estado_insumos TEXT DEFAULT 'NO_CREADO', -- 'NO_CREADO', 'CREADO', 'INCOMPLETO', 'COMPLETO'
    fecha_creacion_carpeta TIMESTAMPTZ,
    usuario_creacion_carpeta UUID,
    fecha_envio_insumos TIMESTAMPTZ,
    usuario_envio_insumos UUID,

-- Métricas KML


kml_files_count INTEGER DEFAULT 0,
    kml_parse_ok BOOLEAN DEFAULT FALSE,
    kml_within_buffer BOOLEAN DEFAULT FALSE,
    kml_proximity_status TEXT DEFAULT 'NOT_EVALUATED', -- 'OK', 'OUT_OF_BUFFER', 'NOT_EVALUATED'
    kml_min_distance_m NUMERIC,
    
    checklist_insumos JSONB,
    ultima_validacion_insumos TIMESTAMPTZ,
    detalle_validacion_json JSONB
);

-- 6. Evidencias y Archivos
CREATE TABLE IF NOT EXISTS aviso_evidencia (
    evidencia_id BIGSERIAL PRIMARY KEY,
    aviso TEXT REFERENCES aviso (aviso),
    tipo_evidencia TEXT, -- 'FOTO', 'PDF', 'KML', 'REPORTE'
    url_storage TEXT NOT NULL,
    metadata JSONB,
    usuario_id UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Dominios (Catálogos) Administrables
CREATE TABLE IF NOT EXISTS dom_tipo_status (
    valor TEXT PRIMARY KEY,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS dom_actividad_predial (
    valor TEXT PRIMARY KEY,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS dom_gestor_predial (
    valor TEXT PRIMARY KEY,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS dom_asistente_predial (
    valor TEXT PRIMARY KEY,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS dom_analista_ambiental (
    valor TEXT PRIMARY KEY,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS dom_tipo_aviso (
    valor TEXT PRIMARY KEY,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS dom_municipio (
    valor TEXT PRIMARY KEY,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS dom_departamento (
    valor TEXT PRIMARY KEY,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS dom_zona_ejecutora (
    valor TEXT PRIMARY KEY,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS dom_legalizacion (
    valor TEXT PRIMARY KEY,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS dom_tipo_gestion (
    valor TEXT PRIMARY KEY,
    activo BOOLEAN DEFAULT TRUE
);

-- Insertar valores base iniciales (Ejemplos)
INSERT INTO
    dom_tipo_gestion (valor)
VALUES ('VEGETACIÓN'),
    ('CONSTRUCCIÓN'),
    ('OBRAS') ON CONFLICT DO NOTHING;

INSERT INTO
    dom_departamento (valor)
VALUES ('CUNDINAMARCA'),
    ('ANTIOQUIA'),
    ('VALLE DEL CAUCA') ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS dom_municipio (
    municipio TEXT PRIMARY KEY,
    departamento TEXT,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS dom_responsable (
    responsable TEXT PRIMARY KEY,
    rol TEXT,
    activo BOOLEAN DEFAULT TRUE
);

-- ==============================================================
-- Triggers y Funciones
-- ==============================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_aviso_updated_at 
BEFORE UPDATE ON aviso 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Función para actualizar Geometría desde LAT/LON decimal
CREATE OR REPLACE FUNCTION sync_aviso_geom()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.latitud_decimal IS NOT NULL AND NEW.longitud_decimal IS NOT NULL) THEN
        NEW.geom = ST_SetSRID(ST_Point(NEW.longitud_decimal, NEW.latitud_decimal), 4326);
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_sync_geom 
BEFORE INSERT OR UPDATE OF latitud_decimal, longitud_decimal ON aviso 
FOR EACH ROW EXECUTE PROCEDURE sync_aviso_geom();

-- ==============================================================
-- Funciones GeoJSON (Optimización Frontend)
-- ==============================================================
CREATE OR REPLACE FUNCTION get_avisos_as_geojson()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT json_build_object(
        'type', 'FeatureCollection',
        'features', json_agg(ST_AsGeoJSON(row)::json)
    ) INTO result
    FROM (
        SELECT 
            aviso, 
            geom, 
            prioridad, 
            denominacion, 
            tipo_de_gestion, 
            estado_workflow_interno,
            risk_score
        FROM aviso 
        WHERE geom IS NOT NULL
    ) row;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================
-- 9) CONFIGURACIÓN DE VALIDACIÓN
-- ==============================================================

CREATE TABLE IF NOT EXISTS cfg_kml_buffer_por_tipo_gestion (
    tipo_gestion TEXT PRIMARY KEY,
    buffer_m INTEGER NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO
    cfg_kml_buffer_por_tipo_gestion (tipo_gestion, buffer_m)
VALUES ('VEGETACIÓN', 200),
    ('CONSTRUCCIÓN', 100),
    ('OBRAS', 150) ON CONFLICT (tipo_gestion) DO
UPDATE
SET
    buffer_m = EXCLUDED.buffer_m,
    updated_at = now();

CREATE TABLE IF NOT EXISTS cfg_kml_validacion (
  id BIGSERIAL PRIMARY KEY,
  min_valid_geometries INTEGER NOT NULL DEFAULT 1,
  require_within_buffer_if_point_exists BOOLEAN NOT NULL DEFAULT TRUE,
  require_all_kml_within_buffer BOOLEAN NOT NULL DEFAULT FALSE,
  allowed_geom_types JSONB NOT NULL DEFAULT '[
    "Point","LineString","Polygon","MultiPoint","MultiLineString","MultiPolygon","GeometryCollection"
  ]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO
    cfg_kml_validacion (id)
VALUES (1) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS aviso_insumos (
    aviso TEXT PRIMARY KEY REFERENCES aviso (aviso),
    ruta_insumos_onedrive TEXT,
    estado_insumos TEXT DEFAULT 'NO_CREADO', -- NO_CREADO / CREADO / INCOMPLETO / COMPLETO
    fecha_creacion_carpeta TIMESTAMPTZ,
    fecha_envio_insumos TIMESTAMPTZ,
    usuario_envio_insumos UUID,
    kml_files_count INTEGER DEFAULT 0,
    kml_within_buffer BOOLEAN DEFAULT FALSE,
    kml_proximity_status TEXT DEFAULT 'NOT_EVALUATED',
    detalle_validacion_insumos JSONB,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================
-- 11) LÓGICA DE RIESGO Y SLA (0 USD Automation)
-- ==============================================================

-- Función para calcular el Risk Score de un aviso
CREATE OR REPLACE FUNCTION calculate_risk_score(p_aviso TEXT)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
    r RECORD;
BEGIN
    SELECT prioridad, tipo_de_gestion, fecha_aviso INTO r FROM aviso WHERE aviso = p_aviso;
    
    -- 1. Prioridad Base (0-40)
    IF r.prioridad = 'CRÍTICO' THEN score := score + 40;
    ELSIF r.prioridad = 'ALTO' THEN score := score + 30;
    ELSIF r.prioridad = 'MEDIO' THEN score := score + 20;
    ELSE score := score + 10;
    END IF;
    
    -- 2. Tipo de Gestión (0-30)
    IF r.tipo_de_gestion = 'CONSTRUCCIÓN' THEN score := score + 30;
    ELSIF r.tipo_de_gestion = 'VEGETACIÓN' THEN score := score + 20;
    ELSE score := score + 10;
    END IF;
    
    -- 3. Antigüedad (0-30)
    IF (now()::date - r.fecha_aviso) > 30 THEN score := score + 30;
    ELSIF (now()::date - r.fecha_aviso) > 7 THEN score := score + 15;
    END IF;

    RETURN GREATEST(0, LEAST(100, score));
END;
$$ LANGUAGE plpgsql;

-- Vista de SLAs y Deadlines
CREATE OR REPLACE VIEW v_aviso_sla AS
SELECT
    aviso,
    prioridad,
    fecha_aviso,
    fin_deseado as deadline_oficial,
    CASE
        WHEN prioridad = 'CRÍTICO' THEN fecha_aviso + interval '24 hours'
        WHEN prioridad = 'ALTO' THEN fecha_aviso + interval '72 hours'
        WHEN prioridad = 'MEDIO' THEN fecha_aviso + interval '7 days'
        ELSE fecha_aviso + interval '30 days'
    END as deadline_sla,
    CASE
        WHEN (
            now() > (
                fecha_aviso + interval '24 hours'
            )
            AND prioridad = 'CRÍTICO'
        ) THEN 'VENCIDO'
        WHEN (
            now() > (
                fecha_aviso + interval '72 hours'
            )
            AND prioridad = 'ALTO'
        ) THEN 'VENCIDO'
        ELSE 'A TIEMPO'
    END as estado_sla
FROM aviso;

-- ==============================================================
-- 13) GESTIÓN DE HISTORIAL (Auditoría Automática)
-- ==============================================================

CREATE OR REPLACE FUNCTION fn_aviso_audit()
RETURNS TRIGGER AS $$
DECLARE
    old_val TEXT;
    new_val TEXT;
BEGIN
    -- Detectar cambios en campos clave (Prioridad, Gestores, Estados)
    IF NEW.prioridad IS DISTINCT FROM OLD.prioridad THEN
        INSERT INTO aviso_historial (aviso, campo, valor_anterior, valor_nuevo, comentario)
        VALUES (NEW.aviso, 'prioridad', OLD.prioridad, NEW.prioridad, 'Cambio automático via ETL/UI');
    END IF;

    IF NEW.estado_workflow_interno IS DISTINCT FROM OLD.estado_workflow_interno THEN
        INSERT INTO aviso_historial (aviso, campo, valor_anterior, valor_nuevo, comentario)
        VALUES (NEW.aviso, 'estado_workflow_interno', OLD.estado_workflow_interno, NEW.estado_workflow_interno, 'Transición de estado');
    END IF;

    IF NEW.geom IS DISTINCT FROM OLD.geom THEN
        INSERT INTO aviso_historial (aviso, campo, valor_anterior, valor_nuevo, comentario)
        VALUES (NEW.aviso, 'geom', ST_AsText(OLD.geom), ST_AsText(NEW.geom), 'Actualización de ubicación');
    END IF;

    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_aviso_audit
BEFORE UPDATE ON aviso
FOR EACH ROW
EXECUTE FUNCTION fn_aviso_audit();

-- Líneas de Transmisión
CREATE TABLE IF NOT EXISTS infra_lineas (
    id SERIAL PRIMARY KEY,
    nombre TEXT,
    voltaje TEXT,
    geom GEOMETRY (MULTILINESTRING, 4326),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_infra_lineas_geom ON infra_lineas USING GIST (geom);

-- Torres
CREATE TABLE IF NOT EXISTS infra_torres (
    id SERIAL PRIMARY KEY,
    nombre TEXT,
    tipo TEXT,
    geom GEOMETRY (POINT, 4326),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_infra_torres_geom ON infra_torres USING GIST (geom);

-- Servidumbres
CREATE TABLE IF NOT EXISTS infra_servidumbre (
    id SERIAL PRIMARY KEY,
    nombre TEXT,
    area_m2 NUMERIC,
    geom GEOMETRY (MULTIPOLYGON, 4326),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_infra_servidumbre_geom ON infra_servidumbre USING GIST (geom);

-- Predios (Consolidado Catastro/SITCO)
CREATE TABLE IF NOT EXISTS infra_predios (
    id SERIAL PRIMARY KEY,
    chip TEXT,
    cedula_catastral TEXT,
    propietario TEXT,
    fuente TEXT, -- CATASTRO / SITCO
    geom GEOMETRY (MULTIPOLYGON, 4326),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_infra_predios_geom ON infra_predios USING GIST (geom);

CREATE INDEX IF NOT EXISTS idx_infra_predios_chip ON infra_predios (chip);

-- Función para obtener capas por BBOX (Optimización 0 USD)
CREATE OR REPLACE FUNCTION get_infra_by_bbox(
    layer_name TEXT,
    xmin DOUBLE PRECISION, 
    ymin DOUBLE PRECISION, 
    xmax DOUBLE PRECISION, 
    ymax DOUBLE PRECISION
)
RETURNS JSONB AS $$
DECLARE
    bbox GEOMETRY;
    result JSONB;
BEGIN
    bbox := ST_MakeEnvelope(xmin, ymin, xmax, ymax, 4326);
    
    CASE layer_name
        WHEN 'lineas' THEN
            SELECT json_build_object('type', 'FeatureCollection', 'features', json_agg(ST_AsGeoJSON(t)::json)) INTO result
            FROM (SELECT id, nombre, voltaje, geom FROM infra_lineas WHERE geom && bbox) t;
        WHEN 'torres' THEN
            SELECT json_build_object('type', 'FeatureCollection', 'features', json_agg(ST_AsGeoJSON(t)::json)) INTO result
            FROM (SELECT id, nombre, tipo, geom FROM infra_torres WHERE geom && bbox) t;
        WHEN 'servidumbre' THEN
            SELECT json_build_object('type', 'FeatureCollection', 'features', json_agg(ST_AsGeoJSON(t)::json)) INTO result
            FROM (SELECT id, nombre, area_m2, geom FROM infra_servidumbre WHERE geom && bbox) t;
        WHEN 'predios' THEN
            SELECT json_build_object('type', 'FeatureCollection', 'features', json_agg(ST_AsGeoJSON(t)::json)) INTO result
            FROM (SELECT id, chip, propietario, geom FROM infra_predios WHERE geom && bbox LIMIT 500) t; -- Limite para no matar el navegador
        ELSE
            result := '{"type": "FeatureCollection", "features": []}'::jsonb;
    END CASE;
    
    RETURN COALESCE(result, '{"type": "FeatureCollection", "features": []}'::jsonb);
END;
$$ LANGUAGE plpgsql;