const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Por favor introduce un nombre de usuario'],
    unique: true,
    trim: true,
    minlength: [3, 'El nombre de usuario debe tener al menos 3 caracteres'],
    maxlength: [30, 'El nombre de usuario no puede exceder 30 caracteres']
  },
  email: {
    type: String,
    required: [true, 'Por favor introduce un email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Por favor introduce un email válido'
    ]
  },
  password: {
    type: String,
    required: [true, 'Por favor introduce una contraseña'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select: false // No devolver la contraseña en las consultas por defecto
  },
  teamName: {
    type: String,
    required: [true, 'Por favor introduce un nombre para tu equipo'],
    trim: true,
    maxlength: [50, 'El nombre del equipo no puede exceder 50 caracteres']
  },
  budget: {
    type: Number,
    default: 100000000, // 100 millones
    min: 0
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  squad: [{
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    purchasePrice: {
      type: Number,
      required: true
    },
    purchaseDate: {
      type: Date,
      default: Date.now
    }
  }],
  lineup: [{
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    position: {
      type: String,
      enum: ['goalkeeper', 'defender', 'midfielder', 'forward']
    }
  }],
  transfers: [{
    playerIn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    playerOut: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    cost: Number,
    date: {
      type: Date,
      default: Date.now
    },
    gameweek: Number
  }],
  gameweekHistory: [{
    gameweek: Number,
    points: Number,
    rank: Number,
    value: Number,
    transfers: Number,
    date: Date
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Encriptar contraseña antes de guardar
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Método para verificar contraseña
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Método para calcular el valor total del equipo
UserSchema.methods.calculateSquadValue = async function() {
  await this.populate('squad.player');
  
  const squadValue = this.squad.reduce((total, item) => {
    return total + (item.player.currentPrice || 0);
  }, 0);
  
  return squadValue + this.budget;
};

// Método para validar formación
UserSchema.methods.validateLineup = function() {
  const positions = {
    goalkeeper: 0,
    defender: 0,
    midfielder: 0,
    forward: 0
  };
  
  this.lineup.forEach(item => {
    positions[item.position]++;
  });
  
  // Validar que hay exactamente 1 portero
  if (positions.goalkeeper !== 1) {
    return { valid: false, error: 'Debe haber exactamente 1 portero' };
  }
  
  // Validar que hay entre 3 y 5 defensas
  if (positions.defender < 3 || positions.defender > 5) {
    return { valid: false, error: 'Debe haber entre 3 y 5 defensas' };
  }
  
  // Validar que hay entre 3 y 5 centrocampistas
  if (positions.midfielder < 3 || positions.midfielder > 5) {
    return { valid: false, error: 'Debe haber entre 3 y 5 centrocampistas' };
  }
  
  // Validar que hay entre 1 y 3 delanteros
  if (positions.forward < 1 || positions.forward > 3) {
    return { valid: false, error: 'Debe haber entre 1 y 3 delanteros' };
  }
  
  // Validar que hay exactamente 11 jugadores
  const total = Object.values(positions).reduce((a, b) => a + b, 0);
  if (total !== 11) {
    return { valid: false, error: 'Debe haber exactamente 11 jugadores en el once titular' };
  }
  
  return { valid: true };
};

module.exports = mongoose.model('User', UserSchema);
