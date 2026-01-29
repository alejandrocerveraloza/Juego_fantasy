# 🚀 Guía de Despliegue en GitHub y Producción

## 📋 Pasos para Subir el Proyecto a GitHub

### 1. Inicializar Repositorio Git Local
```bash
# Navega al directorio del proyecto
cd fantasy-ffcv

# Inicializa git (si no está inicializado)
git init

# Verifica que .gitignore esté presente
cat .gitignore

# Añade todos los archivos
git add .

# Primer commit
git commit -m "Initial commit: Fantasy FFCV system with scraping and market"
```

### 2. Crear Repositorio en GitHub
1. Ve a [GitHub](https://github.com) e inicia sesión
2. Click en el botón **"New"** o **"+"** → **"New repository"**
3. Nombre del repositorio: `fantasy-ffcv`
4. Descripción: "Sistema Fantasy Football para ligas FFCV con scraping automático"
5. Selecciona **Public** o **Private**
6. **NO** marques "Initialize with README" (ya tienes uno)
7. Click **"Create repository"**

### 3. Conectar Repositorio Local con GitHub
```bash
# Añade el remote (sustituye TU-USUARIO con tu username)
git remote add origin https://github.com/TU-USUARIO/fantasy-ffcv.git

# Verifica el remote
git remote -v

# Push inicial
git push -u origin main

# Si tu rama se llama 'master' en vez de 'main':
# git branch -M main
# git push -u origin main
```

### 4. Verificar la Subida
1. Ve a tu repositorio en GitHub
2. Deberías ver todos los archivos excepto los del `.gitignore`
3. Verifica que el `README.md` se muestre correctamente

## 🌐 Despliegue en Render (Gratis)

### Ventajas de Render
- ✅ Gratis para proyectos pequeños
- ✅ Deploy automático desde GitHub
- ✅ MongoDB gratuito incluido
- ✅ HTTPS automático
- ✅ Fácil configuración

### Pasos para Desplegar

#### 1. Crear Cuenta en Render
1. Ve a [render.com](https://render.com)
2. Regístrate con GitHub

#### 2. Crear Base de Datos MongoDB
1. En el dashboard, click **"New +"** → **"MongoDB"**
2. Nombre: `fantasy-ffcv-db`
3. Plan: **Free**
4. Click **"Create Database"**
5. **Guarda la Connection String** (la necesitarás después)

#### 3. Crear Web Service
1. Click **"New +"** → **"Web Service"**
2. Conecta tu repositorio GitHub `fantasy-ffcv`
3. Configura:
   - **Name**: `fantasy-ffcv`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

#### 4. Configurar Variables de Entorno
En la sección "Environment", añade:

```
NODE_ENV=production
PORT=5000
MONGODB_URI=<TU_CONNECTION_STRING_DE_RENDER>
JWT_SECRET=<GENERA_UNA_CLAVE_SEGURA>
JWT_EXPIRE=7d
SCRAPING_HEADLESS=true
SCRAPING_TIMEOUT=30000
UPDATE_SCHEDULE=0 2 * * *
INITIAL_BUDGET=100000000
POINTS_FOR_PLAYING=2
POINTS_PER_GOAL=4
POINTS_PER_ASSIST=3
POINTS_RED_CARD=-3
POINTS_YELLOW_CARD=-1
```

**Para generar JWT_SECRET seguro:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### 5. Deploy
1. Click **"Create Web Service"**
2. Render automáticamente:
   - Clonará tu repo
   - Instalará dependencias
   - Iniciará el servidor
3. Tu app estará disponible en: `https://fantasy-ffcv.onrender.com`

## 🚢 Despliegue en Railway (Alternativa)

### 1. Crear Cuenta
1. Ve a [railway.app](https://railway.app)
2. Regístrate con GitHub

### 2. Deploy Directo
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Iniciar proyecto
railway init

# Añadir MongoDB
railway add -d mongodb

# Deploy
railway up
```

### 3. Configurar Variables de Entorno
```bash
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=tu_clave_secreta
# ... resto de variables
```

## 🔧 Configuración Post-Deploy

### 1. Poblar Base de Datos
```bash
# Opción A: Desde local (usando la URI de producción)
MONGODB_URI=<URI_PRODUCCION> npm run seed

# Opción B: SSH al servidor y ejecutar
railway run npm run seed  # Si usas Railway
```

### 2. Ejecutar Primera Actualización
```bash
railway run npm run update-points
```

### 3. Verificar Funcionamiento
```bash
# Health check
curl https://tu-app.onrender.com/api/health

# Listar jugadores
curl https://tu-app.onrender.com/api/players
```

## 📊 Monitoreo y Mantenimiento

### Logs en Render
```
Dashboard → Tu servicio → Logs (pestaña)
```

### Logs en Railway
```bash
railway logs
```

### Actualización Automática desde GitHub
Ambas plataformas hacen **deploy automático** cuando haces push a main:
```bash
git add .
git commit -m "Update: añadida nueva funcionalidad"
git push origin main
```

## 🔐 Seguridad en Producción

### Checklist de Seguridad
- [ ] `.env` está en `.gitignore`
- [ ] `JWT_SECRET` es una clave fuerte única
- [ ] MongoDB tiene autenticación habilitada
- [ ] CORS configurado correctamente
- [ ] Rate limiting activo
- [ ] Helmet configurado
- [ ] Passwords hasheadas con bcrypt

### Actualizar Secretos
```bash
# NUNCA subas secretos a GitHub
# Usa siempre variables de entorno en la plataforma
```

## 🐛 Troubleshooting

### Error: "Cannot connect to MongoDB"
```bash
# Verifica que la URI esté correcta
echo $MONGODB_URI

# Verifica que MongoDB esté corriendo
railway logs | grep mongo
```

### Error: "Module not found"
```bash
# Verifica que las dependencias estén en package.json
# Haz un fresh install
rm -rf node_modules package-lock.json
npm install
```

### Scraping no funciona
```bash
# En producción, asegúrate de que Puppeteer tenga las dependencias
# Render/Railway incluyen las necesarias, pero verifica:
railway run npm run update-points
```

## 📈 Escalado

### Cuando tu app crezca:
1. **Upgrade Plan**: Pasa de Free a Paid en Render/Railway
2. **MongoDB Atlas**: Migra a un cluster dedicado
3. **CDN**: Usa Cloudflare para assets estáticos
4. **Caché**: Implementa Redis para queries frecuentes
5. **Load Balancer**: Distribuye tráfico entre múltiples instancias

## ✅ Checklist Final

- [ ] Código subido a GitHub
- [ ] `.env` no está en el repositorio
- [ ] MongoDB creada y conectada
- [ ] Variables de entorno configuradas
- [ ] Deploy exitoso
- [ ] Base de datos poblada
- [ ] Primera actualización ejecutada
- [ ] Health check devuelve 200 OK
- [ ] API endpoints funcionando
- [ ] Frontend accesible
- [ ] Registro de usuario funciona
- [ ] Scraping funciona (al menos una vez)

## 🎉 ¡Listo!

Tu sistema Fantasy FFCV está desplegado y funcionando en producción. Ahora puedes:
- Compartir la URL con usuarios
- Monitorear logs
- Actualizar código con git push
- Escalar según necesidades

---

**¿Problemas?** Abre un issue en GitHub o consulta la documentación de:
- [Render Docs](https://render.com/docs)
- [Railway Docs](https://docs.railway.app)
- [MongoDB Atlas](https://docs.atlas.mongodb.com)
