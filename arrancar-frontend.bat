@echo off
echo =============================================
echo   Lobo Alquileres - Frontend Local
echo =============================================
echo.

cd /d "%~dp0lobo-alquileres-frontend"

echo Arrancando frontend en http://localhost:5173
echo Presiona Ctrl+C para detener.
echo.

npm run dev
