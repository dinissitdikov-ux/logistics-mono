const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/ordersController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', ordersController.getAllOrders);
router.get('/:id', ordersController.getOrderById);
router.post('/', authorizeRoles('admin', 'dispatcher'), ordersController.createOrder);
router.patch('/:id/status', authorizeRoles('admin', 'dispatcher'), ordersController.updateOrderStatus);

module.exports = router;
