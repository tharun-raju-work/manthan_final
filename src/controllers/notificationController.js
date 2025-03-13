const notificationService = require('../services/notificationService');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * Get all notifications for the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit, skip, read, sort } = req.query;
    
    // Parse query parameters
    const options = {
      limit: limit ? parseInt(limit) : 20,
      skip: skip ? parseInt(skip) : 0,
      read: read !== undefined ? read === 'true' : null,
      sort: { createdAt: -1 } // Default sort by newest first
    };
    
    const notifications = await notificationService.getUserNotifications(userId, options);
    const unreadCount = await notificationService.getUnreadCount(userId);
    
    return successResponse(res, {
      notifications,
      pagination: {
        limit: options.limit,
        skip: options.skip,
        unreadCount
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return errorResponse(res, 'Failed to fetch notifications', 500);
  }
};

/**
 * Mark a notification as read
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationId } = req.params;
    
    const notification = await notificationService.markAsRead(notificationId, userId);
    return successResponse(res, { notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return errorResponse(res, error.message, 400);
  }
};

/**
 * Mark all notifications as read for the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await notificationService.markAllAsRead(userId);
    return successResponse(res, result);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return errorResponse(res, 'Failed to mark all notifications as read', 500);
  }
};

/**
 * Delete a notification
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationId } = req.params;
    
    const result = await notificationService.deleteNotification(notificationId, userId);
    return successResponse(res, result);
  } catch (error) {
    console.error('Error deleting notification:', error);
    return errorResponse(res, error.message, 400);
  }
};

/**
 * Get unread notification count for the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await notificationService.getUnreadCount(userId);
    return successResponse(res, { count });
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return errorResponse(res, 'Failed to get unread notification count', 500);
  }
};

/**
 * Create a test notification (for development purposes)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createTestNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type } = req.body;
    
    let notification;
    
    // Create different types of test notifications
    switch (type) {
      case 'comment':
        notification = await notificationService.createNotification({
          recipient: userId,
          sender: userId, // Self for testing
          type: 'new_comment',
          title: 'Test Comment Notification',
          message: 'This is a test comment notification',
          relatedModel: 'Post',
          relatedId: '000000000000000000000000', // Dummy ID
          url: '/test'
        });
        break;
        
      case 'follower':
        notification = await notificationService.createNotification({
          recipient: userId,
          sender: userId, // Self for testing
          type: 'new_follower',
          title: 'Test Follower Notification',
          message: 'This is a test follower notification',
          relatedModel: 'User',
          relatedId: userId,
          url: '/test'
        });
        break;
        
      case 'vote':
        notification = await notificationService.createNotification({
          recipient: userId,
          sender: userId, // Self for testing
          type: 'vote',
          title: 'Test Vote Notification',
          message: 'This is a test vote notification',
          relatedModel: 'Post',
          relatedId: '000000000000000000000000', // Dummy ID
          url: '/test'
        });
        break;
        
      default:
        notification = await notificationService.createNotification({
          recipient: userId,
          sender: userId, // Self for testing
          type: 'system',
          title: 'Test System Notification',
          message: 'This is a test system notification',
          url: '/test'
        });
    }
    
    return successResponse(res, { notification });
  } catch (error) {
    console.error('Error creating test notification:', error);
    return errorResponse(res, 'Failed to create test notification', 500);
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  createTestNotification
}; 