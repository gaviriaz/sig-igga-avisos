# 🛡️ Manual de Despliegue Permanente - Cloudflare Zero Trust ($0)

Este documento detalla los pasos para convertir el túnel temporal en una infraestructura de producción estable.

## 1. Registro en Cloudflare
- Crea una cuenta en [dash.cloudflare.com](https://dash.cloudflare.com/sign-up).
- Activa el panel de **Zero Trust** (gratuito para hasta 50 usuarios).

## 2. Configuración del Túnel Nominado
1. En el panel de Zero Trust, ve a **Networks > Tunnels**.
2. Haz clic en **Add a Tunnel** y selecciona **Cloudflared**.
3. Dale un nombre: `SIG-BACKEND-PROD`.
4. Copia el **Connector Token** que te proporciona Cloudflare.

## 3. Ejecución Local Permanente (Sin Admin)
Usa el ejecutable que ya descargamos en `tools/` para autenticar tu máquina:
```powershell
# 1. Autenticar (Abrirá el navegador)
.\tools\cloudflared.exe tunnel login

# 2. Configurar el túnel con el Token
.\tools\cloudflared.exe tunnel run --token TU_TOKEN_AQUI
```

## 4. Hostname Público
- En la pestaña **Public Hostname** del túnel, configura:
  - **Public Hostname**: `api.tu-dominio.com`
  - **Service**: `http://localhost:8000` (El puerto de tu backend Python)

## 5. Beneficios Inmediatos
- **SSL Gratuito**: Tu API tendrá HTTPS real.
- **WAF**: Cloudflare bloqueará ataques de inyección SQL y bots automáticamente.
- **Sin IP Pública**: No necesitas que tu proveedor de internet te de una IP fija.

---
*Documento generado por el NOC Command Center - SIG IGGA OS*
