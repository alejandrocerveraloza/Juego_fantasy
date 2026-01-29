const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
  league: {
    id: {
      type: String,
      required: true,
      index: true
    },
    name: String,
    division: String
  },
  gameweek: {
    type: Number,
    required: true,
    index: true
  },
  homeTeam: {
    type: String,
    required: true,
    trim: true
  },
  awayTeam: {
    type: String,
    required: true,
    trim: true
  },
  homeScore: {
    type: Number,
    min: 0
  },
  awayScore: {
    type: Number,
    min: 0
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'finished', 'postponed', 'cancelled'],
    default: 'scheduled',
    index: true
  },
  // URL del acta del partido en isquad.es
  matchReportUrl: {
    type: String,
    trim: true
  },
  // Estadísticas del partido scrapeadas
  playerStats: [{
    playerName: {
      type: String,
      required: true
    },
    team: {
      type: String,
      required: true
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
    }
  }],
  // Datos de scraping
  scrapingStatus: {
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'failed'],
      default: 'pending'
    },
    lastAttempt: Date,
    attempts: {
      type: Number,
      default: 0
    },
    error: String
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

// Índices compuestos
MatchSchema.index({ 'league.id': 1, gameweek: 1 });
MatchSchema.index({ date: 1, status: 1 });
MatchSchema.index({ 'scrapingStatus.status': 1 });

// Método para determinar si hay portería a cero
MatchSchema.methods.getCleanSheetTeams = function() {
  const cleanSheets = [];
  
  if (this.status === 'finished') {
    if (this.awayScore === 0) {
      cleanSheets.push(this.homeTeam);
    }
    if (this.homeScore === 0) {
      cleanSheets.push(this.awayTeam);
    }
  }
  
  return cleanSheets;
};

// Método para obtener estadísticas de un jugador en este partido
MatchSchema.methods.getPlayerStats = function(playerName) {
  return this.playerStats.find(
    stat => stat.playerName.toLowerCase() === playerName.toLowerCase()
  );
};

// Método estático para obtener partidos pendientes de scrapear
MatchSchema.statics.getPendingScraping = function() {
  return this.find({
    status: { $in: ['finished', 'live'] },
    'scrapingStatus.status': { $in: ['pending', 'failed'] },
    'scrapingStatus.attempts': { $lt: 5 } // Máximo 5 intentos
  }).sort({ date: -1 });
};

module.exports = mongoose.model('Match', MatchSchema);
