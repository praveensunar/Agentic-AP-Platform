const db = require('../models/db');

// GET /api/notifications
const getNotifications = async (request, response, next) => {
  try {
    const { limit = 50 } = request.query;
    const maxNotificationsToReturn = parseInt(limit);

    const notificationList = db.find('notifications');
    notificationList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const limitedNotifications = notificationList.slice(0, maxNotificationsToReturn);

    const unreadNotificationCount = db.countDocuments('notifications', n => !n.isRead);

    response.json({
      success: true,
      data: limitedNotifications,
      unreadCount: unreadNotificationCount,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/notifications/:id/read
const markNotificationAsRead = async (request, response, next) => {
  try {
    const notificationId = request.params.id;
    const updatedNotification = db.findByIdAndUpdate(
      'notifications',
      notificationId,
      { isRead: true }
    );

    if (!updatedNotification) {
      return response.status(404).json({ success: false, message: 'Notification not found' });
    }

    response.json({ success: true, data: updatedNotification });
  } catch (error) {
    next(error);
  }
};

// PUT /api/notifications/read-all
const markAllNotificationsAsRead = async (request, response, next) => {
  try {
    db.updateMany('notifications', n => !n.isRead, { isRead: true });
    response.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
