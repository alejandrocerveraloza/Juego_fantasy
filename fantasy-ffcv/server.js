require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const pointsUpdateService = require('./services/pointsUpdateService');

// Conectar a base de datos
connectDB();

const app = express();

// Middlewares de seguridad
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 100, // 100 peticiones por IP
  message: 'Demasiadas peticiones desde esta IP, por favor intenta más tarde'
});
app.use('/api/', limiter);

// Servir archivos estáticos
app.use(express.static('public'));

// Rutas
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/players', require('./routes/playerRoutes'));
app.use('/api/team', require('./routes/teamRoutes'));

// Ruta de health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Fantasy FFCV API is running',
    timestamp: new Date().toISOString()
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

// Configurar cron job para actualización automática
if (process.env.UPDATE_SCHEDULE) {
  cron.schedule(process.env.UPDATE_SCHEDULE, async () => {
    console.log('🕐 Running scheduled points update...');
    try {
      await pointsUpdateService.updateAllPoints();
      console.log('✅ Scheduled update completed');
    } catch (error) {
      console.error('❌ Scheduled update failed:', error);
    }
  });
  console.log(`⏰ Cron job scheduled: ${process.env.UPDATE_SCHEDULE}`);
}

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║         🏆 FANTASY FFCV API Server Running 🏆         ║
║                                                       ║
║  Environment: ${process.env.NODE_ENV || 'development'}                             ║
║  Port: ${PORT}                                         ║
║  Database: Connected                                  ║
║                                                       ║
║  API Endpoints:                                       ║
║  • http://localhost:${PORT}/api/health                  ║
║  • http://localhost:${PORT}/api/auth/register           ║
║  • http://localhost:${PORT}/api/auth/login              ║
║  • http://localhost:${PORT}/api/players                 ║
║  • http://localhost:${PORT}/api/team                    ║
║                                                       ║
║  Scraping Service: Ready                              ║
║  Auto-update: ${process.env.UPDATE_SCHEDULE ? 'Enabled' : 'Disabled'}                             ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err, promise) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('💤 Process terminated');
  });
});

module.exports = app;
