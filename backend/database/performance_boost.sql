-- OPTIMIZACIÓN SENIOR MASTER PARA SIG-IGGA
-- Propósito: Mejorar el rendimiento de consultas frecuentes y reducir carga en Supabase/Render.

-- 1. Índices en la tabla principal de AVISO
CREATE INDEX IF NOT EXISTS idx_aviso_municipio ON aviso (municipio);

CREATE INDEX IF NOT EXISTS idx_aviso_estado_workflow ON aviso (estado_workflow_interno);

CREATE INDEX IF NOT EXISTS idx_aviso_gestor ON aviso (gestor_predial);

CREATE INDEX IF NOT EXISTS idx_aviso_zona ON aviso (zona_ejecutora);

CREATE INDEX IF NOT EXISTS idx_aviso_tipo_status ON aviso (tipo_status);

CREATE INDEX IF NOT EXISTS idx_aviso_fecha ON aviso (fecha_aviso DESC);

CREATE INDEX IF NOT EXISTS idx_aviso_risk_score ON aviso (risk_score DESC);

-- 2. Índices en HISTORIAL (Para auditoría rápida)
CREATE INDEX IF NOT EXISTS idx_historial_aviso ON aviso_historial (aviso);

CREATE INDEX IF NOT EXISTS idx_historial_timestamp ON aviso_historial (timestamp DESC);

-- 3. Índices en NOTIFICACIONES
CREATE INDEX IF NOT EXISTS idx_notif_usuario_leida ON notificacion (usuario, leida);

-- 4. Optimización de DOMINIOS
CREATE INDEX IF NOT EXISTS idx_dominio_codigo ON dominio (codigo);

-- 5. Configuración de Performance de Postgres (Para el pooler de Supabase)
-- Estas son sugerencias, Supabase maneja la mayoría, pero tenerlas ayuda en el plan free.
-- Nota: En Supabase Free, algunas configuraciones de sistema están limitadas,
-- pero los índices son 100% efectivos.

ANALYZE aviso;

ANALYZE aviso_historial;

ANALYZE dominio;