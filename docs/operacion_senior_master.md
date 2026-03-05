---
description: Guía de Operación Senior Master - SIG IGGA / ISA v7.5
---

Este documento detalla el flujo operativo del sistema tras la implementación de la arquitectura de grado empresarial.

### 1. Ingesta Semanal de Datos (SharePoint ETL)
El sistema ahora opera bajo un contrato de "Tabla de Verdad" semanal:
- **Sync SP**: Al presionar este botón en el Dashboard, el sistema descarga el Excel más reciente de SharePoint.
- **Upsert**: Se crean nuevos registros y se actualizan los existentes.
- **Capa RAW**: Se guarda una copia íntegra del JSON del Excel en la tabla `avisos_raw` para auditoría total.
- **Gobernanza**: La `Prioridad` del Excel se guarda como `prioridad_fuente`, mientras que `prioridad_operativa` queda disponible para ajustes internos de riesgo.

### 2. Reglas de Negocio Automáticas
Al importar datos, el motor de reglas realiza lo siguiente:
- **Vegetación**: Valida si existen datos de `Distancia Copa-Fase` y `Altura`. Marca como **VALIDAR** si faltan datos críticos.
- **Construcción**: Activa la bandera `Intervención en Franja` si el estatus es crítico o si el análisis geoespacial detecta proximidad indebida.
- **Snapping GIS**: Si se dispone de capas de torres/líneas en PostGIS, el sistema asigna automáticamente el **Tramo** y la **Torre** más cercana al aviso.

### 3. Gestión y Auditoría (Ficha Operativa)
- **Historial (Timeline)**: Cualquier cambio en los campos (ya sea por un nuevo Excel o por edición manual) genera una entrada en la pestaña de **Auditoría**. Puedes ver quién cambió qué, cuándo y qué valor tenía antes.
- **Insumos**: La pestaña de Insumos permite auditar la carpeta de SharePoint vinculada. Verifica que existan las subcarpetas obligatorias (`PREDIAL`, `INVENTARIO`) y que los archivos KML sean consistentes con las coordenadas del aviso.
- **Puerta de Calidad (QA/QC)**: Los coordinadores y analistas ambientales deben validar los avisos marcados como `VALIDAR`. Una vez revisados, pueden subir el nivel de aprobación para permitir el cierre técnico.

### 4. Análisis Geoespacial Avanzado
- **Tabla de Atributos**: Ubicada en la parte inferior (estilo QGIS). Permite filtros rápidos y selección masiva. Hacer clic en una fila centrará el mapa automáticamente en el activo.
- **Risk Score (0-100)**: Se calcula dinámicamente basándose en la prioridad de la fuente, la distancia de fase (vegetación) y el tipo de aviso.

✅ **El sistema ahora es una herramienta de operación y auditoría, garantizando trazabilidad total para IGGA.**
