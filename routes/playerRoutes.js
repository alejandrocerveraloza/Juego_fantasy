const express = require('express');
const {
  getPlayers,
  getPlayer,
  getPlayerStats,
  getFeaturedPlayers,
  getPriceDistribution
} = require('../controllers/playerController');

const router = express.Router();

router.get('/', getPlayers);
router.get('/featured/top', getFeaturedPlayers);
router.get('/stats/price-distribution', getPriceDistribution);
router.get('/:id', getPlayer);
router.get('/:id/stats', getPlayerStats);

module.exports = router;
