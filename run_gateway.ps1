param (
    [string]$Port = "8000"
)

# Configuración de Supabase (Bridge de Autodescubrimiento)
$SB_URL = "https://vdzfamjklmwlptitxvvd.supabase.co"
$SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkemZhbWprbG13bHB0aXR4dnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NjMwMDYsImV4cCI6MjA4ODAzOTAwNn0.vTgeIcQK8beqhV8gpGjDFXM2sHZEE0c90yYDptMAjVo"

Write-Host "[SYSTEM] Iniciando Dynamic Gateway Link (Auto-Discovery Mode)..." -ForegroundColor Cyan

# 1. Iniciar cloudflared tunnel y capturar la salida
$tempFile = Join-Path $PSScriptRoot "tunnel_log.tmp"
if (Test-Path $tempFile) { Remove-Item $tempFile }

Write-Host "[LOGS] Solicitando tunel rapido a Cloudflare..." -ForegroundColor Yellow

# Iniciamos el tunel en segundo plano
$process = Start-Process -FilePath "$PSScriptRoot\tools\cloudflared.exe" -ArgumentList "tunnel", "--url", "http://localhost:$Port" -NoNewWindow -PassThru -RedirectStandardError $tempFile

try {
    Write-Host "[WAIT] Esperando URL de Cloudflare..." -ForegroundColor Gray
    $tunnelUrl = ""
    $timeout = 30 # segundos
    $elapsed = 0
    
    while ([string]::IsNullOrEmpty($tunnelUrl) -and $elapsed -lt $timeout) {
        if (Test-Path $tempFile) {
            $content = Get-Content $tempFile -Raw
            if ($content -match "https://[a-z0-9-]+\.trycloudflare\.com") {
                $tunnelUrl = $matches[0]
            }
        }
        Start-Sleep -Seconds 1
        $elapsed++
    }

    if ($tunnelUrl) {
        Write-Host "`n[OK] ¡Tunel Activo!" -ForegroundColor Green
        Write-Host "Link Global: $tunnelUrl" -ForegroundColor White -BackgroundColor DarkBlue
        
        # 🚀 2. SUBIDA AUTOMÁTICA A SUPABASE
        Write-Host "[SYNC] Sincronizando nueva puerta de enlace con Supabase..." -ForegroundColor Cyan
        
        $headers = @{
            "apikey" = $SB_KEY
            "Authorization" = "Bearer $SB_KEY"
            "Content-Type" = "application/json"
            "Prefer" = "resolution=merge"
        }
        
        $body = @{
            "key" = "gateway_url"
            "value" = $tunnelUrl
            "updated_at" = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
        } | ConvertTo-Json

        try {
            # Intentamos upsert (insertar o actualizar)
            Invoke-RestMethod -Uri "$SB_URL/rest/v1/system_config" -Method Post -Headers $headers -Body $body -ErrorAction Stop
            Write-Host "[SUCCESS] Cloud-Discovery actualizado. El frontend te encontrara solo." -ForegroundColor Green
        } catch {
            Write-Host "[RETRY] Intentando actualizacion vía PATCH..." -ForegroundColor Gray
            Invoke-RestMethod -Uri "$SB_URL/rest/v1/system_config?key=eq.gateway_url" -Method Patch -Headers $headers -Body $body
            Write-Host "[SUCCESS] Cloud-Discovery actualizado vía PATCH." -ForegroundColor Green
        }

        # Guardar localmente también
        $tunnelUrl | Out-File (Join-Path $PSScriptRoot "active_tunnel_url.txt")
        
        Write-Host "`n[INFO] El sistema esta operando en modo manos libres." -ForegroundColor Gray
        Write-Host "[CTRL+C] para cerrar el tunel." -ForegroundColor DarkGray
        
        $process.WaitForExit()
    } else {
        Write-Error "[FAIL] No se pudo capturar la URL del tunel. Revisa la conexion."
    }
}
finally {
    if ($process -and !$process.HasExited) { $process.Kill() }
    if (Test-Path $tempFile) { Remove-Item $tempFile }
}
