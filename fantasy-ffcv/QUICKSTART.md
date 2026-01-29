# ⚡ Inicio Rápido - Fantasy FFCV

## 🎯 ¿Qué es esto?

Un **sistema completo de Fantasy Football** para las ligas FFCV que incluye:
- ✅ Backend profesional (Node.js + Express + MongoDB)
- ✅ Scraping automático de datos desde isquad.es (Puppeteer)
- ✅ Sistema de puntos y mercado dinámico
- ✅ Frontend funcional con gestión de equipos
- ✅ Autenticación JWT segura
- ✅ Listo para GitHub y producción

## 🚀 Instalación en 5 Pasos

### 1️⃣ Requisitos
```bash
# Verifica que tengas Node.js >= 18
node --version

# Verifica MongoDB (o usa MongoDB Atlas)
mongod --version
```

### 2️⃣ Instalar
```bash
cd fantasy-ffcv
npm install
```

### 3️⃣ Configurar
```bash
# Copia el archivo de ejemplo
cp .env.example .env

# Edita .env con tus datos:
# - MONGODB_URI (local o Atlas)
# - JWT_SECRET (genera uno seguro)
```

### 4️⃣ Poblar Base de Datos
```bash
npm run seed
```

### 5️⃣ Iniciar
```bash
npm start
# O para desarrollo:
npm run dev
```

**¡Listo!** Abre http://localhost:5000

## 📡 Actualizar Datos (Scraping)

```bash
# Ejecutar scraping manualmente
npm run update-points
```

El scraping automático se ejecutará según el cron configurado en `.env`:
```
UPDATE_SCHEDULE=0 2 * * *  # Cada día a 2:00 AM
```

## 🌐 Subir a GitHub

```bash
# Inicializar git
git init
git add .
git commit -m "Initial commit"

# Conectar con GitHub (crea el repo primero en github.com)
git remote add origin https://github.com/TU-USUARIO/fantasy-ffcv.git
git push -u origin main
```

## ☁️ Deploy Gratis en Render

1. Ve a [render.com](https://render.com)
2. Conecta tu repo de GitHub
3. Crea MongoDB (Free tier)
4. Crea Web Service (Free tier)
5. Añade las variables de entorno (ver DEPLOY.md)
6. ¡Deploy automático!

**Documentación completa:** Ver `DEPLOY.md`

## 📁 Estructura del Proyecto

```
fantasy-ffcv/
├── config/           # Configuraciones (DB, ligas)
├── controllers/      # Lógica de negocio
├── middleware/       # Auth, errors
├── models/           # Schemas MongoDB
├── routes/           # Endpoints API
├── services/         # Scraping, actualización
├── scripts/          # Utilidades
├── public/           # Frontend (HTML/CSS/JS)
└── server.js         # Servidor principal
```

## 🔑 Endpoints Principales

```
POST /api/auth/register      # Crear cuenta
POST /api/auth/login         # Login
GET  /api/players            # Ver jugadores
POST /api/team/buy/:id       # Fichar jugador
GET  /api/team               # Ver mi equipo
```

## 🛠️ Scripts Útiles

```bash
npm start              # Iniciar servidor
npm run dev            # Modo desarrollo
npm run seed           # Poblar DB
npm run update-points  # Scrapear y actualizar
```

## 🎮 Uso del Sistema

### Como Usuario:
1. Registrarse en la web
2. Explorar jugadores disponibles
3. Comprar jugadores (presupuesto: 100M)
4. Configurar tu once titular
5. Ver puntos actualizados cada jornada

### Como Admin:
1. Ejecutar `npm run update-points` después de cada jornada
2. O configurar cron automático
3. Los puntos y precios se actualizan solos

## 🔐 Seguridad

- ✅ Passwords hasheados con bcrypt
- ✅ JWT para autenticación
- ✅ Rate limiting
- ✅ Helmet para headers
- ✅ CORS configurado
- ✅ Variables sensibles en .env (nunca en Git)

## 📊 Sistema de Puntos

- **+2** por jugar
- **+4** por gol
- **+3** por asistencia  
- **-3** por roja
- **-1** por amarilla
- **Bonus** por portería a cero

## 💰 Mercado

- Presupuesto inicial: **100M**
- Precios dinámicos (rendimiento + demanda)
- Límite plantilla: **15 jugadores**
- Once titular: **11 jugadores**

## 🏆 Ligas Incluidas

1. Lliga Comunitat G.Norte
2. 1ª FFCV G2
3. 2ª FFCV G4
4. 3ª FFCV G7

## ⚠️ Importante

- El `.env` **NUNCA** se sube a GitHub (está en .gitignore)
- Genera un `JWT_SECRET` seguro para producción
- MongoDB debe estar corriendo antes de iniciar
- Puppeteer necesita dependencias (incluidas en package.json)

## 🐛 Problemas Comunes

**Error: Cannot connect to MongoDB**
```bash
# Inicia MongoDB local
mongod

# O usa MongoDB Atlas y cambia la URI en .env
```

**Error: Module not found**
```bash
npm install
```

**Scraping falla**
```bash
# Verifica las URLs en config/leagues.js
# Pueden cambiar en isquad.es
```

## 📚 Documentación Completa

- **README.md** - Documentación técnica completa
- **DEPLOY.md** - Guía de despliegue paso a paso
- **package.json** - Dependencias y scripts

## 🆘 Ayuda

¿Problemas? Abre un issue en GitHub o revisa:
- Logs del servidor
- Console del navegador
- Variables de entorno

## 🎉 ¡Listo para Producción!

Este proyecto está **listo para desplegar** en:
- ✅ Render (gratis)
- ✅ Railway (gratis)
- ✅ Heroku
- ✅ Vercel/Netlify (frontend)
- ✅ VPS propio

**¡Mucha suerte con tu Fantasy FFCV!** ⚽🏆
