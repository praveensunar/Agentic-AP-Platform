const express = require('express');
const router = express.Router();
const { createVendor, getVendors, updateVendor, deleteVendor } = require('../controllers/vendorController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Require authentication for all vendor routes
router.use(requireAuth);

router.get('/', getVendors);

// Only Admin can create, update, or delete vendors
router.post('/', requireRole(['Admin']), createVendor);
router.put('/:id', requireRole(['Admin']), updateVendor);
router.delete('/:id', requireRole(['Admin']), deleteVendor);

module.exports = router;
