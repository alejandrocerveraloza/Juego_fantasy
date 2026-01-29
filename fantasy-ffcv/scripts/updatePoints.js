require('dotenv').config();
const connectDB = require('../config/database');
const pointsUpdateService = require('../services/pointsUpdateService');
const scraperService = require('../services/scraperService');

async function updatePoints() {
  try {
    console.log('🚀 Starting manual points update...\n');
    
    // Conectar a base de datos
    await connectDB();
    
    // Ejecutar actualización
    await pointsUpdateService.updateAllPoints();
    
    console.log('\n✅ Points update completed successfully!');
    
    // Cerrar navegador de Puppeteer
    await scraperService.close();
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error updating points:', error);
    await scraperService.close();
    process.exit(1);
  }
}

// Ejecutar
updatePoints();
