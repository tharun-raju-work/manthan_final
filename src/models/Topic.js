const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  postCount: {
    type: Number,
    default: 0
  },
  followerCount: {
    type: Number,
    default: 0
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  relatedTopics: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Create a text index for better search performance
topicSchema.index({ name: 'text', description: 'text' });

// Pre-save middleware to generate slug
topicSchema.pre('save', function(next) {
  if (!this.isModified('name')) {
    return next();
  }
  
  // Create slug from name
  this.slug = this.name
    .toLowerCase()
    .replace(/[^\w\s]/g, '')  // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .trim();
    
  next();
});

const Topic = mongoose.model('Topic', topicSchema);

module.exports = Topic; 