const User = require('../models/User');
const Player = require('../models/Player');
const { marketConfig } = require('../config/leagues');

// @desc    Obtener equipo del usuario
// @route   GET /api/team
// @access  Private
exports.getTeam = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('squad.player')
      .populate('lineup.player');

    const squadValue = await user.calculateSquadValue();

    res.status(200).json({
      success: true,
      data: {
        teamName: user.teamName,
        budget: user.budget,
        squadValue,
        totalValue: user.budget + squadValue,
        totalPoints: user.totalPoints,
        squad: user.squad,
        lineup: user.lineup,
        transfers: user.transfers.slice(-10) // Últimos 10 traspasos
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Comprar jugador
// @route   POST /api/team/buy/:playerId
// @access  Private
exports.buyPlayer = async (req, res, next) => {
  try {
    const player = await Player.findById(req.params.playerId);
    const user = await User.findById(req.user.id).populate('squad.player');

    // Validaciones
    if (!player || !player.isAvailable) {
      return res.status(404).json({
        success: false,
        message: 'Jugador no disponible'
      });
    }

    // Verificar que el usuario tenga presupuesto
    if (user.budget < player.currentPrice) {
      return res.status(400).json({
        success: false,
        message: 'Presupuesto insuficiente'
      });
    }

    // Verificar límites de plantilla
    if (user.squad.length >= marketConfig.squadLimits.total) {
      return res.status(400).json({
        success: false,
        message: 'Plantilla completa'
      });
    }

    // Verificar límites por posición
    const positionCount = user.squad.filter(
      s => s.player.position === player.position
    ).length;

    const positionLimit = marketConfig.squadLimits[player.position];
    if (positionCount >= positionLimit.max) {
      return res.status(400).json({
        success: false,
        message: `Límite de ${player.position}s alcanzado`
      });
    }

    // Verificar que no tenga ya al jugador
    const alreadyOwned = user.squad.some(
      s => s.player._id.toString() === player._id.toString()
    );

    if (alreadyOwned) {
      return res.status(400).json({
        success: false,
        message: 'Ya tienes este jugador'
      });
    }

    // Realizar compra
    user.squad.push({
      player: player._id,
      purchasePrice: player.currentPrice,
      purchaseDate: new Date()
    });

    user.budget -= player.currentPrice;

    // Actualizar estadísticas del jugador
    player.transfersIn += 1;
    player.selectedBy = await this.calculateSelectedBy(player._id);

    await user.save();
    await player.save();

    res.status(200).json({
      success: true,
      message: 'Jugador comprado exitosamente',
      data: {
        player,
        remainingBudget: user.budget
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Vender jugador
// @route   POST /api/team/sell/:playerId
// @access  Private
exports.sellPlayer = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('squad.player');
    const player = await Player.findById(req.params.playerId);

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Jugador no encontrado'
      });
    }

    // Verificar que el usuario tiene al jugador
    const squadIndex = user.squad.findIndex(
      s => s.player._id.toString() === player._id.toString()
    );

    if (squadIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'No tienes este jugador'
      });
    }

    // Verificar que no esté en el lineup
    const inLineup = user.lineup.some(
      l => l.player.toString() === player._id.toString()
    );

    if (inLineup) {
      return res.status(400).json({
        success: false,
        message: 'Debes sacar al jugador del lineup primero'
      });
    }

    // Realizar venta (al precio actual de mercado)
    const sellPrice = player.currentPrice;
    user.budget += sellPrice;
    user.squad.splice(squadIndex, 1);

    // Actualizar estadísticas del jugador
    player.transfersOut += 1;
    player.selectedBy = await this.calculateSelectedBy(player._id);

    await user.save();
    await player.save();

    res.status(200).json({
      success: true,
      message: 'Jugador vendido exitosamente',
      data: {
        sellPrice,
        newBudget: user.budget
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar lineup
// @route   PUT /api/team/lineup
// @access  Private
exports.updateLineup = async (req, res, next) => {
  try {
    const { lineup } = req.body; // Array de { playerId, position }
    const user = await User.findById(req.user.id).populate('squad.player');

    // Validar que todos los jugadores están en la plantilla
    for (const item of lineup) {
      const inSquad = user.squad.some(
        s => s.player._id.toString() === item.playerId
      );

      if (!inSquad) {
        return res.status(400).json({
          success: false,
          message: `El jugador ${item.playerId} no está en tu plantilla`
        });
      }
    }

    // Construir nuevo lineup
    user.lineup = lineup.map(item => ({
      player: item.playerId,
      position: item.position
    }));

    // Validar formación
    const validation = user.validateLineup();
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    await user.save();

    const updatedUser = await User.findById(req.user.id).populate('lineup.player');

    res.status(200).json({
      success: true,
      message: 'Lineup actualizado exitosamente',
      data: updatedUser.lineup
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener historial de traspasos
// @route   GET /api/team/transfers
// @access  Private
exports.getTransferHistory = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('transfers.playerIn')
      .populate('transfers.playerOut');

    res.status(200).json({
      success: true,
      data: user.transfers
    });
  } catch (error) {
    next(error);
  }
};

// Función auxiliar para calcular el porcentaje de selección
exports.calculateSelectedBy = async (playerId) => {
  const totalUsers = await User.countDocuments({ isActive: true });
  const usersWithPlayer = await User.countDocuments({
    'squad.player': playerId,
    isActive: true
  });

  return totalUsers > 0 ? (usersWithPlayer / totalUsers) * 100 : 0;
};
