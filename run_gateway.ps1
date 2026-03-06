param (
    [string]$Port = "8000"
)

Write-Host "🚀 Iniciando Dynamic Gateway Link (Zero Cost Tier)..." -ForegroundColor Cyan

# 1. Iniciar cloudflared tunnel y capturar la salida
# Usamos un archivo temporal para leer la URL generada
$tempFile = Join-Path $PSScriptRoot "tunnel_log.tmp"
if (Test-Path $tempFile) { Remove-Item $tempFile }

Write-Host "📡 Solicitando túnel rápido a Cloudflare..." -ForegroundColor Yellow

# Iniciamos el túnel en segundo plano
$process = Start-Process -FilePath "$PSScriptRoot\tools\cloudflared.exe" -ArgumentList "tunnel", "--url", "http://localhost:$Port" -NoNewWindow -PassThru -RedirectStandardError $tempFile

try {
    Write-Host "⏳ Esperando URL de Cloudflare..." -ForegroundColor Gray
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
        Write-Host "`n✅ ¡Túnel Activo!" -ForegroundColor Green
        Write-Host "🔗 URL Global: " -NoNewline
        Write-Host $tunnelUrl -ForegroundColor White -BackgroundColor DarkBlue
        Write-Host "`n📱 Puedes acceder desde cualquier lugar del mundo." -ForegroundColor Gray
        
        # Guardar la URL en un archivo que el frontend pueda consultar si fuera necesario
        # O simplemente mostrarla para que el usuario sepa qué poner en sus pruebas
        $tunnelUrl | Out-File (Join-Path $PSScriptRoot "active_tunnel_url.txt")
        
        Write-Host "`n💡 Presiona CTRL+C para cerrar el túnel." -ForegroundColor DarkGray
        
        # Mantener el proceso vivo hasta que se cierre la terminal
        $process.WaitForExit()
    } else {
        Write-Error "❌ No se pudo capturar la URL del túnel. Revisa la conexión."
    }
}
finally {
    if ($process -and !$process.HasExited) { $process.Kill() }
    if (Test-Path $tempFile) { Remove-Item $tempFile }
}
