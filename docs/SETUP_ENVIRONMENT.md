# Guía de Configuración del Entorno - SIG IGGA/ISA

Para construir este sistema desde cero y sin costo, necesitamos las siguientes herramientas instaladas en tu máquina Windows.

## 1. Instalación SIN Administrador (User Scope)

Si no tienes permisos de administrador, puedes instalar todo en tu carpeta de usuario local siguiendo estos pasos desde la terminal:

### a) Visual Studio Code (User Setup)
VS Code tiene un instalador específico que no requiere admin y se instala en `%LocalAppData%`.
```powershell
winget install Microsoft.VisualStudioCode --scope user
```

### b) Python (Vía Microsoft Store)
La versión de la Microsoft Store es la forma más limpia de tener Python sin pedir permisos de administrador.
```powershell
winget install Python.Python.3.12 --source msstore
```
*Si winget falla, simplemente búscalo como "Python 3.12" en la Microsoft Store de Windows.*

### c) Node.js (Vía FNM - Fast Node Manager)
El instalador `.msi` de Node suele pedir admin. La mejor alternativa "No-Admin" es usar un gestor como `fnm`.
1. Instalar `fnm` (en el scope del usuario):
   ```powershell
   winget install Schniz.fnm --scope user
   ```
2. Reinicia la terminal y luego instala Node:
   ```powershell
   fnm install --lts
   fnm use lts
   ```

---

## 2. Configuración Manual (Si winget falla)
Si prefieres descargar los archivos directamente:

1. **VS Code**: Descarga el **"User Installer"** desde [code.visualstudio.com](https://code.visualstudio.com/download).
2. **Python**: Descarga el instalador de [python.org](https://www.python.org/downloads/windows/), ejecútalo y asegúrate de marcar **"Use admin privileges when installing py.exe" (DESMARCAR)** y elegir una ruta en tu carpeta `Documents` o `AppData`.
3. **Node.js**: Descarga la versión **"Windows Binary (.zip)"** de [nodejs.org](https://nodejs.org/en/download/), descomprímela en una carpeta y agrega esa ruta a tus **Variables de Entorno de Usuario** (no de sistema).


---

## 2. Creación de Cuentas (0 USD - Free Tiers)

Para que el sistema sea **Costo 0**, debes crear las siguientes cuentas (usando el plan gratuito):

1.  **GitHub**: Para el código fuente y despliegue del frontend (GitHub Pages).
2.  **Supabase**: Para la base de datos PostgreSQL + PostGIS, Autenticación y Almacenamiento.
3.  **Cloudflare**: Para el dominio, SSL y seguridad (puedes usar el plan gratuito).
4.  **Render / Railway**: Para desplegar el servidor de FastAPI y GeoServer (usando los créditos gratuitos).

---

## 3. Acceso a SharePoint
El sistema requiere acceso a la URL oficial que proporcionaste:
`https://iggaingenieria.sharepoint.com/:f:/s/Gestion_Predial_OYM/IgAAeewjOgc9Tbj4AcMHiD23AWbxCEcJjfinow9jCHVOUcw?e=hztWbHva`

Asegúrate de tener permisos de lectura en esta ruta y las carpetas de AÑO/MES mencionadas.
