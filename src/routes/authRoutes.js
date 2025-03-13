const express = require('express');
const router = express.Router();
const { registerUser, loginUser, verifyToken, refreshToken } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/verify', verifyToken);
router.post('/refresh', refreshToken);

module.exports = router; 