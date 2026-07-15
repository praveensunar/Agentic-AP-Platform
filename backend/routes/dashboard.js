const express = require('express');
const router = express.Router();
const { getDashboard, getVendorDashboard } = require('../controllers/dashboardController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/dashboard', getDashboard);
router.get('/vendor-dashboard', getVendorDashboard);

module.exports = router;
