const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/',              getNotifications);
router.put('/read-all',      markAllNotificationsAsRead);
router.put('/:id/read',      markNotificationAsRead);

module.exports = router;
