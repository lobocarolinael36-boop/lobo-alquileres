# Estructura del Proyecto — Lobo Alquileres SaaS

## Backend — Spring Boot (Arquitectura en Capas)

```
lobo-alquileres-backend/
├── src/
│   ├── main/
│   │   ├── java/com/loboalquileres/
│   │   │   │
│   │   │   ├── config/                        ← Configuraciones técnicas
│   │   │   │   ├── SecurityConfig.java        ← Spring Security + JWT filter chain
│   │   │   │   ├── CorsConfig.java            ← CORS para el frontend React
│   │   │   │   ├── JacksonConfig.java         ← Serialización BigDecimal → String (no perder precisión)
│   │   │   │   └── OpenApiConfig.java         ← Documentación Swagger/OpenAPI
│   │   │   │
│   │   │   ├── controller/                    ← Capa HTTP: recibe requests, delega al service
│   │   │   │   ├── AuthController.java
│   │   │   │   ├── PersonaController.java
│   │   │   │   ├── InmuebleController.java
│   │   │   │   ├── ContratoController.java
│   │   │   │   ├── CuotaController.java
│   │   │   │   └── IndiceInflacionController.java
│   │   │   │
│   │   │   ├── dto/                           ← Objetos de transferencia (nunca exponer entidades)
│   │   │   │   ├── request/
│   │   │   │   │   ├── LoginRequest.java
│   │   │   │   │   ├── PersonaRequest.java
│   │   │   │   │   ├── InmuebleRequest.java
│   │   │   │   │   ├── ContratoRequest.java
│   │   │   │   │   └── RegistrarPagoRequest.java
│   │   │   │   └── response/
│   │   │   │       ├── AuthResponse.java
│   │   │   │       ├── PersonaResponse.java
│   │   │   │       ├── InmuebleResponse.java
│   │   │   │       ├── ContratoResponse.java
│   │   │   │       ├── CuotaResponse.java
│   │   │   │       └── ErrorResponse.java
│   │   │   │
│   │   │   ├── entity/                        ← Entidades JPA (mapean 1:1 con tablas Postgres)
│   │   │   │   ├── Persona.java
│   │   │   │   ├── PersonaRol.java
│   │   │   │   ├── Inmueble.java
│   │   │   │   ├── Contrato.java
│   │   │   │   ├── Cuota.java
│   │   │   │   ├── IndiceInflacion.java
│   │   │   │   ├── Documento.java
│   │   │   │   └── Usuario.java
│   │   │   │
│   │   │   ├── enums/                         ← Enumeraciones de dominio
│   │   │   │   ├── RolPersona.java
│   │   │   │   ├── TipoInmueble.java
│   │   │   │   ├── EstadoContrato.java
│   │   │   │   ├── TipoAjuste.java
│   │   │   │   ├── PeriodicidadAjuste.java
│   │   │   │   └── EstadoCuota.java
│   │   │   │
│   │   │   ├── exception/                     ← Manejo centralizado de errores
│   │   │   │   ├── GlobalExceptionHandler.java   ← @RestControllerAdvice
│   │   │   │   ├── ResourceNotFoundException.java
│   │   │   │   ├── BusinessRuleException.java
│   │   │   │   └── ContratoConflictException.java
│   │   │   │
│   │   │   ├── mapper/                        ← Conversión Entity ↔ DTO (con MapStruct)
│   │   │   │   ├── PersonaMapper.java
│   │   │   │   ├── InmuebleMapper.java
│   │   │   │   ├── ContratoMapper.java
│   │   │   │   └── CuotaMapper.java
│   │   │   │
│   │   │   ├── repository/                    ← Spring Data JPA: solo queries
│   │   │   │   ├── PersonaRepository.java
│   │   │   │   ├── InmuebleRepository.java
│   │   │   │   ├── ContratoRepository.java
│   │   │   │   ├── CuotaRepository.java
│   │   │   │   └── IndiceInflacionRepository.java
│   │   │   │
│   │   │   ├── security/                      ← JWT y Spring Security
│   │   │   │   ├── JwtTokenProvider.java      ← Genera y valida tokens
│   │   │   │   ├── JwtAuthenticationFilter.java ← Intercepta cada request
│   │   │   │   └── UserDetailsServiceImpl.java
│   │   │   │
│   │   │   └── service/                       ← Lógica de negocio (regla de oro: nada de HTTP aquí)
│   │   │       ├── PersonaService.java        ← Interfaces
│   │   │       ├── InmuebleService.java
│   │   │       ├── ContratoService.java       ← Genera cuotas al crear contrato
│   │   │       ├── CuotaService.java
│   │   │       ├── AjusteInflacionService.java ← Motor IPC/ICL + alertas
│   │   │       ├── DocumentoService.java      ← Generación de PDFs
│   │   │       └── impl/                      ← Implementaciones con @Service
│   │   │           ├── PersonaServiceImpl.java
│   │   │           ├── InmuebleServiceImpl.java
│   │   │           ├── ContratoServiceImpl.java
│   │   │           ├── CuotaServiceImpl.java
│   │   │           ├── AjusteInflacionServiceImpl.java
│   │   │           └── DocumentoServiceImpl.java
│   │   │
│   │   └── resources/
│   │       ├── application.yml                ← Config base (sin secretos)
│   │       ├── application-dev.yml            ← Overrides para desarrollo local
│   │       ├── application-prod.yml           ← Overrides para producción
│   │       └── db/migration/
│   │           ├── V1__init_schema.sql        ← Esquema completo (tablas, tipos, índices)
│   │           └── V2__seed_data.sql          ← Datos de prueba para desarrollo
│   │
│   └── test/java/com/loboalquileres/
│       ├── controller/                        ← Tests de integración HTTP
│       ├── service/                           ← Tests unitarios de negocio
│       └── repository/                        ← Tests de queries JPA
│
├── Dockerfile
├── .env.example
└── pom.xml
```

---

## Frontend — React + TypeScript (Feature-based Architecture)

```
lobo-alquileres-frontend/
├── src/
│   │
│   ├── api/                                   ← Toda la comunicación con el backend
│   │   ├── client.ts                          ← Instancia axios con JWT interceptor
│   │   ├── auth.ts
│   │   ├── personas.ts
│   │   ├── inmuebles.ts
│   │   ├── contratos.ts
│   │   └── cuotas.ts
│   │
│   ├── components/
│   │   ├── ui/                                ← Componentes shadcn/ui (auto-generados, no editar)
│   │   ├── layout/
│   │   │   ├── AppShell.tsx                   ← Layout raíz: sidebar + topbar + contenido
│   │   │   ├── Sidebar.tsx                    ← Navegación lateral (corporate teal)
│   │   │   ├── TopBar.tsx                     ← Header: breadcrumb + usuario + notificaciones
│   │   │   └── PageHeader.tsx                 ← Título de página + CTA principal
│   │   └── shared/
│   │       ├── DataTable.tsx                  ← Tabla genérica con sorting y paginación
│   │       ├── StatusBadge.tsx                ← Badge de estado (PAGADA, VENCIDA, etc.)
│   │       ├── MoneyDisplay.tsx               ← Monto formateado ARS/USD en font-mono
│   │       ├── ConfirmDialog.tsx              ← Modal de confirmación para acciones destructivas
│   │       └── EmptyState.tsx                 ← Estado vacío con ilustración e instrucción
│   │
│   ├── features/                              ← Núcleo de la app, organizado por dominio
│   │   ├── auth/
│   │   │   ├── components/LoginForm.tsx
│   │   │   ├── hooks/useAuth.ts               ← Login, logout, estado del usuario
│   │   │   └── types.ts
│   │   ├── personas/
│   │   │   ├── components/
│   │   │   │   ├── PersonaForm.tsx            ← Alta/edición de persona + selector de roles
│   │   │   │   └── PersonaCard.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── usePersonas.ts             ← TanStack Query: lista con filtros
│   │   │   │   └── usePersonaMutations.ts     ← TanStack Query: create / update / delete
│   │   │   └── types.ts
│   │   ├── inmuebles/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── types.ts
│   │   ├── contratos/
│   │   │   ├── components/
│   │   │   │   ├── ContratoForm.tsx
│   │   │   │   ├── AjusteAlert.tsx            ← ⚠️ Alerta prominente cuando hay ajuste pendiente
│   │   │   │   └── ContratoTimeline.tsx       ← Visualización de cuotas en el tiempo
│   │   │   ├── hooks/
│   │   │   └── types.ts
│   │   └── cuotas/
│   │       ├── components/
│   │       │   ├── CuotasList.tsx
│   │       │   └── RegistrarPagoModal.tsx     ← Formulario rápido de cobro
│   │       ├── hooks/
│   │       └── types.ts
│   │
│   ├── hooks/
│   │   └── useBreakpoint.ts
│   │
│   ├── lib/
│   │   ├── utils.ts                           ← cn() para clases condicionales de Tailwind
│   │   ├── formatters.ts                      ← formatARS(), formatUSD(), formatDate(), formatPct()
│   │   └── validators.ts                      ← Schemas Zod para todos los formularios
│   │
│   ├── pages/                                 ← Una página = una ruta
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx                  ← KPIs: cuotas vencidas, ajustes próximos, ocupación
│   │   ├── PersonasPage.tsx
│   │   ├── InmueblesPage.tsx
│   │   ├── ContratosPage.tsx
│   │   └── CuotasPage.tsx
│   │
│   ├── router/
│   │   ├── index.tsx                          ← Árbol de rutas React Router v6
│   │   └── ProtectedRoute.tsx                 ← Redirige a login si no hay JWT válido
│   │
│   ├── store/
│   │   └── authStore.ts                       ← Zustand: usuario, token, rol
│   │
│   ├── types/
│   │   └── index.ts                           ← Tipos globales compartidos entre features
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                              ← CSS variables + @tailwind directives
│
├── index.html
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
├── package.json
└── .env.example
```
