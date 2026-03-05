-- =============================================================================
-- 🆘 SCRIPT DE REPARACIÓN "SENIOR MASTER" PARA SUPABASE (v2)
-- Ejecuta esto en el SQL Editor de Supabase si ves errores 404 o 500.
-- =============================================================================

-- 1. Reparar Tabla de Perfiles (Soluciona 404 en el Login/Dashboard)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'Oficina',
    avatar_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar que los perfiles sean legibles por el API
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Profiles Access" ON public.profiles;

CREATE POLICY "Public Profiles Access" ON public.profiles FOR
SELECT USING (true);

-- 2. Reparar Vista de SLA (Soluciona 500 en /avisos)
-- Nota: Usamos DROP para evitar "cannot drop columns from view"
DROP VIEW IF EXISTS v_aviso_sla;

CREATE OR REPLACE VIEW v_aviso_sla AS
SELECT
    aviso,
    fin_deseado AS deadline_sla,
    CASE
        WHEN fin_deseado < NOW()
        AND fecha_cierre IS NULL THEN 'VENCIDO'
        WHEN fin_deseado < (NOW() + INTERVAL '2 days')
        AND fecha_cierre IS NULL THEN 'CRÍTICO'
        WHEN fecha_cierre IS NOT NULL THEN 'CERRADO'
        ELSE 'EN TIEMPO'
    END AS estado_sla
FROM aviso;

-- 3. Inyectar Dominios Básicos (Si faltan)
-- Nos aseguramos de que las tablas existan antes del insert
CREATE TABLE IF NOT EXISTS dom_tipo_status (valor TEXT PRIMARY KEY);

CREATE TABLE IF NOT EXISTS dom_tipo_de_gestion (valor TEXT PRIMARY KEY);

INSERT INTO
    dom_tipo_status (valor)
VALUES ('VALIDAR'),
    ('COMPLETO') ON CONFLICT DO NOTHING;

INSERT INTO
    dom_tipo_de_gestion (valor)
VALUES ('VEGETACIÓN'),
    ('CONSTRUCCIÓN') ON CONFLICT DO NOTHING;

-- 4. Asegurar que las tablas tengan RLS configurado o desactivado para pruebas
ALTER TABLE aviso DISABLE ROW LEVEL SECURITY;
-- Para desarrollo facilitar visualización
ALTER TABLE import_batch DISABLE ROW LEVEL SECURITY;

ALTER TABLE dom_tipo_status DISABLE ROW LEVEL SECURITY;

ALTER TABLE dom_tipo_de_gestion DISABLE ROW LEVEL SECURITY;