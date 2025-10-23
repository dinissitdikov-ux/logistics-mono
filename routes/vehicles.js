const express = require('express');
const router = express.Router();
const vehiclesController = require('../controllers/vehiclesController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', vehiclesController.getAllVehicles);
router.get('/:id', vehiclesController.getVehicleById);
router.post('/', authorizeRoles('admin'), vehiclesController.createVehicle);
router.patch('/:id', authorizeRoles('admin', 'dispatcher'), vehiclesController.updateVehicle);

module.exports = router;
