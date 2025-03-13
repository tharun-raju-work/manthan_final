const Post = require('../models/Post');
const User = require('../models/userModel');
const Topic = require('../models/Topic');
const Location = require('../models/Location');
const { formatTimeAgo } = require('../utils/timeUtils');

/**
 * Search for issues (posts) matching the query
 * @param {String} query - Search term
 * @param {String} type - Type of search (issues, all, etc.)
 * @returns {Array} Array of matching issues
 */
const searchIssues = async (query, type) => {
  try {
    // Search in posts (issues)
    const issues = await Post.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ]
    })
    .populate('author', 'name username avatar')
    .limit(type === 'issues' ? 20 : 5)
    .select('title description category votes commentCount createdAt')
    .sort({ votes: -1, createdAt: -1 });

    return issues.map(issue => ({
      id: issue._id,
      title: issue.title,
      description: issue.description,
      category: issue.category,
      status: getStatusFromVotes(issue.votes),
      author: issue.author ? issue.author.name : 'Unknown',
      authorUsername: issue.author ? issue.author.username : 'unknown',
      postedAt: formatTimeAgo(issue.createdAt),
      votes: issue.votes,
      comments: issue.commentCount
    }));
  } catch (error) {
    console.error('Error searching issues:', error);
    throw error;
  }
};

/**
 * Search for people matching the query
 * @param {String} query - Search term
 * @param {String} type - Type of search (people, all, etc.)
 * @returns {Array} Array of matching people
 */
const searchPeople = async (query, type) => {
  try {
    const people = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } },
        { bio: { $regex: query, $options: 'i' } }
      ]
    })
    .limit(type === 'people' ? 20 : 5)
    .select('name username avatar bio');

    // For production, you would implement a proper user follower system
    // For now, generate random follower counts
    return people.map(person => ({
      id: person._id,
      name: person.name,
      username: person.username,
      avatar: person.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=random`,
      bio: person.bio || `User profile for ${person.name}`,
      followers: Math.floor(Math.random() * 200) // Random follower count for demo
    }));
  } catch (error) {
    console.error('Error searching people:', error);
    throw error;
  }
};

/**
 * Search for topics matching the query
 * @param {String} query - Search term
 * @param {String} type - Type of search (topics, all, etc.)
 * @returns {Array} Array of matching topics
 */
const searchTopics = async (query, type) => {
  try {
    // Search in topics
    const topics = await Topic.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    })
    .limit(type === 'topics' ? 20 : 5)
    .select('name description postCount followerCount')
    .sort({ postCount: -1, followerCount: -1 });

    if (topics.length === 0 && query.trim().length > 2) {
      // If no topics found, suggest creating a new one with the query term
      // This is just for demonstration, in production you'd handle this differently
      return [{
        id: `new-topic-${Date.now()}`,
        name: query,
        description: `Create a new topic for discussions about ${query}.`,
        count: 0,
        isNewSuggestion: true
      }];
    }

    return topics.map(topic => ({
      id: topic._id,
      name: topic.name,
      count: topic.postCount,
      description: topic.description
    }));
  } catch (error) {
    console.error('Error searching topics:', error);
    
    // Fallback to generate topics if database search fails
    const topicKeywords = [
      'Maintenance', 'Safety', 'Development', 'Construction', 
      'Community', 'Improvements', 'Issues', 'Planning'
    ];
    
    const fallbackTopics = topicKeywords
      .filter(keyword => keyword.toLowerCase().includes(query.toLowerCase()) || 
                      query.toLowerCase().includes(keyword.toLowerCase()))
      .slice(0, type === 'topics' ? 10 : 3)
      .map((keyword, index) => ({
        id: `fallback-${index}`,
        name: `${query} ${keyword}`,
        count: Math.floor(Math.random() * 50) + 5,
        description: `Issues related to ${query} ${keyword.toLowerCase()}.`,
        isFallback: true
      }));
    
    return fallbackTopics.length > 0 ? fallbackTopics : [{
      id: `fallback-generic`,
      name: query,
      count: Math.floor(Math.random() * 30) + 2,
      description: `Issues related to ${query}.`,
      isFallback: true
    }];
  }
};

/**
 * Search for locations matching the query
 * @param {String} query - Search term
 * @param {String} type - Type of search (locations, all, etc.)
 * @returns {Array} Array of matching locations
 */
const searchLocations = async (query, type) => {
  try {
    // Search in locations
    const locations = await Location.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    })
    .limit(type === 'locations' ? 20 : 5)
    .select('name description type postCount')
    .sort({ postCount: -1 });

    return locations.map(location => ({
      id: location._id,
      name: location.name,
      count: location.postCount,
      type: location.type
    }));
  } catch (error) {
    console.error('Error searching locations:', error);
    
    // Fallback to generate locations if database search fails
    const locationTypes = ['Park', 'District', 'Neighborhood', 'Street', 'Junction', 'Area'];
    
    return locationTypes
      .filter((_, index) => index < (type === 'locations' ? 8 : 3))
      .map((locationType, index) => ({
        id: `fallback-${index}`,
        name: `${query} ${locationType}`,
        count: Math.floor(Math.random() * 40) + 3,
        type: locationType,
        isFallback: true
      }));
  }
};

/**
 * Get issue-related search suggestions
 * @param {String} query - Search term
 * @returns {Array} Array of issue suggestions
 */
const getIssueSuggestions = async (query) => {
  try {
    const postSuggestions = await Post.find({
      title: { $regex: query, $options: 'i' }
    })
    .limit(2)
    .select('title category');
    
    return postSuggestions.map(post => ({
      type: 'issue',
      text: post.title,
      id: post._id
    }));
  } catch (error) {
    console.error('Error getting issue suggestions:', error);
    throw error;
  }
};

/**
 * Get user-related search suggestions
 * @param {String} query - Search term
 * @returns {Array} Array of user suggestions
 */
const getUserSuggestions = async (query) => {
  try {
    const userSuggestions = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } }
      ]
    })
    .limit(2)
    .select('name username');
    
    return userSuggestions.map(user => ({
      type: 'user',
      text: `${user.name} (@${user.username})`,
      id: user._id,
      username: user.username
    }));
  } catch (error) {
    console.error('Error getting user suggestions:', error);
    throw error;
  }
};

/**
 * Get topic suggestions based on query
 * @param {String} query - Search term 
 * @returns {Array} Array of topic suggestions
 */
const getTopicSuggestions = async (query) => {
  try {
    if (query.length <= 2) return [];
    
    const topicSuggestions = await Topic.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    })
    .limit(2)
    .select('name');
    
    return topicSuggestions.map(topic => ({
      type: 'topic',
      text: topic.name,
      id: topic._id
    }));
  } catch (error) {
    console.error('Error getting topic suggestions:', error);
    return [{
      type: 'topic',
      text: `${query} maintenance`,
      id: `topic-${Date.now()}-1`
    }];
  }
};

/**
 * Get location suggestions based on query
 * @param {String} query - Search term
 * @returns {Array} Array of location suggestions
 */
const getLocationSuggestions = async (query) => {
  try {
    if (query.length <= 2) return [];
    
    const locationSuggestions = await Location.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    })
    .limit(2)
    .select('name type');
    
    return locationSuggestions.map(location => ({
      type: 'location',
      text: location.name,
      id: location._id
    }));
  } catch (error) {
    console.error('Error getting location suggestions:', error);
    return [{
      type: 'location',
      text: `${query} neighborhood`,
      id: `location-${Date.now()}-1`
    }];
  }
};

/**
 * Generate topic and location suggestions
 * @param {String} query - Search term
 * @returns {Array} Array of generated topic and location suggestions
 */
const getOtherSuggestions = async (query) => {
  if (query.length <= 2) return [];
  
  const [topicSugs, locationSugs] = await Promise.all([
    getTopicSuggestions(query),
    getLocationSuggestions(query)
  ]);
  
  return [...topicSugs, ...locationSugs];
};

/**
 * Determine status based on vote count
 * @param {Number} votes - Number of votes
 * @returns {String} Status label
 */
function getStatusFromVotes(votes) {
  if (votes >= 50) return 'In Progress';
  if (votes >= 10) return 'Under Review';
  return 'Open';
}

module.exports = {
  searchIssues,
  searchPeople,
  searchTopics,
  searchLocations,
  getIssueSuggestions,
  getUserSuggestions,
  getTopicSuggestions,
  getLocationSuggestions,
  getOtherSuggestions,
  getStatusFromVotes
}; 