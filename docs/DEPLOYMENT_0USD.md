# Despliegue Costo 0 USD - SIG IGGA/ISA

Para que este sistema funcione de por vida sin pagar licencias, utilizaremos los **Planes Gratuitos** de los líderes de industria.

## 1. Base de Datos (Supabase Free)
- **Base de Datos**: PostgreSQL + PostGIS.
- **Autenticación**: Provee JWT para usuarios (Oficina, Analista, Coordinador).
- **Almacenamiento**: Primeros 1GB de evidencias gratis.
- **Acción**: Crea un proyecto en [Supabase](https://supabase.com/). Ejecuta el archivo `backend/database/schema.sql` en el editor SQL de Supabase.

## 2. Servidor Backend (Render o Fly.io)
- **Servicio**: FastAPI corriendo en un contenedor o servicio web.
- **Costo**: Plan gratuito (puede "dormirse" tras 15 min de inactividad, ideal para ahorro).
- **Variables de Entorno**: Configura `SUPABASE_URL`, `SUPABASE_KEY`, `AZURE_CLIENT_ID`, etc.
- **Acción**: Conecta tu repositorio de GitHub a [Render](https://render.com/).

## 3. Frontend (GitHub Pages)
- **Servicio**: Despliegue estático de Vite + React.
- **Costo**: 0 USD (Ilimitado para repositorios públicos/privados con límites generosos).
- **Acción**: Usa [GitHub Actions](https://github.com/features/actions) para compilar y desplegar automáticamente.

## 4. GeoServer (Railway / Docker)
- **Servicio**: Motor GIS para WMS/WFS.
- **Costo**: Railway ofrece 5 USD mensuales gratis. Si excedes, puedes usar **Maptiler** (plan free) o servir GeoJSON directamente desde Supabase/FastAPI.
- **Estrategia**: He optimizado el sistema para que Supabase entregue GeoJSON directamente, reduciendo la dependencia crítica de GeoServer para visualización básica.

## 5. Auditoría y Trazabilidad (Inmutable)
- El diseño utiliza la tabla `aviso_historial` y `avisos_raw` para que NI UN solo byte del Excel original se pierda. 
- Cada viernes (import_batch), se guarda un hash SHA256 para garantizar que no se re-importen datos ya cargados innecesariamente.
