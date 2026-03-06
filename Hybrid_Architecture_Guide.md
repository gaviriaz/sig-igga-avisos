# 🌐 Manual Técnico: Dominio Seguro e Infraestructura Híbrida ($0)

Este manual describe cómo conectar tu proyecto local a la red global de Cloudflare de forma permanente.

## 1. Despliegue del Frontend (Vite) en Cloudflare Pages
1. Sube tu carpeta `frontend/` a un repositorio privado en **GitHub**.
2. En el panel de Cloudflare, ve a **Workers & Pages > Create application > Pages**.
3. Conecta tu GitHub y selecciona el repositorio.
4. Configuraciones de compilación:
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`
5. **Listo**: Tendrás una URL como `https://sig-igga-avisos.pages.dev`.

## 2. Configuración del Túnel para la API
Cuando tengas tu dominio (ej: `sig-igga.eu.org`):
1. Ve a **Zero Trust > Networks > Tunnels**.
2. En la pestaña de **Public Hostname**, añade:
   - **Hostname**: `api.sig-igga.eu.org`
   - **Service Type**: `HTTP`
   - **URL**: `localhost:8000`

## 3. Seguridad WAF (Costo $0)
Activa estas reglas en el panel de Cloudflare (Security > WAF):
- **Bot Fight Mode**: Bloquea ataques automáticos.
- **Security Level**: Ponlo en `Medium`.
- **Browser Integrity Check**: Asegura que los visitantes usen navegadores reales.

---
*Manual generado por el NOC Command Center - Estrategia Global v7.5*
