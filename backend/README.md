# 🏠 RentaHogar - API Backend

API REST para la gestión integral de propiedades en alquiler. Permite a los propietarios gestionar sus inmuebles, inquilinos, pagos, facturas e incidencias; y a los inquilinos consultar su estado de pagos, facturas y reportar incidencias.

---

## 📋 Índice

1. [Stack tecnológico](#stack-tecnológico)
2. [Instalación y puesta en marcha](#instalación-y-puesta-en-marcha)
3. [Scripts disponibles](#scripts-disponibles)
4. [Endpoints de la API](#endpoints-de-la-api)
5. [Arquitectura y estructura de carpetas](#arquitectura-y-estructura-de-carpetas)
6. [Problemas encontrados y soluciones](#problemas-encontrados-y-soluciones)

---

## Stack tecnológico

- **Runtime**: Node.js >= 18
- **Lenguaje**: TypeScript
- **Framework**: Express.js
- **Base de datos**: PostgreSQL + Sequelize
- **Autenticación**: JWT (jsonwebtoken + bcryptjs)
- **Validación**: express-validator
- **Logging**: Winston + Morgan (logs condicionales según NODE_ENV)
- **Email**: SendGrid API (producción) / Nodemailer SMTP (desarrollo)
- **Tareas programadas**: node-cron
- **Subida de archivos**: Multer
- **Tooling**: ESLint (@typescript-eslint) + Prettier + tsx

---

## Instalación y puesta en marcha

### Requisitos previos
- Node.js >= 18
- PostgreSQL instalado y en ejecución
- npm o yarn

### 1. Clonar el repositorio
```bash
git clone <URL_DEL_REPOSITORIO>
cd RentaHogar
```

### 2. Crear la base de datos
```bash
# En PostgreSQL (psql o cliente gráfico)
CREATE DATABASE rental_management;
```

### 3. Backend
```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus datos de PostgreSQL, JWT y SMTP
npm run setup:schema   # Crear tablas (si es primera vez)
npm run seed:reset    # Poblar la base de datos con datos de prueba
npm run dev           # Iniciar servidor en desarrollo (puerto 3000)
```

### 4. Frontend
```bash
cd frontend
npm install
ng serve              # Iniciar en http://localhost:4200
```

### Variables de entorno (.env)
| Variable | Descripción |
|----------|-------------|
| `NODE_ENV` | development / production |
| `PORT` | Puerto del servidor (default: 3000) |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS` | Conexión PostgreSQL |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Configuración JWT |
| `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL` | Email vía SendGrid API (recomendado para Render) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Email vía SMTP (alternativa, desarrollo local) |
| `FRONTEND_URL` | URL del frontend (CORS y enlaces en emails) |

### Credenciales de prueba (seed)
| Rol | Email | Contraseña |
|-----|-------|------------|
| Propietario | carlos@demo.com | 123456 |
| Propietario | maria@demo.com | 123456 |
| Inquilino/a | ana@demo.com | 123456 |
| Inquilino | pedro@demo.com | 123456 |
| Inquilino/a | laura@demo.com | 123456 |

---

## Scripts disponibles

| Script | Comando | Descripción |
|--------|---------|-------------|
| `dev` | `tsx watch src/server.ts` | Desarrollo con reinicio automático |
| `build` | `tsc` | Compilar TypeScript a JavaScript |
| `start` | `node dist/server.js` | Producción (ejecutar tras `build`) |
| `lint` | `eslint src/ --ext .ts` | Chequeo de código con TypeScript |
| `lint:fix` | `eslint src/ --ext .ts --fix` | Corrección automática de lint |
| `format` | `prettier --write "src/**/*.ts"` | Formateo de código |
| `seed` | `tsx src/seeds/seed.ts` | Poblar BBDD |
| `seed:reset` | `tsx src/seeds/seed.ts --reset` | Limpiar y repoblar BBDD |
| `setup:schema` | `tsx src/seeds/setup_schema.ts` | Crear/actualizar esquema de tablas |
| `migrate:invoices` | `tsx src/seeds/migrate_invoices_period.ts` | Migrar facturas al formato de periodo |

---

## Endpoints de la API

### Autenticación
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registro de propietario |
| POST | `/api/auth/login` | Inicio de sesión |
| GET | `/api/auth/profile` | Obtener perfil |
| PUT | `/api/auth/profile` | Actualizar perfil |
| PUT | `/api/auth/change-password` | Cambiar contraseña |
| DELETE | `/api/auth/account` | Eliminar cuenta |

### Propiedades (owner)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/properties` | Crear propiedad |
| GET | `/api/properties` | Listar propiedades (búsqueda y paginación) |
| GET | `/api/properties/:id` | Detalle de propiedad |
| PUT | `/api/properties/:id` | Actualizar propiedad |
| DELETE | `/api/properties/:id` | Eliminar propiedad |

### Inquilinos (owner)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/tenants` | Registrar inquilino (envía email con credenciales) |
| GET | `/api/tenants` | Listar inquilinos |
| GET | `/api/tenants/:id` | Detalle de inquilino |
| DELETE | `/api/tenants/:id/property/:propertyId` | Desvincular inquilino |
| DELETE | `/api/tenants/assignment/:assignmentId` | Desvincular por ID de asignación |

### Pagos
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/payments` | Crear pago (owner) |
| GET | `/api/payments` | Listar pagos (owner) |
| GET | `/api/payments/summary` | Resumen dashboard (owner) |
| GET | `/api/payments/overdue` | Pagos retrasados (owner) |
| GET | `/api/payments/my-payments` | Mis pagos (tenant) |
| PATCH | `/api/payments/:id/pay` | Marcar como pagado (owner) |
| DELETE | `/api/payments/:id` | Eliminar pago (owner) |

### Facturas
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/invoices` | Crear factura (owner, soporta documento adjunto) |
| GET | `/api/invoices` | Listar facturas (owner) |
| GET | `/api/invoices/:id` | Detalle de factura (owner) |
| PUT | `/api/invoices/:id` | Actualizar factura (owner) |
| PATCH | `/api/invoices/:id/pay` | Marcar como pagada (owner) |
| DELETE | `/api/invoices/:id` | Eliminar factura (owner) |
| GET | `/api/invoices/my-invoices` | Facturas del inquilino (tenant) |

### Incidencias
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/incidents` | Crear incidencia (tenant, envía email al propietario) |
| GET | `/api/incidents` | Listar incidencias |
| GET | `/api/incidents/property/:propertyId` | Incidencias por propiedad |
| GET | `/api/incidents/my-property/all` | Incidencias de mi propiedad (tenant) |
| GET | `/api/incidents/:id` | Detalle de incidencia |
| PATCH | `/api/incidents/:id/status` | Actualizar estado (owner) |
| DELETE | `/api/incidents/:id` | Eliminar incidencia |

### Notificaciones
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/notifications` | Listar notificaciones |
| PATCH | `/api/notifications/read-all` | Marcar todas como leídas |
| PATCH | `/api/notifications/:id/read` | Marcar como leída |
| DELETE | `/api/notifications/:id` | Eliminar notificación |

### Dashboard
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/dashboard/tenant` | Dashboard del inquilino |
| GET | `/api/dashboard/search?q=...` | Búsqueda global (owner) |

---

## Arquitectura y estructura de carpetas

```
backend/
├── src/
│   ├── config/          # Conexión a base de datos (Sequelize)
│   ├── controllers/     # Lógica de negocio
│   ├── middleware/      # Auth, validación, upload, manejo de errores
│   ├── models/          # Modelos Sequelize
│   ├── routes/          # Definición de rutas
│   ├── services/        # Email, scheduler (tareas programadas)
│   ├── utils/           # Logger, helpers
│   ├── seeds/           # Scripts de poblado y migración
│   ├── app.ts           # Configuración Express
│   └── server.ts        # Punto de entrada
├── .eslintrc.json      # ESLint con @typescript-eslint
├── .prettierrc
├── tsconfig.json
├── .env.example
└── package.json
```

---

## Problemas encontrados y soluciones

0. **No puedo iniciar sesión**
   - **Backend no arrancado**: Asegúrate de que el backend está en marcha (`npm run dev` en `backend/`). Si ves "No se pudo conectar con el servidor", el frontend no llega al API (puerto 3000).
   - **PostgreSQL no accesible**: Verifica que PostgreSQL está corriendo y que las credenciales en `.env` son correctas.
   - **Sin cuenta**: Si no te has registrado, usa "Registrarse como propietario" en la pantalla de login.
   - **Credenciales de prueba**: Si ejecutaste el seed (`npm run seed` o `seed:reset`), puedes usar por ejemplo `carlos@demo.com` / `123456`.
   - **Contraseña incorrecta**: El mensaje mostrará "Contraseña incorrecta" si el email existe pero la contraseña no coincide.

1. **CORS**: El frontend Angular en puerto 4200 no podía comunicarse con el backend en 3000. Solución: Configurar `cors()` con el origin correcto (`FRONTEND_URL`) en `app.ts`.

2. **ESLint: "Unexpected token :" o " Parsing error"**: El proyecto usa TypeScript. ESLint debe usar `@typescript-eslint/parser` y `@typescript-eslint/eslint-plugin`. Ver `.eslintrc.json` para la configuración.

3. **Angular standalone components**: La migración a standalone components requiere importar `CommonModule`, `FormsModule`, etc. en cada componente individualmente.

4. **SASS @use vs @import**: El proyecto usa `@use` y `@forward`; las rutas relativas deben ser correctas desde cada componente Angular.
