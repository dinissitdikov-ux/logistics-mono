const express = require('express');
const router = express.Router();
const deliveriesController = require('../controllers/deliveriesController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', deliveriesController.getAllDeliveries);
router.get('/:id', deliveriesController.getDeliveryById);
router.post('/', authorizeRoles('admin', 'dispatcher'), deliveriesController.createDelivery);
router.patch('/:id/status', authorizeRoles('admin', 'dispatcher', 'driver'), deliveriesController.updateDeliveryStatus);
router.post('/:id/tracking', authorizeRoles('admin', 'dispatcher', 'driver'), deliveriesController.addTrackingEvent);

module.exports = router;
