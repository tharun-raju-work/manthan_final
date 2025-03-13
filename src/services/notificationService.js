const Notification = require('../models/Notification');
const User = require('../models/userModel');

/**
 * Create a new notification
 * @param {Object} notificationData - The notification data
 * @returns {Object} The created notification
 */
const createNotification = async (notificationData) => {
  try {
    const notification = new Notification(notificationData);
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Get all notifications for a user
 * @param {String} userId - The user ID
 * @param {Object} options - Query options (limit, skip, filter)
 * @returns {Array} List of notifications
 */
const getUserNotifications = async (userId, options = {}) => {
  try {
    const { limit = 20, skip = 0, read = null, sort = { createdAt: -1 } } = options;
    
    // Build query
    const query = { recipient: userId };
    if (read !== null) {
      query.read = read;
    }
    
    // Execute query with populate for sender info
    const notifications = await Notification.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name username avatar')
      .populate('relatedId');
      
    return notifications;
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
};

/**
 * Mark a notification as read
 * @param {String} notificationId - The notification ID
 * @param {String} userId - The user ID (for verification)
 * @returns {Object} The updated notification
 */
const markAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId
    });
    
    if (!notification) {
      throw new Error('Notification not found or does not belong to user');
    }
    
    notification.read = true;
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 * @param {String} userId - The user ID
 * @returns {Object} Result of the operation
 */
const markAllAsRead = async (userId) => {
  try {
    const result = await Notification.markAllAsRead(userId);
    return { success: true, count: result.modifiedCount };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Delete a notification
 * @param {String} notificationId - The notification ID
 * @param {String} userId - The user ID (for verification)
 * @returns {Object} Result of the operation
 */
const deleteNotification = async (notificationId, userId) => {
  try {
    const result = await Notification.deleteOne({
      _id: notificationId,
      recipient: userId
    });
    
    if (result.deletedCount === 0) {
      throw new Error('Notification not found or does not belong to user');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

/**
 * Get unread notification count for a user
 * @param {String} userId - The user ID
 * @returns {Number} Count of unread notifications
 */
const getUnreadCount = async (userId) => {
  try {
    const count = await Notification.getUnreadCount(userId);
    return count;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    throw error;
  }
};

/**
 * Create new comment notification
 * @param {Object} data - The data needed for the notification
 * @returns {Object} The created notification
 */
const createCommentNotification = async ({ postId, postTitle, commentId, postAuthorId, commentAuthorId }) => {
  // Don't notify yourself
  if (postAuthorId.toString() === commentAuthorId.toString()) {
    return null;
  }

  const commentAuthor = await User.findById(commentAuthorId).select('name username');
  
  return createNotification({
    recipient: postAuthorId,
    sender: commentAuthorId,
    type: 'new_comment',
    title: 'New Comment',
    message: `${commentAuthor.name} commented on your post: "${postTitle}"`,
    relatedModel: 'Post',
    relatedId: postId,
    url: `/post/${postId}?comment=${commentId}`,
  });
};

/**
 * Create new follower notification
 * @param {Object} data - The data needed for notification
 * @returns {Object} The created notification
 */
const createFollowerNotification = async ({ followerId, followedId }) => {
  const follower = await User.findById(followerId).select('name username avatar');
  
  return createNotification({
    recipient: followedId,
    sender: followerId,
    type: 'new_follower',
    title: 'New Follower',
    message: `${follower.name} started following you`,
    relatedModel: 'User',
    relatedId: followerId,
    url: `/@${follower.username}`,
    image: follower.avatar
  });
};

/**
 * Create vote notification
 * @param {Object} data - The data needed for notification
 * @returns {Object} The created notification
 */
const createVoteNotification = async ({ postId, postTitle, postAuthorId, voterId }) => {
  // Don't notify yourself
  if (postAuthorId.toString() === voterId.toString()) {
    return null;
  }

  const voter = await User.findById(voterId).select('name');
  
  return createNotification({
    recipient: postAuthorId,
    sender: voterId,
    type: 'vote',
    title: 'New Vote',
    message: `${voter.name} voted on your post: "${postTitle}"`,
    relatedModel: 'Post',
    relatedId: postId,
    url: `/post/${postId}`
  });
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  createCommentNotification,
  createFollowerNotification,
  createVoteNotification
}; 