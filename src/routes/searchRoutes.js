const express = require('express');
const router = express.Router();
const { searchAll, getSearchSuggestions } = require('../controllers/searchController');

/**
 * @route   GET /api/v1/search
 * @desc    Search across posts, users, topics, and locations
 * @access  Public
 */
router.get('/', searchAll);

/**
 * @route   GET /api/v1/search/suggestions
 * @desc    Get search suggestions based on query
 * @access  Public
 */
router.get('/suggestions', getSearchSuggestions);

module.exports = router; 