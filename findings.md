# Hallazgos y Descubrimientos del Sistema SIG IGGA

## 🚨 Descubrimiento Crítico #1: Mismatch de Tablas de Municipios
**Problema:** Al acceder a `sig-igga-avisos.onrender.com/domains/municipio` el servidor retorna un error 500 informando que la columna `valor` no existe en la tabla `dom_municipio`.
**Causa:** Es probable que la tabla se haya creado mediante una migración parcial o importación manual desde Excel que no siguió el estándar del nuevo sistema (donde todas las tablas de catálogo deben tener `id`, `valor`, `descripcion`, `activo`).
**Solución Planificada:** Incluir una sentencia `ALTER TABLE dom_municipio ADD COLUMN IF NOT EXISTS valor TEXT` en el script maestro `setup_audit.sql`.

## 🚨 Descubrimiento Crítico #2: Límite de Memoria en Render Free (512MB)
**Contexto:** Con 30 usuarios simultáneos y una lista de 10,000 avisos, el servidor Render Free se satura.
**Mitigación:** Se ha implementado un filtrado de columnas para el listado general (`essential_columns`). Solo se envían ~10 campos en lugar de los 50+. El detalle completo se sirve bajo demanda en el endpoint `/avisos/{id}`.

## 🚨 Descubrimiento Crítico #3: Cuota de Almacenamiento en Cliente (5MB)
**Contexto:** `localStorage` se llenaba al intentar persistir los 10,000 avisos, causando el error `QuotaExceededError`.
**Solución Activa:** Switched to `sessionStorage` y **excluimos** la lista de avisos de la persistencia de Zustand.

## 🔑 Especificaciones de Insumos (OneDrive/KML)
**Buffer por Tipo de Gestión:**
- VEGETACIÓN: 200m
- CONSTRUCCIÓN: 100m
- OBRAS: 150m
**Estructura Requerida:** `{Aviso}/PREDIAL`, `INVENTARIO`, `SHP`, `REPORTE`.

## 👤 Personal de IGGA (Maestro de Usuarios)
- **Albert Daniel Gaviria Zapata**: ORIENTE, Predial Oficina.
- **Carlos Alberto Motato**: GLOBAL, Cordinador Predial Senior.
- **Laura Cristina Carvajal Rodríguez**: CENTRO/SUR, Cordinador Predial Junior.
... (Demás usuarios agregados al plan de seeding) ...
