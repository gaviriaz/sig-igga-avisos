# Plan de Implementación: SIG IGGA / ISA - Senior Master Edition

## Objetivo
Construir el sistema integral de gestión de avisos (Zero Cost) según los requerimientos Senior Full Stack detallados por el usuario, incluyendo ETL, RBAC, GIS avanzado, e integración de insumos OneDrive/KML.

## Fases del Proyecto

### Fase 1: Refinamiento de Base de Datos y Modelos
- [ ] Actualizar `models.py` con TODOS los campos del contrato de datos (50+ columnas).
- [ ] Incorporar campos de "Insumos" (OneDrive/KML) en el modelo.
- [ ] Actualizar `setup_audit.sql` para asegurar que todas las tablas de dominios tengan las columnas correctas (`valor`, `activo`).
- [ ] Aplicar migraciones a Supabase mediante el endpoint `/admin/setup-db`.

### Fase 2: Usuarios y RBAC (Control de Acceso)
- [ ] Poblar la tabla `app_system_user` con el personal de IGGA proporcionado.
- [ ] Implementar decoradores de seguridad a nivel de campo (Field-level security) en el backend.
- [ ] Asegurar que solo roles autorizados puedan cambiar estados Críticos (`TIPO STATUS`, `reprogramacion`, etc.).

### Fase 3: Módulo de Insumos (OneDrive & KML)
- [ ] Crear el servicio `InsumosValidator` para verificar estructura de carpetas `{Aviso}/PREDIAL`, `INVENTARIO`, `SHP`, `REPORTE`.
- [ ] Implementar lógica de proximidad espacial (PostGIS): Validar que el KML esté dentro del buffer (100m-200m) del punto del aviso.
- [ ] Crear endpoints para gestionar la ruta de OneDrive y disparar validaciones.

### Fase 4: ETL & Trazabilidad (RAW a Normalizado)
- [ ] Estructurar la lógica de ingesta para manejar el archivo semanal `GEAM_N2_dd_mm_yyyy.xlsx`.
- [ ] Implementar el "Upsert Operacional" que genera historial de cambios en `aviso_historial`.
- [ ] Asegurar que los avisos desaparecidos en el nuevo corte se marquen como `no_presente_en_corte`.

### Fase 5: Frontend GIS Avanzado & PWA
- [ ] Actualizar la interfaz para mostrar el estado de insumos y el historial de cambios.
- [ ] Mejorar el mapa para visualizar los KML de los insumos (WMS/WFS o GeoJSON dinámico).
- [ ] Configurar el Service Worker para soporte Offline completo (PWA).

### Fase 6: Despliegue y Verificación Final
- [ ] Sincronizar todos los cambios a GitHub.
- [ ] Verificar funcionamiento en Render Free (Backend) y GitHub Pages (Frontend).
- [ ] Realizar prueba de carga final con los nuevos modelos.

## Estado de Errores Conocidos
- [ ] Error 500 en `/domains/municipio` (Falta columna `valor` o similar).
- [ ] QuotaExceededError en frontend (Mitigado, pero monitorear con nuevos campos).
