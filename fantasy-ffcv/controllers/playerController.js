const Player = require('../models/Player');

// @desc    Obtener todos los jugadores
// @route   GET /api/players
// @access  Public
exports.getPlayers = async (req, res, next) => {
  try {
    const {
      league,
      team,
      position,
      minPrice,
      maxPrice,
      search,
      sortBy = 'totalPoints',
      sortOrder = 'desc',
      page = 1,
      limit = 50
    } = req.query;

    // Construir query
    const query = { isAvailable: true };

    if (league) query['league.id'] = league;
    if (team) query.team = new RegExp(team, 'i');
    if (position) query.position = position;
    if (minPrice) query.currentPrice = { ...query.currentPrice, $gte: parseInt(minPrice) };
    if (maxPrice) query.currentPrice = { ...query.currentPrice, $lte: parseInt(maxPrice) };
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { team: new RegExp(search, 'i') }
      ];
    }

    // Construir sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Ejecutar query con paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const players = await Player.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Player.countDocuments(query);

    res.status(200).json({
      success: true,
      count: players.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: players
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener un jugador por ID
// @route   GET /api/players/:id
// @access  Public
exports.getPlayer = async (req, res, next) => {
  try {
    const player = await Player.findById(req.params.id);

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Jugador no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: player
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener estadísticas de un jugador
// @route   GET /api/players/:id/stats
// @access  Public
exports.getPlayerStats = async (req, res, next) => {
  try {
    const player = await Player.findById(req.params.id);

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Jugador no encontrado'
      });
    }

    // Ordenar estadísticas por jornada
    const stats = player.gameweekStats.sort((a, b) => a.gameweek - b.gameweek);

    res.status(200).json({
      success: true,
      data: {
        player: {
          id: player._id,
          name: player.name,
          team: player.team,
          position: player.position,
          currentPrice: player.currentPrice,
          totalPoints: player.totalPoints,
          averagePoints: player.averagePoints,
          form: player.form
        },
        seasonStats: player.seasonStats,
        gameweekStats: stats,
        priceHistory: player.priceHistory
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener jugadores destacados
// @route   GET /api/players/featured/top
// @access  Public
exports.getFeaturedPlayers = async (req, res, next) => {
  try {
    const { position, limit = 10 } = req.query;

    const query = { isAvailable: true };
    if (position) query.position = position;

    // Obtener los mejores por puntos totales
    const topByPoints = await Player.find(query)
      .sort({ totalPoints: -1 })
      .limit(parseInt(limit));

    // Obtener los mejores por forma
    const topByForm = await Player.find(query)
      .sort({ form: -1 })
      .limit(parseInt(limit));

    // Obtener los más transferidos
    const mostTransferred = await Player.find(query)
      .sort({ transfersIn: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        topByPoints,
        topByForm,
        mostTransferred
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener distribución de precios
// @route   GET /api/players/stats/price-distribution
// @access  Public
exports.getPriceDistribution = async (req, res, next) => {
  try {
    const distribution = await Player.aggregate([
      { $match: { isAvailable: true } },
      {
        $bucket: {
          groupBy: '$currentPrice',
          boundaries: [0, 1000000, 2000000, 5000000, 10000000, 20000000, 50000000],
          default: '50M+',
          output: {
            count: { $sum: 1 },
            players: { $push: { name: '$name', price: '$currentPrice' } }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: distribution
    });
  } catch (error) {
    next(error);
  }
};
