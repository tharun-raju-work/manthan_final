const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

exports.auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No auth token, access denied' });
    }

    try {
      // Log some info for debugging
      console.log(`Verifying token starting with: ${token.substring(0, 15)}...`);
      
      // Add clock tolerance to handle minor clock skew issues (30 seconds)
      const decoded = jwt.verify(token, process.env.JWT_SECRET, { clockTolerance: 30 });
      
      // Log successful verification
      console.log(`Token verified successfully for user ID: ${decoded.id}`);
      
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        console.error(`User not found for ID: ${decoded.id}`);
        return res.status(401).json({ message: 'User not found' });
      }

      req.user = user;
      next();
    } catch (e) {
      // Enhanced error logging
      if (e.name === 'TokenExpiredError') {
        console.error(`Token expired at ${e.expiredAt}. Current server time: ${new Date()}`);
        return res.status(401).json({ 
          message: 'Your session has expired. Please log in again.',
          error: 'token_expired'
        });
      } else if (e.name === 'JsonWebTokenError') {
        console.error(`JWT Error: ${e.message}`);
        return res.status(401).json({ 
          message: 'Invalid authentication token',
          error: 'invalid_token'
        });
      }
      
      console.error('Token verification failed:', e);
      return res.status(401).json({ message: 'Token is invalid' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

// Optional: Add middleware to check if user is admin
exports.admin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
}; 