const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El jugador debe tener un nombre'],
    trim: true,
    index: true
  },
  team: {
    type: String,
    required: [true, 'El jugador debe pertenecer a un equipo'],
    trim: true,
    index: true
  },
  league: {
    id: String,
    name: String,
    division: {
      type: String,
      enum: ['elite', 'primera', 'segunda', 'tercera']
    }
  },
  position: {
    type: String,
    required: [true, 'El jugador debe tener una posición'],
    enum: ['goalkeeper', 'defender', 'midfielder', 'forward'],
    index: true
  },
  // Precio y valor de mercado
  currentPrice: {
    type: Number,
    required: true,
    min: 100000, // Mínimo 100k
    max: 50000000, // Máximo 50M
    default: 1000000 // 1M por defecto
  },
  initialPrice: {
    type: Number,
    required: true
  },
  priceHistory: [{
    price: Number,
    date: {
      type: Date,
      default: Date.now
    },
    gameweek: Number
  }],
  // Estadísticas generales
  totalPoints: {
    type: Number,
    default: 0,
    index: true
  },
  averagePoints: {
    type: Number,
    default: 0
  },
  form: {
    type: Number,
    default: 0 // Media de los últimos 5 partidos
  },
  // Estadísticas por jornada
  gameweekStats: [{
    gameweek: {
      type: Number,
      required: true
    },
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match'
    },
    minutes: {
      type: Number,
      default: 0,
      min: 0,
      max: 90
    },
    goals: {
      type: Number,
      default: 0,
      min: 0
    },
    assists: {
      type: Number,
      default: 0,
      min: 0
    },
    yellowCards: {
      type: Number,
      default: 0,
      min: 0
    },
    redCards: {
      type: Number,
      default: 0,
      min: 0
    },
    cleanSheet: {
      type: Boolean,
      default: false
    },
    points: {
      type: Number,
      default: 0
    },
    date: Date
  }],
  // Estadísticas totales de la temporada
  seasonStats: {
    matchesPlayed: {
      type: Number,
      default: 0
    },
    minutesPlayed: {
      type: Number,
      default: 0
    },
    goals: {
      type: Number,
      default: 0
    },
    assists: {
      type: Number,
      default: 0
    },
    yellowCards: {
      type: Number,
      default: 0
    },
    redCards: {
      type: Number,
      default: 0
    },
    cleanSheets: {
      type: Number,
      default: 0
    }
  },
  // Popularidad
  selectedBy: {
    type: Number,
    default: 0 // Porcentaje de usuarios que lo tienen
  },
  transfersIn: {
    type: Number,
    default: 0
  },
  transfersOut: {
    type: Number,
    default: 0
  },
  // Disponibilidad
  isAvailable: {
    type: Boolean,
    default: true
  },
  injuryStatus: {
    type: String,
    enum: ['available', 'doubtful', 'injured', 'suspended'],
    default: 'available'
  },
  // Metadata
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices compuestos para mejorar rendimiento
PlayerSchema.index({ team: 1, position: 1 });
PlayerSchema.index({ totalPoints: -1 });
PlayerSchema.index({ currentPrice: 1 });
PlayerSchema.index({ 'league.id': 1 });

// Método para calcular puntos de una jornada
PlayerSchema.methods.calculateGameweekPoints = function(stats) {
  const { pointsConfig } = require('../config/leagues');
  let points = 0;
  
  // Puntos por jugar (si jugó al menos 1 minuto)
  if (stats.minutes > 0) {
    points += pointsConfig.playing;
  }
  
  // Puntos por goles (con bonus según posición)
  if (stats.goals > 0) {
    const goalPoints = pointsConfig.goal + (pointsConfig.goalBonus[this.position] || 0);
    points += stats.goals * goalPoints;
  }
  
  // Puntos por asistencias
  if (stats.assists > 0) {
    points += stats.assists * pointsConfig.assist;
  }
  
  // Puntos por portería a cero (solo defensas y porteros)
  if (stats.cleanSheet && stats.minutes >= 60) {
    points += pointsConfig.cleanSheet[this.position] || 0;
  }
  
  // Penalizaciones por tarjetas
  if (stats.yellowCards > 0) {
    points += stats.yellowCards * pointsConfig.yellowCard;
  }
  
  if (stats.redCards > 0) {
    points += stats.redCards * pointsConfig.redCard;
  }
  
  return points;
};

// Método para actualizar estadísticas de la temporada
PlayerSchema.methods.updateSeasonStats = function() {
  this.seasonStats.matchesPlayed = this.gameweekStats.length;
  this.seasonStats.minutesPlayed = this.gameweekStats.reduce((sum, gw) => sum + gw.minutes, 0);
  this.seasonStats.goals = this.gameweekStats.reduce((sum, gw) => sum + gw.goals, 0);
  this.seasonStats.assists = this.gameweekStats.reduce((sum, gw) => sum + gw.assists, 0);
  this.seasonStats.yellowCards = this.gameweekStats.reduce((sum, gw) => sum + gw.yellowCards, 0);
  this.seasonStats.redCards = this.gameweekStats.reduce((sum, gw) => sum + gw.redCards, 0);
  this.seasonStats.cleanSheets = this.gameweekStats.filter(gw => gw.cleanSheet).length;
  
  // Calcular media de puntos
  if (this.gameweekStats.length > 0) {
    this.averagePoints = this.totalPoints / this.gameweekStats.length;
  }
  
  // Calcular forma (media de los últimos 5 partidos)
  const last5 = this.gameweekStats.slice(-5);
  if (last5.length > 0) {
    this.form = last5.reduce((sum, gw) => sum + gw.points, 0) / last5.length;
  }
};

// Método para actualizar precio basado en rendimiento y demanda
PlayerSchema.methods.updatePrice = function() {
  const { marketConfig } = require('../config/leagues');
  
  // Factor de rendimiento (basado en forma reciente)
  const performanceFactor = this.form / 5; // Normalizado
  
  // Factor de demanda (transferencias netas)
  const netTransfers = this.transfersIn - this.transfersOut;
  const demandFactor = netTransfers / 1000; // Ajustar según necesidad
  
  // Calcular nuevo precio
  const priceChange = this.currentPrice * marketConfig.priceChangeFactor * (performanceFactor + demandFactor);
  const newPrice = Math.round(this.currentPrice + priceChange);
  
  // Aplicar límites
  this.currentPrice = Math.max(
    marketConfig.minPlayerPrice,
    Math.min(marketConfig.maxPlayerPrice, newPrice)
  );
  
  // Guardar en historial
  this.priceHistory.push({
    price: this.currentPrice,
    date: new Date()
  });
};

module.exports = mongoose.model('Player', PlayerSchema);
