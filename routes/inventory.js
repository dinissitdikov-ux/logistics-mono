const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', inventoryController.getInventory);
router.get('/check', inventoryController.checkAvailability);
router.post('/', authorizeRoles('admin', 'warehouse_manager'), inventoryController.updateInventory);

module.exports = router;
