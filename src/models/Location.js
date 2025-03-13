const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
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
  type: {
    type: String,
    required: true,
    enum: ['Park', 'District', 'Neighborhood', 'Street', 'Junction', 'Area', 'Other']
  },
  coordinates: {
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    }
  },
  postCount: {
    type: Number,
    default: 0
  },
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
locationSchema.index({ name: 'text', description: 'text' });

// Pre-save middleware to generate slug
locationSchema.pre('save', function(next) {
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

const Location = mongoose.model('Location', locationSchema);

module.exports = Location; 