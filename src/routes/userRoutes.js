const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { getProfile, updateProfile, getTopContributors, getProfileByUsername } = require('../controllers/userController');
const multer = require('multer');
const path = require('path');

// Configure multer for avatar upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/avatars/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files (jpeg, jpg, png) are allowed!'));
  }
});

// Get top contributors (public route)
router.get('/top-contributors', getTopContributors);

// Get user profile by username (public route)
router.get('/profile/:username', getProfileByUsername);

// Get own profile (private route)
router.get('/profile', auth, getProfile);

// Update user profile
router.put('/profile', auth, upload.single('avatar'), updateProfile);

module.exports = router; 