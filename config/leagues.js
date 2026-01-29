// Configuración de las ligas FFCV y sus URLs de scraping
const leagues = [
  {
    id: 'lliga-comunitat-norte',
    name: 'Lliga Comunitat G.Norte',
    url: 'https://resultadosffcv.isquad.es/total_partidos.php?id_temp=21&id_modalidad=33327&id_competicion=29509377',
    division: 'elite',
    active: true
  },
  {
    id: 'primera-ffcv-g2',
    name: '1ª FFCV G2',
    url: 'https://resultadosffcv.isquad.es/total_partidos.php?id_temp=21&id_modalidad=33327&id_competicion=29509166',
    division: 'primera',
    active: true
  },
  {
    id: 'segunda-ffcv-g4',
    name: '2ª FFCV G4',
    url: 'https://resultadosffcv.isquad.es/total_partidos.php?id_temp=21&id_modalidad=33327&id_competicion=29509171',
    division: 'segunda',
    active: true
  },
  {
    id: 'tercera-ffcv-g7',
    name: '3ª FFCV G7',
    url: 'https://resultadosffcv.isquad.es/total_partidos.php?id_temp=21&id_modalidad=33327&id_competicion=29509180',
    division: 'tercera',
    active: true
  }
];

// Sistema de puntos
const pointsConfig = {
  playing: parseInt(process.env.POINTS_FOR_PLAYING) || 2,
  goal: parseInt(process.env.POINTS_PER_GOAL) || 4,
  assist: parseInt(process.env.POINTS_PER_ASSIST) || 3,
  redCard: parseInt(process.env.POINTS_RED_CARD) || -3,
  yellowCard: parseInt(process.env.POINTS_YELLOW_CARD) || -1,
  // Puntos adicionales por posición
  cleanSheet: {
    goalkeeper: 5,
    defender: 4,
    midfielder: 1,
    forward: 0
  },
  // Bonificaciones por goles según posición
  goalBonus: {
    goalkeeper: 8,
    defender: 6,
    midfielder: 2,
    forward: 0
  }
};

// Configuración del mercado
const marketConfig = {
  initialBudget: parseInt(process.env.INITIAL_BUDGET) || 100000000, // 100M
  minPlayerPrice: parseInt(process.env.MIN_PLAYER_PRICE) || 100000, // 100k
  maxPlayerPrice: parseInt(process.env.MAX_PLAYER_PRICE) || 50000000, // 50M
  priceChangeFactor: parseFloat(process.env.PRICE_CHANGE_FACTOR) || 0.1,
  maxTransfersPerWeek: 3,
  // Límites de plantilla
  squadLimits: {
    total: 15,
    goalkeeper: { min: 1, max: 2 },
    defender: { min: 3, max: 6 },
    midfielder: { min: 3, max: 6 },
    forward: { min: 1, max: 4 }
  },
  lineupLimits: {
    total: 11,
    goalkeeper: 1,
    defender: { min: 3, max: 5 },
    midfielder: { min: 3, max: 5 },
    forward: { min: 1, max: 3 }
  }
};

module.exports = {
  leagues,
  pointsConfig,
  marketConfig
};
