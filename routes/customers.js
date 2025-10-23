const express = require('express');
const router = express.Router();
const customersController = require('../controllers/customersController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', customersController.getAllCustomers);
router.get('/:id', customersController.getCustomerById);
router.post('/', authorizeRoles('admin', 'dispatcher'), customersController.createCustomer);
router.patch('/:id', authorizeRoles('admin', 'dispatcher'), customersController.updateCustomer);

module.exports = router;
