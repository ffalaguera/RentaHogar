# Guía de despliegue de RentaHogar en Render

Esta guía te lleva paso a paso para desplegar el backend, frontend y base de datos de RentaHogar usando el tier gratuito de Render.

---

## Requisitos previos

- Cuenta en [Render](https://render.com)
- Repositorio Git con tu proyecto (GitHub, GitLab o Bitbucket)
- Node.js 18+ instalado localmente para pruebas

---

## Resumen de la arquitectura en Render

| Servicio | Tipo en Render | URL ejemplo |
|----------|----------------|-------------|
| Base de datos PostgreSQL | PostgreSQL (o externa Neon/Supabase) | Variable de entorno |
| API Backend | Web Service | `https://rentahogar-api.onrender.com` |
| Frontend Angular | Static Site | `https://rentahogar.onrender.com` |

**Importante:** El tier gratuito de PostgreSQL en Render expira a los 30 días. Para una base de datos persistente gratuita, usa **Neon** o **Supabase** (ver Paso 1 alternativo).

---

## Paso 1: Base de datos PostgreSQL

### Opción A: PostgreSQL en Render (30 días gratis)

1. Entra en [Render Dashboard](https://dashboard.render.com)
2. **New +** → **PostgreSQL**
3. Configura:
   - **Name:** `rentahogar-db`
   - **Database:** `rental_management` (o el que prefieras)
   - **User:** se genera automático
   - **Region:** Elige la más cercana (p. ej. Frankfurt)
4. **Create PostgreSQL**
5. En la pantalla del servicio, copia la **Internal Database URL** (la usarás en el backend)

### Opción B: Neon (PostgreSQL gratuito persistente)

1. Crea cuenta en [Neon](https://neon.tech)
2. **New Project** → nombre `rentahogar`
3. Copia la **Connection string** (formato: `postgresql://user:pass@host/dbname?sslmode=require`)
4. Usa esa URL como `DATABASE_URL` en el backend (ver Paso 3)

### Opción C: Supabase (PostgreSQL gratuito persistente)

1. Crea cuenta en [Supabase](https://supabase.com)
2. **New Project** → nombre y contraseña
3. En **Settings** → **Database** → **Connection string** (modo URI)
4. Usa la URI como `DATABASE_URL` en el backend

---

## Paso 2: Preparar el repositorio

Asegúrate de que tu proyecto esté en GitHub/GitLab y que la estructura sea:

```
RentaHogar/          # Raíz del repositorio
├── backend/         # API Node.js
│   ├── src/
│   ├── package.json
│   └── ...
├── frontend/        # Angular
│   ├── src/
│   ├── package.json
│   └── angular.json
├── RentaHogar.md
├── DEPLOY_RENDER.md
└── ...
```

---

## Paso 3: Desplegar el Backend (Web Service)

1. **New +** → **Web Service**
2. Conecta tu repositorio y selecciona el proyecto
3. Configura:

   | Campo | Valor |
   |-------|-------|
   | **Name** | `rentahogar-api` |
   | **Region** | Misma que la base de datos |
   | **Root Directory** | `backend` |
   | **Runtime** | Node |
   | **Build Command** | `npm install && npm run build` |
   | **Start Command** | `npm start` |

4. **Instance Type:** Free

5. En **Environment Variables**, añade:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `3000` (Render usa 10000 internamente, no lo cambies) |
   | `DB_HOST` | Host de tu PostgreSQL (ej: `dpg-xxx.oregon-postgres.render.com`) |
   | `DB_PORT` | `5432` |
   | `DB_NAME` | `rental_management` |
   | `DB_USER` | Usuario de la BD |
   | `DB_PASS` | Contraseña de la BD |
   | `JWT_SECRET` | Cadena aleatoria larga y segura |
   | `JWT_EXPIRES_IN` | `7d` |
   | `FRONTEND_URL` | `https://rentahogar.onrender.com` (o la URL de tu Static Site, ver Paso 4) |
   | `SMTP_HOST` | `smtp.gmail.com` (o tu proveedor) |
   | `SMTP_PORT` | `587` |
   | `SMTP_USER` | Tu email |
   | `SMTP_PASS` | Contraseña de aplicación |

   **Si usas Neon o Supabase:** en lugar de DB_HOST/PORT/NAME/USER/PASS, puedes usar:
   - `DATABASE_URL` = `postgresql://user:pass@host:5432/dbname?sslmode=require`

6. **Create Web Service**

7. Espera al primer deploy. La URL será algo como: `https://rentahogar-api.onrender.com`

8. **Inicializar la base de datos (primera vez):**

   Desde tu máquina local, con las credenciales de la BD (copiadas desde Render/Neon/Supabase):

   ```bash
   cd backend
   # Configura temporalmente .env con DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS
   # (o DATABASE_URL si usas Neon/Supabase)
   npm run setup:schema
   npm run seed
   ```

   Alternativamente, en Render: **Web Service** → **Shell** → ejecuta los mismos comandos (el Shell tiene acceso a las env vars).

---

## Paso 4: Desplegar el Frontend (Static Site)

El frontend Angular debe compilarse con la URL del API de producción.

### 4.1 Crear `environment.production.ts`

Crea el archivo `frontend/src/environments/environment.production.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://rentahogar-api.onrender.com/api',  // Sustituye por tu URL real
};
```

**Nota:** Sustituye `rentahogar-api` por el nombre real de tu Web Service.

### 4.2 Configurar el build de producción

En `angular.json`, verifica que la configuración `production` exista (ya debería estar). El build usa por defecto `environment.production.ts` cuando ejecutas `ng build --configuration=production`.

### 4.3 Crear el Static Site en Render

1. **New +** → **Static Site**
2. Conecta el mismo repositorio
3. Configura:

   | Campo | Valor |
   |-------|-------|
   | **Name** | `rentahogar` |
   | **Root Directory** | `frontend` |
   | **Build Command** | `npm install && npm run build -- --configuration=production` |
   | **Publish Directory** | `dist/frontend/browser` (Angular 17+). Si usas versión anterior, puede ser `dist/browser` |

4. En **Environment Variables** (opcional): si quisieras parametrizar la API URL, podrías usar un script de build, pero con el archivo de environment es suficiente.

5. **Create Static Site**

6. La URL será algo como: `https://rentahogar.onrender.com`

### 4.4 Actualizar FRONTEND_URL en el backend

Vuelve al Web Service del backend y actualiza:
- `FRONTEND_URL` = `https://rentahogar.onrender.com` (la URL real de tu Static Site)

Redeploya el backend para aplicar el cambio.

---

## Paso 5: Verificación

1. **Health check del API:**
   ```
   https://rentahogar-api.onrender.com/api/health
   ```
   Debe devolver `{"success":true,...}`

2. **Frontend:** abre `https://rentahogar.onrender.com` y prueba login/registro.

3. **CORS:** si el frontend no puede llamar al API, revisa que `FRONTEND_URL` coincida exactamente con la URL del Static Site (incluyendo `https://` y sin barra final).

---

## Limitaciones del tier gratuito

| Aspecto | Límite |
|---------|--------|
| Web Service | Se apaga tras 15 min de inactividad. Primera petición puede tardar ~50 s (cold start) |
| PostgreSQL Render | Expira a los 30 días. Datos temporales |
| Static Site | Sin límite práctico para tráfico bajo |
| Disco | Efímero. Los archivos subidos (facturas) se pierden en cada redeploy |

### Archivos subidos (facturas)

En el tier gratuito, la carpeta `uploads/` es efímera. Cada vez que el Web Service se reinicia, se pierden los documentos subidos. Para producción real necesitarías:

- **Render Disk** (de pago), o
- **Almacenamiento externo** (AWS S3, Cloudinary, etc.)

---

## Resumen de URLs y variables clave

```
Backend API:     https://[tu-nombre]-api.onrender.com
Frontend:        https://[tu-nombre].onrender.com
FRONTEND_URL:    https://[tu-nombre].onrender.com
apiUrl (prod):   https://[tu-nombre]-api.onrender.com/api
```

---

## Troubleshooting

### "No se pudo conectar con el servidor"
- Espera 30–60 s (cold start del Web Service)
- Comprueba que la URL del API en `environment.production.ts` sea correcta

### Error CORS
- `FRONTEND_URL` debe coincidir exactamente con la URL del Static Site
- Sin `http://` vs `https://` incorrecto, sin barra final

### Error de base de datos
- Comprueba que `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS` sean correctos
- Si usas Neon/Supabase: asegúrate de usar `?sslmode=require` en la URL

### Build del frontend falla
- Revisa que `Publish Directory` sea correcto: `dist/frontend/browser` (Angular 21)
- Ejecuta `ng build --configuration=production` localmente y mira la carpeta que se genera

### Ruta de publicación Angular

Si tu `angular.json` tiene `outputPath` distinto, ajústalo. Para Angular 21 suele ser:
- `dist/frontend/browser` (si el proyecto se llama "frontend")
- `dist/[nombre-proyecto]/browser`

Revisa la carpeta generada tras `ng build`.
