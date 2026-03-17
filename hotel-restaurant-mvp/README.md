# Estructura del Proyecto y Despliegue - RoomService MVP

## Estructura de Carpetas

```text
hotel-restaurant-mvp/
├── backend/
│   ├── package.json
│   ├── server.js               # Servidor Express, endpoints y webhooks de Stripe
│   ├── .env                    # Variables locales (STRIPE_SECRET_KEY, DATABASE_URL)
│   ├── controllers/            # Controladores de negocio (orders, etc)
│   ├── routes/                 # Rutas API segregadas
│   └── database/
│       └── schema.sql          # Tablas de Postgres
├── frontend/
│   ├── package.json
│   ├── vite.config.js          # Configuración Vite + VitePWA (para Progressive Web App)
│   ├── src/
│   │   ├── App.jsx             # React Router
│   │   ├── pages/
│   │   │   ├── GuestApp/       # Flujo para `app.com/?h=123&r=402`
│   │   │   │   ├── Menu.jsx    
│   │   │   │   └── Cart.jsx
│   │   │   ├── RestoApp/       # Panel para Restaurantes (Aceptar/Ver Pedidos)
│   │   │   ├── HotelApp/       # Dashboard para Hoteles (Historial de Comisiones)
│   │   │   └── Admin/          # Dashboard Super Admin
│   │   ├── components/
│   │   └── utils/
│   └── public/                 # Iconos QR y App
└── README.md                   
```

## Guía Rápida de Despliegue Producción (Vercel + Render + Neon)

Para lanzar el proyecto MVP rápidamente con alta escalabilidad, recomendamos la siguiente configuración ("El combo Serverless moderno"):

### 1. Base de Datos (PostgreSQL en Neon.tech o Supabase)
1. Crea un proyecto gratuito en [Neon](https://neon.tech/) o [Supabase](https://supabase.com/).
2. Ejecuta el archivo `backend/database/schema.sql` en su panel SQL.
3. Copia el Connection String (ej: `postgres://user:password@host/db`).

### 2. Backend (Render o Heroku)
Dado que usas Node.js, Render es el Heroku actual con el plan más fácil de gestionar.
1. Sube tu `backend` y `frontend` a un repositorio en GitHub.
2. Inicia sesión en [Render.com](https://render.com) y crea un "Web Service".
3. Conecta tu repositorio de GitHub y selecciona el directorio root como `backend`.
4. El Start Command debe ser `node server.js`.
5. Agrega las Variables de Entorno (Environment Variables):
   - `DATABASE_URL` = La de Neon/Supabase.
   - `STRIPE_SECRET_KEY` = Tu key de Stripe
   - `FRONTEND_URL` = La URL donde estará Vercel alojado.
   - `STRIPE_WEBHOOK_SECRET` = (Lo configuras en Stripe una vez este publicado este backend).

### 3. Frontend (Vercel)
Vercel es el líder para despliegues React.
1. Entra a [Vercel](https://vercel.com/) e "Import Project" usando el mismo repositorio de GitHub.
2. Configura el directorio Root a `frontend`.
3. Vercel autodetectará que es Vite/React.
4. En "Environment Variables", añade la URL de Render como:
   - `VITE_API_URL` = `https://<tu-app-en-render>.onrender.com`
5. Click **Deploy**.

### 4. Configurar Stripe Connect (El Toque Final)
1. Ve al Dashboard de Stripe.
2. Dirígete a **Connect** y activa las cuentas. Necesitas habilitar la creación de "Cuentas Express" (Express Accounts) para tus Restaurantes y Hoteles.
3. Ve a **Developers > Webhooks** y añade un webhook apuntando a tu backend de Render: `https://<tu-app-en-render>.onrender.com/api/webhooks/stripe`.
4. Selecciona el evento `payment_intent.succeeded` para ese Webhook.
5. Copia el **Signing Secret** del Webhook y guárdalo en las variables de entorno de Render como `STRIPE_WEBHOOK_SECRET`.
