@echo off
echo =============================================
echo   Lobo Alquileres - Backend Local
echo =============================================
echo.

:: Cerrar cualquier proceso que use el puerto 8080
echo Liberando puerto 8080...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080 " 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 2 /nobreak >nul

:: Forzar el Java correcto
set "JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot"

:: Variables de base de datos
set DB_HOST=localhost
set DB_PORT=5433
set DB_NAME=lobo_alquileres
set DB_USER=postgres
set DB_PASSWORD=0613

cd /d "%~dp0lobo-alquileres-backend"

echo Arrancando backend en http://localhost:8080
echo Presiona Ctrl+C para detener.
echo.

"%JAVA_HOME%\bin\java.exe" -classpath ".mvn\wrapper\maven-wrapper.jar" "-Dmaven.multiModuleProjectDirectory=%CD%" org.apache.maven.wrapper.MavenWrapperMain spring-boot:run

echo.
echo *** El backend se detuvo. ***
pause
