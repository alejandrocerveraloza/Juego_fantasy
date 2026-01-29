# ⚽ Fantasy FFCV - Sistema Fantasy Football para Ligas FFCV

Sistema completo de Fantasy Football para las ligas regionales de la Federación de Fútbol de la Comunidad Valenciana (FFCV), con scraping automático de datos desde isquad.es, gestión de equipos, mercado dinámico y cálculo de puntos.

## 🎯 Características Principales

### 📊 Scraping Automático
- **Web Scraping con Puppeteer**: Extrae datos en tiempo real de 4 ligas FFCV desde resultadosffcv.isquad.es
- **Actualización Automática**: Sistema de cron jobs para actualizar puntos y precios
- **Procesamiento Inteligente**: Parsea actas de partidos para extraer estadísticas detalladas
- **Rate Limiting**: Control de peticiones para no sobrecargar los servidores

### 💰 Mercado Dinámico
- **Precios Variables**: Los precios cambian según rendimiento y demanda
- **Sistema de Oferta/Demanda**: Transferencias afectan los valores de mercado
- **Presupuesto Inicial**: 100M para construir tu equipo
- **Límites de Plantilla**: Restricciones realistas por posición

### 🏆 Sistema de Puntos
- **+2 puntos** por jugar
- **+4 puntos** por gol
- **+3 puntos** por asistencia
- **-3 puntos** por tarjeta roja
- **-1 punto** por tarjeta amarilla
- **Bonus** por portería a cero (porteros y defensas)
- **Bonus adicionales** por goles según posición

### 🔐 Sistema de Usuarios
- **Autenticación JWT**: Seguridad robusta con tokens
- **Gestión de Equipos**: Compra, venta y alineaciones
- **Historial de Transferencias**: Seguimiento completo
- **Estadísticas Personales**: Rankings y progreso

## 🛠️ Stack Tecnológico

### Backend
- **Node.js + Express**: Servidor API RESTful
- **MongoDB + Mongoose**: Base de datos NoSQL
- **JWT + bcryptjs**: Autenticación y seguridad
- **Puppeteer**: Web scraping headless browser
- **Cheerio**: Parsing HTML
- **node-cron**: Tareas programadas

### Frontend
- **HTML5 + CSS3**: Interfaz responsive
- **Vanilla JavaScript**: SPA sin frameworks
- **LocalStorage**: Persistencia de sesión

### Seguridad
- **Helmet**: Headers de seguridad HTTP
- **CORS**: Control de orígenes cruzados
- **Rate Limiting**: Prevención de abuso
- **Password Hashing**: bcrypt con salt

## 📁 Estructura del Proyecto

```
fantasy-ffcv/
├── config/
│   ├── database.js          # Configuración MongoDB
│   └── leagues.js            # Configuración de ligas FFCV
├── controllers/
│   ├── authController.js     # Lógica de autenticación
│   ├── playerController.js   # Lógica de jugadores
│   └── teamController.js     # Lógica de equipos
├── middleware/
│   ├── auth.js              # Middleware JWT
│   └── errorHandler.js      # Manejo de errores
├── models/
│   ├── User.js              # Schema de usuarios
│   ├── Player.js            # Schema de jugadores
│   └── Match.js             # Schema de partidos
├── routes/
│   ├── authRoutes.js        # Rutas de auth
│   ├── playerRoutes.js      # Rutas de jugadores
│   └── teamRoutes.js        # Rutas de equipos
├── services/
│   ├── scraperService.js    # Servicio de scraping
│   └── pointsUpdateService.js # Actualización de puntos
├── scripts/
│   ├── updatePoints.js      # Script manual de actualización
│   └── seedDatabase.js      # Poblar base de datos
├── public/
│   ├── css/
│   │   └── styles.css       # Estilos CSS
│   ├── js/
│   │   └── app.js           # JavaScript frontend
│   └── index.html           # Página principal
├── .env.example             # Variables de entorno (plantilla)
├── .gitignore              # Archivos ignorados por Git
├── package.json            # Dependencias y scripts
├── server.js               # Servidor principal
└── README.md              # Documentación
```

## 🚀 Instalación y Configuración

### Requisitos Previos
- Node.js >= 18.0.0
- MongoDB (local o MongoDB Atlas)
- npm o yarn

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/fantasy-ffcv.git
cd fantasy-ffcv
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno
```bash
cp .env.example .env
```

Edita el archivo `.env` con tus configuraciones:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/fantasy-ffcv
JWT_SECRET=tu_clave_secreta_cambiar
JWT_EXPIRE=7d
```

### 4. Iniciar MongoDB
```bash
# Si usas MongoDB local
mongod

# Si usas MongoDB Atlas, asegúrate de tener la URI correcta en .env
```

### 5. Poblar Base de Datos (Opcional)
```bash
npm run seed
```

### 6. Iniciar el Servidor
```bash
# Modo desarrollo (con nodemon)
npm run dev

# Modo producción
npm start
```

El servidor estará disponible en `http://localhost:5000`

## 📡 API Endpoints

### Autenticación
```
POST   /api/auth/register     # Registrar usuario
POST   /api/auth/login        # Iniciar sesión
GET    /api/auth/me          # Obtener usuario actual (requiere auth)
PUT    /api/auth/updatedetails # Actualizar perfil
PUT    /api/auth/updatepassword # Cambiar contraseña
```

### Jugadores
```
GET    /api/players           # Listar jugadores (con filtros)
GET    /api/players/:id       # Obtener jugador específico
GET    /api/players/:id/stats # Estadísticas del jugador
GET    /api/players/featured/top # Jugadores destacados
```

### Equipo (requieren autenticación)
```
GET    /api/team              # Obtener tu equipo
POST   /api/team/buy/:playerId # Comprar jugador
POST   /api/team/sell/:playerId # Vender jugador
PUT    /api/team/lineup       # Actualizar alineación
GET    /api/team/transfers    # Historial de transferencias
```

### Ejemplo de Petición
```javascript
// Registrar usuario
fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'miusuario',
    email: 'email@example.com',
    teamName: 'Mi Equipo',
    password: 'mipassword'
  })
})

// Obtener jugadores
fetch('http://localhost:5000/api/players?position=forward&limit=20')

// Comprar jugador (con autenticación)
fetch('http://localhost:5000/api/team/buy/PLAYER_ID', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
})
```

## 🔄 Scraping y Actualización de Datos

### Actualización Manual
```bash
# Ejecutar scraping y actualización de puntos
npm run update-points
```

### Actualización Automática
El sistema incluye un cron job que se ejecuta automáticamente según la configuración en `.env`:
```env
UPDATE_SCHEDULE=0 2 * * *  # Cada día a las 2:00 AM
```

### Ligas Configuradas
1. **Lliga Comunitat G.Norte** (Elite)
2. **1ª FFCV G2** (Primera División)
3. **2ª FFCV G4** (Segunda División)
4. **3ª FFCV G7** (Tercera División)

### Proceso de Scraping
1. **Scraping de Ligas**: Extrae partidos de cada liga
2. **Scraping de Actas**: Obtiene estadísticas de cada partido
3. **Procesamiento**: Calcula puntos basándose en el sistema configurado
4. **Actualización de DB**: Guarda jugadores, partidos y estadísticas
5. **Actualización de Precios**: Ajusta valores de mercado

## 🎮 Uso del Sistema

### Para Usuarios
1. **Registro**: Crea una cuenta con email y nombre de equipo
2. **Explorar Mercado**: Navega por los jugadores disponibles
3. **Comprar Jugadores**: Construye tu plantilla (máx. 15 jugadores)
4. **Configurar Alineación**: Selecciona tu once titular (11 jugadores)
5. **Seguir Puntos**: Los puntos se actualizan automáticamente después de cada jornada

### Límites de Plantilla
- **Total**: 15 jugadores
- **Porteros**: 1-2
- **Defensas**: 3-6
- **Centrocampistas**: 3-6
- **Delanteros**: 1-4

### Formación del Once (11 jugadores)
- **Porteros**: 1
- **Defensas**: 3-5
- **Centrocampistas**: 3-5
- **Delanteros**: 1-3

## 🔧 Desarrollo

### Scripts Disponibles
```bash
npm start              # Iniciar servidor producción
npm run dev            # Iniciar servidor desarrollo (nodemon)
npm run update-points  # Actualizar puntos manualmente
npm run seed           # Poblar base de datos con datos de ejemplo
```

### Testing Local
```bash
# Verificar API
curl http://localhost:5000/api/health

# Registrar usuario
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","teamName":"Test Team","password":"123456"}'
```

## 🌐 Despliegue en Producción

### Heroku
```bash
heroku create fantasy-ffcv
heroku addons:create mongolab
git push heroku main
```

### Railway
```bash
railway init
railway add mongodb
railway up
```

### Render
1. Conectar repositorio GitHub
2. Configurar variables de entorno
3. Deploy automático

### Variables de Entorno Críticas
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=clave_super_segura_generada
SCRAPING_HEADLESS=true
```

## 📝 Próximas Funcionalidades

- [ ] Sistema de ligas privadas entre amigos
- [ ] Chat en vivo durante partidos
- [ ] Notificaciones push
- [ ] App móvil (React Native)
- [ ] Modo draft (draft de jugadores)
- [ ] Mercado de traspasos entre usuarios
- [ ] Estadísticas avanzadas y gráficos
- [ ] Integración con redes sociales

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo LICENSE para más detalles.

## 👨‍💻 Autor

Desarrollado para la comunidad de fútbol sala valenciano.

## 🙏 Agradecimientos

- Datos proporcionados por [resultadosffcv.isquad.es](https://resultadosffcv.isquad.es/)
- Inspirado en plataformas como Biwenger y Fantasy Premier League
- Comunidad de la FFCV

## ⚠️ Disclaimer

Este proyecto es un sistema educativo y de entretenimiento. Los datos son scrapeados de fuentes públicas únicamente con fines informativos. No tiene afiliación oficial con la FFCV.

---

**¿Preguntas o problemas?** Abre un issue en GitHub.
