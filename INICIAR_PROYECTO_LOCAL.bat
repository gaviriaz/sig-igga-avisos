@echo off
echo ===================================================
echo   INICIANDO SISTEMA SIG-IGGA-AVISOS (MODO LOCAL)
echo ===================================================
echo.
echo Iniciando Servidor Backend...
start cmd /k "cd backend && venv\Scripts\activate && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo.
echo ===================================================
echo [!] Para el Frontend (GitHub Pages), se necesita
echo tu IP actual:
for /f "tokens=14" %%a in ('ipconfig ^| findstr IPv4') do set IPLOCAL=%%a
echo IP ENCONTRADA: %IPLOCAL%
echo.
echo VE A ESTE LINK EN TU NAVEGADOR:
echo https://sig-igga.pages.dev/?apiUrl=http://%IPLOCAL%:8000
echo.
echo (O usa simplemente http://localhost:8000 en el .env)
echo ===================================================
pause
