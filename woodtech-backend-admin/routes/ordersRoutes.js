const { Router } = require('express');
// Importation des fonctions du controller des commandes.
const {
  listOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
} = require('../controllers/ordersController');

// Routes REST dediees a la gestion des commandes.
const router = Router();
// Liste toutes les commandes
router.get('/', listOrders);
router.get('/:id', getOrder);
router.post('/', createOrder);
router.patch('/:id', updateOrderStatus);

module.exports = router;

