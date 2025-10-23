const express = require('express');
const router = express.Router();
const warehousesController = require('../controllers/warehousesController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', warehousesController.getAllWarehouses);
router.get('/:id', warehousesController.getWarehouseById);
router.post('/', authorizeRoles('admin'), warehousesController.createWarehouse);
router.patch('/:id', authorizeRoles('admin', 'warehouse_manager'), warehousesController.updateWarehouse);

module.exports = router;
