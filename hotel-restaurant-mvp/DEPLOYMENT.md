# Guía de Despliegue a Producción (Rápido)

Para desplegar este MVP a un entorno productivo de forma rápida y efectiva, usaremos Vercel para el Frontend y Heroku o Render para el Backend (con PostgreSQL administrado de Supabase o Render).

## 1. Despliegue de la Base de Datos (PostgreSQL) - Usando Supabase
Es más rápido externalizar la base de datos a un servicio Serverless:
1. Crea una cuenta en [Supabase](https://supabase.com).
2. Crea un nuevo proyecto. Obtendrás un **URI de Conexión de PostgreSQL** en la configuración de la BD (ej. `postgresql://...`).
3. Conéctate a esa base de datos (con pgAdmin, DBeaver, o desde su propio editor SQL) y ejecuta el código que existe en `db/schema.sql`.

## 2. Despliegue del Backend (Node.js) - Usando Render o Heroku
Render es actualmente más sencillo y tiene un plan gratuito y barato inicial.
1. Sube tu código de Backend y Base de Datos a un repositorio en **GitHub**.
2. Ve a [Render.com](https://render.com) y crea un nuevo **"Web Service"**.
3. Conéctalo a tu repositorio de GitHub, eligiendo la carpeta `backend` como Root (si es un monorepo).
4. Configura los **Environment Variables** en Render:
   * `PGHOST`, `PGUSER`, `PGDATABASE`, `PGPASSWORD`, `PGPORT` obtenidos de Supabase.
   * `STRIPE_SECRET_KEY`: Tu clave secreta proveida por el Dashboard de Stripe (Modo Live o Test).
   * `STRIPE_WEBHOOK_SECRET`: El secreto del Endpoint (lo obtienes en Stripe -> Webhooks, creando un webhook apuntando a `https://[TU_URL_RENDER].render.com/api/webhooks/stripe`).
5. Render instalará los paquetes (via `package.json`) y usará `npm start` para levantar `server.js`.

## 3. Despliegue del Frontend (React PWA) - Usando Vercel
1. Ve a [Vercel](https://vercel.com) e inicia sesión con tu GitHub.
2. Haz click en "Add New Project" e importa tu repositorio.
3. Elige la carpeta `frontend/` (si existe la división de carpetas). Vercel detectará que es React/Vite/Next automatically.
4. Configura las variables de Entorno allí de ser necesario: `REACT_APP_API_URL` (Debe ser la URL generada por el paso 2 en Render).
5. Haz click en *Deploy*.

---
### Checklist Financiero Crítico (Stripe Connect)
Antes de salir en vivo:
1. Asegúrate de dar de alta a los hoteles y restaurantes creando **Connected Accounts** (tipo *Express* o *Custom* idealmente).
2. Obtén sus IDs (empiezan con `acct_...`) e insértalos en la tabla `hotels` y `restaurants` de tu BD. 
3. Verifica que la Plataforma absorbe los costos de procesamiento del pago (por default), o añade una sobretasa si se requiere que sea transferido al cliente.
