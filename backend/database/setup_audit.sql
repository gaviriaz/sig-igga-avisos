-- 0. ASEGURAR COLUMNAS EN TABLA AVISO (Migración Progresiva)
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

-- 0.1 CORREGIR TIPOS DE DATOS EN HISTORIAL (Forzar TEXT para permitir IDs de sistema)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'aviso_historial' AND column_name = 'usuario_id' AND data_type = 'uuid'
    ) THEN
        ALTER TABLE aviso_historial ALTER COLUMN usuario_id TYPE TEXT USING usuario_id::text;
    END IF;
END $$;

-- 1. CONFIGURACIÓN DE BUFFERS POR TIPO DE GESTIÓN
CREATE TABLE IF NOT EXISTS cfg_kml_buffer_por_tipo_gestion (
    tipo_gestion TEXT PRIMARY KEY,
    buffer_m INTEGER NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.1 TABLAS DE DOMINIOS (CATÁLOGOS)
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
    END LOOP;
END $$;

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

-- 2. TABLA DE INSUMOS (GATE DE CAMPO)
CREATE TABLE IF NOT EXISTS aviso_insumos (
    aviso TEXT PRIMARY KEY REFERENCES aviso (aviso),
    ruta_insumos_onedrive TEXT,
    estado_insumos TEXT DEFAULT 'NO_CREADO', -- NO_CREADO, CREADO, INCOMPLETO, COMPLETO
    kml_within_buffer BOOLEAN DEFAULT FALSE,
    kml_proximity_status TEXT DEFAULT 'NOT_EVALUATED', -- OK, OUT_OF_BUFFER, NOT_EVALUATED
    kml_min_distance_m FLOAT,
    checklist_insumos JSONB,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ASEGURAR TABLAS DE AUDITORÍA Y RAW
CREATE TABLE IF NOT EXISTS avisos_raw (
    id SERIAL PRIMARY KEY,
    batch_id TEXT,
    aviso TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS aviso_historial (
    historial_id SERIAL PRIMARY KEY,
    aviso TEXT,
    campo TEXT,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    usuario_id TEXT,
    rol TEXT,
    timestamp TIMESTAMPTZ DEFAULT now(),
    comentario TEXT,
    batch_id TEXT
);

-- 4. TRIGGER DE AUDITORÍA (SENIOR MASTER)
CREATE OR REPLACE FUNCTION trg_aviso_audit_func()
RETURNS TRIGGER AS $$
DECLARE
    column_name TEXT;
    old_val TEXT;
    new_val TEXT;
    v_user TEXT;
    v_role TEXT;
BEGIN
    -- Intentar obtener contexto de Supabase Auth
    BEGIN
        v_user := current_setting('request.jwt.claims', true)::jsonb->>'sub';
        v_role := current_setting('request.jwt.claims', true)::jsonb->'user_metadata'->>'role';
    EXCEPTION WHEN OTHERS THEN
        v_user := 'system-task';
        v_role := 'system';
    END;

    IF (TG_OP = 'UPDATE') THEN
        FOR column_name IN 
            SELECT attname 
            FROM pg_attribute 
            WHERE attrelid = 'public.aviso'::regclass 
            AND attnum > 0 
            AND NOT attisdropped
        LOOP
            -- Ignorar campos de sistema
            IF column_name IN ('updated_at', 'geom', 'geom_operativa', 'batch_id_actual') THEN
                CONTINUE;
            END IF;

            EXECUTE format('SELECT ($1).%I::text, ($2).%I::text', column_name, column_name)
            USING OLD, NEW
            INTO old_val, new_val;

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

CREATE TRIGGER trg_aviso_audit
AFTER INSERT OR UPDATE ON aviso
FOR EACH ROW EXECUTE FUNCTION trg_aviso_audit_func();

-- 5. TABLA DE PERFILES (Para Supabase Auth Integration)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    full_name TEXT,
    role TEXT DEFAULT 'Gestor de Campo',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Triggers para autocompletar perfil desde auth.users (Supabase Magic)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'Oficina');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;