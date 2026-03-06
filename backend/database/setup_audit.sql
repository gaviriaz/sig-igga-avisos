-- 0. ASEGURAR COLUMNAS EN TABLA AVISO (CONTRATO DE DATOS SENIOR MASTER)
ALTER TABLE aviso ADD COLUMN IF NOT EXISTS prioridad_fuente TEXT;

ALTER TABLE aviso ADD COLUMN IF NOT EXISTS prioridad_operativa TEXT;

ALTER TABLE aviso
ADD COLUMN IF NOT EXISTS estado_workflow_interno TEXT;

ALTER TABLE aviso ADD COLUMN IF NOT EXISTS tipo_status TEXT;

ALTER TABLE aviso ADD COLUMN IF NOT EXISTS reprogramacion TEXT;

ALTER TABLE aviso ADD COLUMN IF NOT EXISTS justificacion_repro TEXT;

ALTER TABLE aviso
ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0;

ALTER TABLE aviso ADD COLUMN IF NOT EXISTS status_usuario TEXT;

ALTER TABLE aviso ADD COLUMN IF NOT EXISTS status_sistema TEXT;

ALTER TABLE aviso
ADD COLUMN IF NOT EXISTS ruta_insumos_onedrive TEXT;

ALTER TABLE aviso ADD COLUMN IF NOT EXISTS assigned_to TEXT;

ALTER TABLE aviso ADD COLUMN IF NOT EXISTS assigned_to_name TEXT;

ALTER TABLE aviso
ADD COLUMN IF NOT EXISTS not_presente_en_corte BOOLEAN DEFAULT FALSE;

ALTER TABLE aviso
ADD COLUMN IF NOT EXISTS fecha_ultimo_corte_visto TIMESTAMPTZ;

ALTER TABLE aviso
ADD COLUMN IF NOT EXISTS estado_sla TEXT DEFAULT 'NORMAL';

ALTER TABLE aviso
ADD COLUMN IF NOT EXISTS estado_insumos TEXT DEFAULT 'NO_CREADO';

ALTER TABLE aviso
ADD COLUMN IF NOT EXISTS flag_intervencion_franja BOOLEAN DEFAULT FALSE;

ALTER TABLE aviso
ADD COLUMN IF NOT EXISTS distancia_estructura FLOAT;

ALTER TABLE aviso ADD COLUMN IF NOT EXISTS riesgo_cimentacion TEXT;

-- 0.1 CORREGIR TIPOS DE DATOS EN HISTORIAL
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'aviso_historial' AND column_name = 'usuario_id' AND data_type = 'uuid'
    ) THEN
        ALTER TABLE aviso_historial ALTER COLUMN usuario_id TYPE TEXT USING usuario_id::text;
    END IF;
END $$;

-- 1. CONFIGURACIÓN DE BUFFERS Y DOMINIOS
CREATE TABLE IF NOT EXISTS cfg_kml_buffer_por_tipo_gestion (
    tipo_gestion TEXT PRIMARY KEY,
    buffer_m INTEGER NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
DECLARE
    dom_name TEXT;
    doms TEXT[] := ARRAY['tipo_status', 'actividad_predial', 'gestor_predial',
                         'asistente_predial', 'analista_ambiental', 'tipo_aviso',
                         'municipio', 'departamento', 'zona_ejecutora', 'legalizacion', 'tipo_gestion'];
BEGIN
    FOREACH dom_name IN ARRAY doms
    LOOP
        EXECUTE format('CREATE TABLE IF NOT EXISTS dom_%I (
            id SERIAL PRIMARY KEY,
            valor TEXT UNIQUE NOT NULL,
            descripcion TEXT,
            activo BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT now()
        )', dom_name);
        
        -- ULTRA FIX: Asegurar columnas críticas
        EXECUTE format('ALTER TABLE dom_%I ADD COLUMN IF NOT EXISTS valor TEXT', dom_name);
        EXECUTE format('ALTER TABLE dom_%I ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE', dom_name);
    END LOOP;
END $$;

-- 1.2 VALORES DE CATÁLOGO (ALINEADOS A IGGA)
INSERT INTO
    dom_tipo_gestion (valor)
VALUES ('VEGETACIÓN'),
    ('CONSTRUCCIÓN'),
    ('OBRAS'),
    ('INSPECCIONES'),
    ('NOVEDADES') ON CONFLICT DO NOTHING;

INSERT INTO
    dom_tipo_status (valor)
VALUES ('VALIDAR'),
    ('GEAM'),
    ('GPRE'),
    ('PRER'),
    ('TAMB'),
    ('AMPO'),
    ('AMPO/GPRE'),
    ('AMPO/PRER'),
    ('TAMB/GPRE'),
    ('TAMB/AMPO'),
    ('TAMB/PRER'),
    ('GEAM/RSP'),
    ('SCOR/GEAM'),
    ('APROBADO'),
    ('CERRADO') ON CONFLICT DO NOTHING;

INSERT INTO
    cfg_kml_buffer_por_tipo_gestion (tipo_gestion, buffer_m)
VALUES ('VEGETACIÓN', 200),
    ('CONSTRUCCIÓN', 100),
    ('OBRAS', 150) ON CONFLICT (tipo_gestion) DO
UPDATE
SET
    buffer_m = EXCLUDED.buffer_m,
    updated_at = now();

-- 2. TABLAS DE SOPORTE E INSUMOS
CREATE TABLE IF NOT EXISTS aviso_insumos (
    id SERIAL PRIMARY KEY,
    aviso_id TEXT REFERENCES aviso (aviso),
    kml_files_count INTEGER DEFAULT 0,
    kml_parse_ok BOOLEAN DEFAULT FALSE,
    kml_feature_count INTEGER DEFAULT 0,
    kml_valid_geom_count INTEGER DEFAULT 0,
    kml_geom_types JSONB,
    kml_within_buffer BOOLEAN DEFAULT FALSE,
    kml_min_distance_m FLOAT,
    kml_buffer_used_m INTEGER,
    kml_proximity_status TEXT DEFAULT 'NOT_EVALUATED',
    checklist_insumos JSONB,
    observaciones_insumos TEXT,
    ultima_valid_insumos TIMESTAMPTZ DEFAULT now(),
    detalle_valid_json JSONB
);

CREATE TABLE IF NOT EXISTS aviso_evidencia (
    id SERIAL PRIMARY KEY,
    aviso_id TEXT REFERENCES aviso (aviso),
    tipo_evidencia TEXT,
    url_cloud TEXT,
    nombre_archivo TEXT,
    usuario TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    metadata_json JSONB
);

-- 3. SEEDING DE PERSONAL IGGA (USUARIOS DEL SISTEMA)
INSERT INTO
    app_system_user (
        username,
        full_name,
        email,
        role,
        zona_ejecutora,
        cedula
    )
VALUES (
        'gramirez',
        'Germán Alonso Ramirez Manrique',
        'gramirez@igga.com.co',
        'Analista Ambiental',
        'NORTE',
        '9850550'
    ),
    (
        'avargas',
        'Angie Alexandra Vargas Solano',
        'avargas@igga.com.co',
        'Analista Ambiental',
        'ORIENTE',
        '1015449155'
    ),
    (
        'acaballero',
        'Andrés Mauricio Caballero López',
        'acaballero@igga.com.co',
        'Analista Ambiental',
        'NORTE',
        '1017215167'
    ),
    (
        'jdsanchez',
        'Julian David Sanchez Ortiz',
        'jdsanchez@igga.com.co',
        'Analista Ambiental',
        'CENTRO/SUR',
        '1061800593'
    ),
    (
        'fortega',
        'Franklin Rosemberg Ortega Guzman',
        'fortega@igga.com.co',
        'Analista Ambiental',
        'SUR',
        '1110548940'
    ),
    (
        'lcarvajal',
        'Laura Crisitna Carvajal Rodríguez',
        'lcarvajal@igga.com.co',
        'Cordinador Predial Junior',
        'CENTRO/SUR',
        '1001480080'
    ),
    (
        'cmotato',
        'Carlos Alberto Motato',
        'cmotato@igga.com.co',
        'Cordinador Predial Senior',
        'GLOBAL',
        '80810013'
    ),
    (
        'mruiz',
        'Maria Paula Ruiz Lara',
        'mruiz@igga.com.co',
        'Cordinador Predial Junior',
        'NORTE',
        '1152221299'
    ),
    (
        'aristizabal',
        'Sebastian Aristizabal Berrio',
        'aristizabal@igga.com.co',
        'Oficina',
        'NORTE',
        '1214739920'
    ),
    (
        'jcarreno',
        'Juan Carlos Carreño Aguirre',
        'jcarreno@igga.com.co',
        'Oficina',
        'GLOBAL',
        '1036640753'
    ),
    (
        'jehernandez',
        'Juan Esteban Hernandez Rivera',
        'jehernandez@igga.com.co',
        'Oficina',
        'NORTE',
        '1128406481'
    ),
    (
        'ilondono',
        'Isabela Londoño Hurtado',
        'ilondono@igga.com.co',
        'Oficina',
        'GLOBAL',
        '1216722292'
    ),
    (
        'yuramirez',
        'Yurley Ramirez Cano',
        'yuramirez@igga.com.co',
        'Oficina',
        'SUR',
        '1000899544'
    ),
    (
        'agaviria',
        'Albert Daniel Gaviria Zapata',
        'agaviria@igga.com.co',
        'Oficina',
        'ORIENTE',
        '1007533510'
    ),
    (
        'alujan',
        'Alejandro Lujan Puerta',
        'alujan@igga.com.co',
        'Oficina',
        'CENTRO/SUR',
        '1152714404'
    ),
    (
        'avanegas',
        'Andrés Felipe Vanegas Correa',
        'avanegas@igga.com.co',
        'Cordinador Predial Junior',
        'ORIENTE',
        '1214746797'
    ),
    (
        'jyepes',
        'Julián Andres Castro Yepes',
        'jyepes@igga.com.co',
        'Gestor de Campo',
        'ORIENTE',
        '0'
    ),
    (
        'nmolano',
        'Nicolle Stephanny Molano Martínez',
        'nmolano@igga.com.co',
        'Gestor de Campo',
        'ORIENTE',
        '0'
    ),
    (
        'lmotato',
        'Luis Carlos Motato Cogollo',
        'lmotato@igga.com.co',
        'Gestor de Campo',
        'NORTE',
        '0'
    ),
    (
        'vrios',
        'Victor Hugo Rios',
        'vrios@igga.com.co',
        'Gestor de Campo',
        'NORTE',
        '0'
    ),
    (
        'jgiraldo',
        'Juan Pablo Giraldo Duque',
        'jgiraldo@igga.com.co',
        'Gestor de Campo',
        'NORTE',
        '0'
    ) ON CONFLICT (username) DO
UPDATE
SET role = EXCLUDED.role,
zona_ejecutora = EXCLUDED.zona_ejecutora;

-- 4. TRIGGER DE AUDITORÍA (SOPORTE TOTAL)
CREATE OR REPLACE FUNCTION trg_aviso_audit_func()
RETURNS TRIGGER AS $$
DECLARE
    column_name TEXT;
    old_val TEXT;
    new_val TEXT;
    v_user TEXT;
    v_role TEXT;
BEGIN
    BEGIN
        v_user := current_setting('request.jwt.claims', true)::jsonb->>'sub';
        v_role := current_setting('request.jwt.claims', true)::jsonb->'user_metadata'->>'role';
    EXCEPTION WHEN OTHERS THEN
        v_user := 'system-task';
        v_role := 'system';
    END;

    IF (TG_OP = 'UPDATE') THEN
        FOR column_name IN 
            SELECT attname FROM pg_attribute WHERE attrelid = 'public.aviso'::regclass AND attnum > 0 AND NOT attisdropped
        LOOP
            IF column_name IN ('updated_at', 'geom', 'geom_operativa', 'batch_id_actual') THEN CONTINUE; END IF;
            EXECUTE format('SELECT ($1).%I::text, ($2).%I::text', column_name, column_name) USING OLD, NEW INTO old_val, new_val;
            IF (old_val IS DISTINCT FROM new_val) THEN
                INSERT INTO aviso_historial (aviso, campo, valor_anterior, valor_nuevo, usuario_id, rol, timestamp)
                VALUES (NEW.aviso, column_name, old_val, new_val, v_user, v_role, now());
            END IF;
        END LOOP;
    ELSIF (TG_OP = 'INSERT') THEN
         INSERT INTO aviso_historial (aviso, campo, valor_nuevo, usuario_id, rol, timestamp, comentario)
         VALUES (NEW.aviso, 'RECORD', 'CREATED', v_user, v_role, now(), 'Aviso ingresado al sistema');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_aviso_audit ON aviso;

CREATE TRIGGER trg_aviso_audit AFTER INSERT OR UPDATE ON aviso FOR EACH ROW EXECUTE FUNCTION trg_aviso_audit_func();