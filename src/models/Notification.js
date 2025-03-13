const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  type: {
    type: String,
    required: true,
    enum: [
      'new_comment', 
      'mention', 
      'reply', 
      'issue_update', 
      'new_follower',
      'vote',
      'post_approval',
      'admin_message',
      'topic_update'
    ]
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  read: {
    type: Boolean,
    default: false
  },
  relatedModel: {
    type: String,
    enum: ['Post', 'Comment', 'User', 'Topic', null],
    default: null
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedModel',
    default: null
  },
  url: {
    type: String,
    trim: true,
    default: null
  },
  image: {
    type: String,
    default: null
  },
  additionalData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: true
});

// Create compound index for faster queries
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

// Add instance method to mark as read
notificationSchema.method('markAsRead', async function() {
  this.read = true;
  return this.save();
});

// Statics
notificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    { recipient: userId, read: false },
    { $set: { read: true } }
  );
};

notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ recipient: userId, read: false });
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 