const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores and hyphens']
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
      type: String,
      required: true,
      select: false, // Don't include password by default in queries
      minlength: [6, 'Password must be at least 6 characters long']
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: ''
    },
    avatar: {
      type: String,
      default: null
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false
    },
    lastActive: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  try {
    // Since password field is not selected by default, we need to explicitly select it
    const user = await this.constructor.findById(this._id).select('+password');
    if (!user || !user.password) {
      return false;
    }
    return await bcrypt.compare(enteredPassword, user.password);
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

// Update last active timestamp
userSchema.methods.updateLastActive = async function() {
  this.lastActive = new Date();
  await this.save();
};

module.exports = mongoose.model('User', userSchema); 