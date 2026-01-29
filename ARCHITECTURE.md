# 🏗️ Arquitectura del Sistema Fantasy FFCV

## 📐 Vista General del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        FANTASY FFCV SYSTEM                      │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Frontend   │ ◄────► │   Backend    │ ◄────► │   MongoDB    │
│  (HTML/CSS)  │  HTTP  │  (Node.js)   │  Mongoose│   Database   │
│  JavaScript  │         │   Express    │         │              │
└──────────────┘         └──────────────┘         └──────────────┘
                                │
                                │
                                ▼
                        ┌──────────────┐
                        │   Scraper    │
                        │  (Puppeteer) │
                        └──────────────┘
                                │
                                ▼
                        ┌──────────────┐
                        │  isquad.es   │
                        │  (4 Ligas)   │
                        └──────────────┘
```

## 🔄 Flujo de Datos

### 1. Flujo de Scraping
```
┌─────────────┐
│ Cron Job    │ (Trigger automático cada día)
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│  ScraperService                                 │
│  1. Navega a URLs de ligas                     │
│  2. Extrae lista de partidos                   │
│  3. Por cada partido:                          │
│     - Accede al acta                           │
│     - Extrae estadísticas de jugadores         │
│     - Parsea datos (goles, asistencias, etc.)  │
└──────┬──────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│  PointsUpdateService                            │
│  1. Recibe estadísticas                        │
│  2. Busca/crea jugadores en DB                 │
│  3. Calcula puntos según sistema               │
│  4. Actualiza estadísticas de temporada        │
│  5. Actualiza precios de mercado               │
└──────┬──────────────────────────────────────────┘
       │
       ▼
┌─────────────────┐
│   MongoDB       │
│ - Players       │
│ - Matches       │
│ - Users         │
└─────────────────┘
```

### 2. Flujo de Usuario
```
┌──────────┐
│ Usuario  │
└────┬─────┘
     │
     ▼
┌──────────────────┐
│ Frontend (SPA)   │ GET /api/players
│ - index.html     │────────────┐
│ - app.js         │            │
└──────────────────┘            │
     │                          │
     │ POST /api/team/buy       │
     │                          │
     ▼                          ▼
┌──────────────────────────────────────┐
│         Express Routes               │
│  /api/auth     → authController      │
│  /api/players  → playerController    │
│  /api/team     → teamController      │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│       Middleware                     │
│  - JWT Authentication                │
│  - Error Handling                    │
│  - Rate Limiting                     │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│       Controllers                    │
│  - Validación de datos               │
│  - Lógica de negocio                 │
│  - Respuestas HTTP                   │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│       Models (Mongoose)              │
│  - User Schema                       │
│  - Player Schema                     │
│  - Match Schema                      │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────┐
│    MongoDB       │
│  Collections:    │
│  - users         │
│  - players       │
│  - matches       │
└──────────────────┘
```

## 🗂️ Modelo de Datos

### User Collection
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String (hashed),
  teamName: String,
  budget: Number,
  totalPoints: Number,
  squad: [{
    player: ObjectId (ref: Player),
    purchasePrice: Number,
    purchaseDate: Date
  }],
  lineup: [{
    player: ObjectId (ref: Player),
    position: String
  }],
  transfers: [{...}],
  gameweekHistory: [{...}]
}
```

### Player Collection
```javascript
{
  _id: ObjectId,
  name: String,
  team: String,
  league: {
    id: String,
    name: String,
    division: String
  },
  position: String,
  currentPrice: Number,
  initialPrice: Number,
  totalPoints: Number,
  averagePoints: Number,
  form: Number,
  gameweekStats: [{
    gameweek: Number,
    minutes: Number,
    goals: Number,
    assists: Number,
    yellowCards: Number,
    redCards: Number,
    points: Number
  }],
  seasonStats: {...},
  transfersIn: Number,
  transfersOut: Number
}
```

### Match Collection
```javascript
{
  _id: ObjectId,
  league: {...},
  gameweek: Number,
  homeTeam: String,
  awayTeam: String,
  homeScore: Number,
  awayScore: Number,
  date: Date,
  status: String,
  matchReportUrl: String,
  playerStats: [{
    playerName: String,
    team: String,
    minutes: Number,
    goals: Number,
    assists: Number,
    yellowCards: Number,
    redCards: Number
  }],
  scrapingStatus: {...}
}
```

## 🔐 Seguridad en Capas

```
┌────────────────────────────────────────┐
│ Capa 1: Network                       │
│ - HTTPS (en producción)                │
│ - CORS configurado                     │
│ - Rate Limiting (100 req/10min)       │
└────────────────────────────────────────┘
              ▼
┌────────────────────────────────────────┐
│ Capa 2: Application                   │
│ - Helmet (security headers)            │
│ - Input validation                     │
│ - XSS protection                       │
└────────────────────────────────────────┘
              ▼
┌────────────────────────────────────────┐
│ Capa 3: Authentication                │
│ - JWT tokens (7 días)                  │
│ - bcrypt password hashing (salt: 10)  │
│ - Protected routes                     │
└────────────────────────────────────────┘
              ▼
┌────────────────────────────────────────┐
│ Capa 4: Data                          │
│ - MongoDB authentication               │
│ - Schema validation                    │
│ - Sanitized queries                    │
└────────────────────────────────────────┘
```

## 🎯 Sistema de Puntos

```
┌──────────────────────────────────────────────────┐
│          Cálculo de Puntos por Jugador          │
└──────────────────────────────────────────────────┘

Input: Estadísticas del partido
├─ Minutos jugados > 0  → +2 puntos
├─ Goles
│  ├─ Portero    → +4 puntos base + 8 bonus = 12
│  ├─ Defensa    → +4 puntos base + 6 bonus = 10
│  ├─ Medio      → +4 puntos base + 2 bonus = 6
│  └─ Delantero  → +4 puntos base + 0 bonus = 4
├─ Asistencias  → +3 puntos c/u
├─ Portería a cero (>60 min)
│  ├─ Portero    → +5 puntos
│  ├─ Defensa    → +4 puntos
│  └─ Medio      → +1 punto
├─ Tarjeta amarilla → -1 punto
└─ Tarjeta roja     → -3 puntos

Output: Total de puntos de la jornada
```

## 💰 Sistema de Mercado

```
┌──────────────────────────────────────────────────┐
│       Actualización de Precios Dinámicos        │
└──────────────────────────────────────────────────┘

Factores:
├─ Rendimiento (Forma últimos 5 partidos)
│  └─ Factor = forma / 5
├─ Demanda (Transferencias netas)
│  └─ Factor = (transfersIn - transfersOut) / 1000
└─ Cálculo final:
   precioNuevo = precioActual + 
                (precioActual × 0.1 × (factorRendimiento + factorDemanda))

Límites:
├─ Mínimo: 100,000 €
└─ Máximo: 50,000,000 €
```

## 📡 API Endpoints

```
┌─────────────────────────────────────────────────┐
│                 API Routes                      │
└─────────────────────────────────────────────────┘

/api/auth
├─ POST   /register      # Crear cuenta
├─ POST   /login         # Login
├─ GET    /me            # Usuario actual [Auth]
├─ PUT    /updatedetails # Actualizar perfil [Auth]
└─ PUT    /updatepassword # Cambiar password [Auth]

/api/players
├─ GET    /              # Listar (con filtros)
├─ GET    /:id           # Detalle jugador
├─ GET    /:id/stats     # Estadísticas detalladas
├─ GET    /featured/top  # Destacados
└─ GET    /stats/price-distribution # Distribución

/api/team [Auth Required]
├─ GET    /              # Mi equipo
├─ POST   /buy/:id       # Fichar
├─ POST   /sell/:id      # Vender
├─ PUT    /lineup        # Actualizar once
└─ GET    /transfers     # Historial
```

## 🔄 Proceso de Scraping Detallado

```
1. ScraperService.scrapeLeagueMatches(url)
   ├─ Puppeteer abre navegador headless
   ├─ Navega a la página de la liga
   ├─ Espera a que cargue la tabla
   ├─ Cheerio parsea HTML
   ├─ Extrae:
   │  ├─ Fecha del partido
   │  ├─ Equipos (local y visitante)
   │  ├─ Resultado
   │  └─ URL del acta
   └─ Devuelve array de partidos

2. ScraperService.scrapeMatchReport(url)
   ├─ Navega al acta del partido
   ├─ Parsea tablas de jugadores
   ├─ Por cada jugador extrae:
   │  ├─ Nombre
   │  ├─ Equipo
   │  ├─ Minutos jugados
   │  ├─ Goles
   │  ├─ Asistencias
   │  ├─ Tarjetas amarillas
   │  └─ Tarjetas rojas
   └─ Devuelve estadísticas

3. PointsUpdateService.processMatchStats()
   ├─ Busca/crea jugador en DB
   ├─ Verifica jornada no duplicada
   ├─ Calcula puntos con player.calculateGameweekPoints()
   ├─ Guarda estadísticas de jornada
   ├─ Actualiza totales con player.updateSeasonStats()
   └─ Guarda jugador

4. Player.updatePrice()
   ├─ Calcula factor rendimiento
   ├─ Calcula factor demanda
   ├─ Aplica fórmula de precio
   ├─ Aplica límites min/max
   └─ Guarda en historial
```

## 🚀 Deployment Architecture

```
┌──────────────────────────────────────────────────┐
│              Production Setup                    │
└──────────────────────────────────────────────────┘

GitHub Repository
       │
       ▼
┌──────────────┐
│ Render/      │
│ Railway      │ (Automatic deployment on push)
└──────┬───────┘
       │
       ├─► Web Service (Node.js)
       │   ├─ Express server
       │   ├─ Puppeteer (headless)
       │   └─ Cron jobs
       │
       └─► MongoDB Database
           ├─ Managed MongoDB
           └─ Automatic backups

Features:
├─ Auto HTTPS
├─ Environment variables
├─ Logs & monitoring
├─ Auto-scaling
└─ Zero downtime deploys
```

## 📊 Performance Optimizations

```
Database Indexes:
├─ Players: { totalPoints: -1, currentPrice: 1 }
├─ Players: { team: 1, position: 1 }
├─ Matches: { league.id: 1, gameweek: 1 }
└─ Users: { email: 1 }

Caching Strategy:
├─ Player list: Cache 5 min
├─ Featured players: Cache 15 min
└─ User team: No cache (real-time)

Scraping:
├─ Max concurrent: 3 requests
├─ Rate limiting: 2s between requests
└─ Retry failed: Max 5 attempts
```

---

Este sistema está diseñado para **escalar** y **mantener** fácilmente. La arquitectura modular permite añadir nuevas funcionalidades sin romper el código existente.
