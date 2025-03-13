const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { 
  registerUser, 
  loginUser, 
  verifyToken 
} = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/verify', verifyToken);

module.exports = router; 