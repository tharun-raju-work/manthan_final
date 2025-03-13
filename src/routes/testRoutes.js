const express = require('express');
const router = express.Router();
const { getTestMessage } = require('../controllers/testController');

// @desc    Test endpoint
// @route   GET /api/v1/test
// @access  Public
router.get('/', getTestMessage);

module.exports = router; 