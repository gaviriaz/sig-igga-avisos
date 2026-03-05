# SIG-IGGA-AVISOS

## Descripción
SIG-IGGA-AVISOS es un Sistema de Información Geográfica (SIG) enfocado en la gestión y visualización de **avisos** relacionados con infraestructura, específicamente en áreas con líneas de transmisión de energía, predios catastrales y servidumbres. Permite el monitoreo y reporte de avisos sobre predios mediante una interfaz de mapa dinámica y un backend robusto para el procesamiento de datos GIS.

## Estructura del Proyecto

```text
SIG-IGGA-AVISOS/
├── backend/            # API en Python (FastAPI) y lógica de negocio.
│   ├── core/           # Configuraciones clave y utilidades compartidas.
│   ├── database/       # Schema SQL, modelos de SQLAlchemy y bases de datos locales.
│   ├── scripts/        # Scripts de utilidad (limpieza de datos, seeding, debug).
│   ├── services/       # Servicios de lógica (ingesta de datos, geolocalización).
│   └── main.py         # Punto de entrada de la API.
├── frontend/           # Aplicación web en React (Vite + TypeScript).
│   ├── src/            # Código fuente (componentes, hooks, almacenamiento).
│   └── public/         # Recursos estáticos.
├── capas/              # Capas de datos geográficos (GeoJSON) y archivos Excel.
├── docs/               # Documentación adicional de configuración y despliegue.
└── README.md           # Este archivo.
```

## Requisitos Previos

- **Backend**: Python 3.10+
- **Frontend**: Node.js 18+ (con npm o yarn)

## Instalación y Ejecución

### 1. Backend

Desde la raíz del proyecto o la carpeta `backend/`:
1. Crea un entorno virtual: `python -m venv venv`
2. Activa el entorno virtual: `venv\Scripts\activate` (Windows) o `source venv/bin/activate` (Linux/Mac)
3. Instala dependencias: `pip install -r requirements.txt`
4. Inicia el servidor: `python main.py`

### 2. Frontend

Desde la carpeta `frontend/`:
1. Instala dependencias: `npm install`
2. Ejecuta el modo desarrollo: `npm run dev`

Podrás acceder a la interfaz en `http://localhost:5173` y a la documentación de la API en `http://localhost:8000/docs`.

## Notas de Desarrollo
- Se han organizado los scripts de utilidad en `backend/scripts/` para mantener limpios los directorios principales.
- El archivo `.gitignore` ha sido configurado para excluir bases de datos locales, entornos virtuales y logs temporales.
- Los archivos GeoJSON de gran tamaño se encuentran en la carpeta `capas/`.

---
*Desarrollado para DGZ Enginnering*
