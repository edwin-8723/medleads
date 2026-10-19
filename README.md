# MedLeads

Mini-aplicación para una clínica ficticia de medicina estética: recibe solicitudes de valoración desde un formulario público y permite al equipo de atención verlas y gestionarlas en un panel protegido.

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend:** NestJS + TypeORM + PostgreSQL
- **Enlace público:** _<pendiente: URL de Vercel>_
- **Panel administrativo:** `/admin` (la contraseña de prueba se entrega por correo)

## Funcionalidades (requisitos obligatorios)

1. **Formulario público** (`/`): nombre, correo, teléfono, país (lista), procedimiento y mensaje opcional. Errores junto a cada campo, mensaje de confirmación y diseño responsive. La validación se repite **en el servidor** (DTO + `ValidationPipe`).
2. **Asignación automática:** Colombia → Coordinación Nacional; cualquier otro país → Internacional. Estado inicial: `Nuevo`.
3. **Panel `/admin`:** login con contraseña, listado (más reciente primero) con nombre, país, coordinación, estado y fecha; filtro por coordinación; cambio de estado persistido en BD; contadores (total / nacionales / internacionales).
4. **Repositorio:** commits progresivos y este README.

## Cómo ejecutarlo en local

Requisitos: Node.js 20+ y Docker (para PostgreSQL).

```bash
# 1) Base de datos (PostgreSQL en el puerto 5433 para no chocar con una instalación local)
docker compose up -d

# 2) API (http://localhost:4000)
cd apps/api
cp .env.example .env        # ajusta ADMIN_PASSWORD y JWT_SECRET
npm install
npm run start:dev

# 3) Web (http://localhost:3000) — en otra terminal
cd apps/web
cp .env.example .env.local
npm install
npm run dev
```

Pruebas unitarias del API: `cd apps/api && npm test`.

## Variables de entorno

**`apps/api/.env`**

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del API (por defecto 4000). |
| `DATABASE_URL` | Cadena de conexión a PostgreSQL. |
| `DATABASE_SSL` | `true` en servicios gestionados con SSL (Neon, Supabase, Railway). |
| `DB_SYNC` | `true` crea/actualiza las tablas automáticamente. |
| `ADMIN_PASSWORD` | Contraseña del único usuario administrador (definido en variables de entorno, como permite el enunciado). |
| `JWT_SECRET` | Secreto para firmar el JWT de sesión (cadena larga y aleatoria). |

**`apps/web/.env.local`**

| Variable | Descripción |
|---|---|
| `API_URL` | URL interna del API NestJS a la que Next redirige `/api/*`. |

No se versionan credenciales: solo `.env.example` con valores de ejemplo.

## Decisiones técnicas

- **NestJS + TypeORM:** NestJS es la opción preferida del enunciado; TypeORM se integra de forma nativa con sus módulos y decoradores. `synchronize` crea el esquema para agilizar la prueba; en producción real usaría migraciones.
- **Proxy mismo origen (`rewrites` de Next):** el navegador solo habla con el dominio de Next y este reenvía `/api/*` al API. Así la cookie de sesión es de primera parte (sin problemas de SameSite entre dominios) y no hace falta abrir CORS.
- **Autenticación:** usuario único con `ADMIN_PASSWORD` en variables de entorno (nunca en el repositorio). El login compara con `timingSafeEqual` y entrega un JWT en cookie `httpOnly` (+ `Secure` en producción, `SameSite=Lax`), con expiración de 8 h. Se descartó `localStorage` porque cualquier XSS podría leer el token.
- **Protección real en el servidor:** `JwtAuthGuard` protege el listado, los contadores y el cambio de estado; el `proxy.ts` de Next solo hace una redirección optimista. Sin sesión el API responde 401 y no devuelve datos.
- **Validación en el servidor:** `whitelist` + `forbidNonWhitelisted` descartan/rechazan campos inesperados; los textos se recortan (`trim`) y el correo se guarda en minúsculas.
- **Transiciones de estado validadas en el servidor:** `Nuevo → Contactado → Convertido | Descartado` (Nuevo también puede descartarse). No se puede saltar de Nuevo a Convertido.
- **Seguridad adicional:** `helmet`, rate-limit (5 intentos/min en login, 10/min en el formulario) y respuesta mínima en el endpoint público (no expone datos).
- **Asignación de coordinación:** se normaliza el país (minúsculas, sin tildes) y se compara con `colombia`; está cubierta por tests unitarios.

## Uso de IA

Usé **Claude (Claude Code)** como asistente para planear la arquitectura, generar la base del código. Revisé y probé el resultado (curl contra el API y prueba manual del formulario y del panel) y puedo explicar y modificar cualquier parte en la sustentación.

## Qué mejoraría con más tiempo

- Migraciones de TypeORM en lugar de `synchronize`.
- Tests e2e del API (con base de datos de pruebas) y tests de componentes del formulario.
- Paginación y búsqueda en el panel; historial de cambios de estado (quién y cuándo).
- Tabla de usuarios en BD (con hash bcrypt) en lugar del admin único por variable de entorno; sesión con refresh token y roles por coordinación.
- Extras opcionales no implementados: webhook de pagos con HMAC-SHA256 idempotente y clasificación de prioridad con IA (con modo de respaldo).
- Dockerizar también la API y la web dentro de `docker-compose.yml`.

## Estructura

```
apps/api   → NestJS (leads, auth)
apps/web   → Next.js (formulario público, /admin)
docker-compose.yml → PostgreSQL local
RESPUESTAS.md      → Partes A y C de la prueba
```
