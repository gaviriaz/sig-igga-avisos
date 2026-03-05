-- ==========================================
-- SISTEMA SIG IGGA / ISA - DOMINIOS Y CATÁLOGOS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.dom_tipo_status (
    id SERIAL PRIMARY KEY,
    valor TEXT UNIQUE NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.dom_actividad_predial (
    id SERIAL PRIMARY KEY,
    valor TEXT UNIQUE NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.dom_tipo_gestion (
    id SERIAL PRIMARY KEY,
    valor TEXT UNIQUE NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);

-- Insertar valores base
INSERT INTO
    public.dom_tipo_gestion (valor)
VALUES ('VEGETACIÓN'),
    ('CONSTRUCCIÓN'),
    ('OBRAS'),
    ('INSPECCIONES') ON CONFLICT DO NOTHING;

INSERT INTO
    public.dom_tipo_status (valor)
VALUES ('INGRESADO'),
    ('VALIDAR'),
    ('CLASIFICADO'),
    ('GEORREFERENCIADO'),
    ('ASIGNADO'),
    ('EN GESTIÓN'),
    ('QA/QC'),
    ('APROBADO'),
    ('CERRADO') ON CONFLICT DO NOTHING;