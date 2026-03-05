$NODE_DIR = "c:\Users\AlbertG\node-portable\node-v20.12.1-win-x64"
$env:PATH = "$NODE_DIR;$env:PATH"

Write-Host "--------------------------------------------------" -ForegroundColor Gray
Write-Host "SIG IGGA - LANZADOR FRONTEND (Master Senior)" -ForegroundColor Cyan
Write-Host "--------------------------------------------------" -ForegroundColor Gray
Write-Host "Directorio Node: $NODE_DIR" -ForegroundColor Yellow

if (!(Test-Path "$NODE_DIR\node.exe")) {
    Write-Host "ERROR: No se encontro node.exe en $NODE_DIR" -ForegroundColor Red
    exit
}

Write-Host "Versiones detectadas:" -ForegroundColor Cyan
node -v
npm -v

Write-Host "Iniciando servidor de desarrollo (Vite)..." -ForegroundColor Green
npm run dev
