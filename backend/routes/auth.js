const express = require('express');
const router = express.Router();
const { login, verifyMe } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

router.post('/login', login);
router.get('/me', requireAuth, verifyMe);

module.exports = router;
