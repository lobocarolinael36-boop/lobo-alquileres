# =============================================================================
# Lobo Alquileres — Backend (Spring Boot 3 / Java 17)
# Build multi-stage: Maven compila, JRE 17 ejecuta.
# =============================================================================

# ── Stage 1: compilar ─────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Copiar solo el pom primero para cachear dependencias
COPY lobo-alquileres-backend/pom.xml ./
RUN mvn dependency:go-offline -q

# Copiar el código fuente y compilar (sin tests para acelerar el build)
COPY lobo-alquileres-backend/src/ src/
RUN mvn package -DskipTests -q

# ── Stage 2: imagen de producción ─────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Reducir tiempos de inicio de SecureRandom en Linux
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", \
            "-Djava.security.egd=file:/dev/./urandom", \
            "-jar", "app.jar"]
