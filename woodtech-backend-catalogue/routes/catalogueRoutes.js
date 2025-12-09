const { Router } = require('express');
const {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  seedProducts,
  backfillImages,
} = require('../controllers/catalogueController');

// Routes REST pour exposer et administrer le catalogue produits.
const router = Router();

router.get('/products', listProducts);
router.get('/products/:id', getProduct);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.post('/seed', seedProducts);
router.post('/backfill-images', backfillImages);

module.exports = router;
