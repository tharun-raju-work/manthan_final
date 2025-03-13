const asyncHandler = require('express-async-handler');

// @desc    Get test message
// @route   GET /api/v1/test
// @access  Public
const getTestMessage = asyncHandler(async (req, res) => {
  res.json({ message: 'Backend is working!' });
});

module.exports = {
  getTestMessage,
}; 