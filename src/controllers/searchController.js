const searchService = require('../services/searchService');

/**
 * @desc    Search across posts, users, topics, and locations
 * @route   GET /api/v1/search
 * @access  Public
 */
const searchAll = async (req, res) => {
  try {
    const { q: query, type } = req.query;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const searchResults = {
      issues: [],
      people: [],
      topics: [],
      locations: []
    };

    // Process all searches in parallel for better performance
    const searchPromises = [];
    
    if (!type || type === 'all' || type === 'issues') {
      searchPromises.push(searchService.searchIssues(query, type)
        .then(issues => { searchResults.issues = issues; }));
    }

    if (!type || type === 'all' || type === 'people') {
      searchPromises.push(searchService.searchPeople(query, type)
        .then(people => { searchResults.people = people; }));
    }

    if (!type || type === 'all' || type === 'topics') {
      searchPromises.push(searchService.searchTopics(query, type)
        .then(topics => { searchResults.topics = topics; }));
    }

    if (!type || type === 'all' || type === 'locations') {
      searchPromises.push(searchService.searchLocations(query, type)
        .then(locations => { searchResults.locations = locations; }));
    }

    // Wait for all search promises to resolve
    await Promise.all(searchPromises);

    res.json(searchResults);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error during search operation' });
  }
};

/**
 * @desc    Get search suggestions based on query
 * @route   GET /api/v1/search/suggestions
 * @access  Public
 */
const getSearchSuggestions = async (req, res) => {
  try {
    const { q: query } = req.query;
    
    if (!query || query.trim() === '') {
      return res.json([]);
    }

    // Get suggestions from different sources and combine them
    const [issueSuggestions, userSuggestions, otherSuggestions] = await Promise.all([
      searchService.getIssueSuggestions(query),
      searchService.getUserSuggestions(query),
      searchService.getOtherSuggestions(query)
    ]);
    
    // Combine all suggestions
    const suggestions = [
      ...issueSuggestions,
      ...userSuggestions,
      ...otherSuggestions
    ];
    
    res.json(suggestions);
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({ message: 'Server error during search suggestion operation' });
  }
};

module.exports = {
  searchAll,
  getSearchSuggestions
}; 