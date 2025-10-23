const express = require('express');
const router = express.Router();
const productsController = require('../controllers/productsController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', productsController.getAllProducts);
router.get('/:id', productsController.getProductById);
router.post('/', authorizeRoles('admin', 'warehouse_manager'), productsController.createProduct);
router.patch('/:id', authorizeRoles('admin', 'warehouse_manager'), productsController.updateProduct);

module.exports = router;
