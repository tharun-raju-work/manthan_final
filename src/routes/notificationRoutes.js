const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { auth } = require('../middleware/auth');

// All notification routes require authentication
router.use(auth);

// Get all notifications for the authenticated user
router.get('/', notificationController.getUserNotifications);

// Get unread notification count
router.get('/unread/count', notificationController.getUnreadCount);

// Mark a notification as read - support both PATCH and PUT
router.patch('/:notificationId/read', notificationController.markAsRead);
router.put('/:notificationId/read', notificationController.markAsRead);

// Mark all notifications as read - support both PATCH and PUT
router.patch('/read/all', notificationController.markAllAsRead);
router.put('/read/all', notificationController.markAllAsRead);

// Delete a notification
router.delete('/:notificationId', notificationController.deleteNotification);

// Create a test notification (for development)
router.post('/test', notificationController.createTestNotification);

module.exports = router; 