@echo off
echo =============================================
echo   Lobo Alquileres - Backend Local
echo =============================================
echo.

cd /d "%~dp0lobo-alquileres-backend"

set DB_HOST=localhost
set DB_PORT=5433
set DB_NAME=lobo_alquileres
set DB_USER=postgres
set DB_PASSWORD=0613

echo Arrancando backend en http://localhost:8080
echo Presiona Ctrl+C para detener.
echo.

mvnw.cmd spring-boot:run
echo.
echo *** El backend se detuvo. Ver error arriba. ***
pause
