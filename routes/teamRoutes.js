const express = require('express');
const {
  getTeam,
  buyPlayer,
  sellPlayer,
  updateLineup,
  getTransferHistory
} = require('../controllers/teamController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

router.get('/', getTeam);
router.post('/buy/:playerId', buyPlayer);
router.post('/sell/:playerId', sellPlayer);
router.put('/lineup', updateLineup);
router.get('/transfers', getTransferHistory);

module.exports = router;
