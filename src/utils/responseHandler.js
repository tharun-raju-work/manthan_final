/**
 * Utility functions for handling API responses consistently
 */

/**
 * Send a successful response
 * @param {Object} res - Express response object
 * @param {Object|Array} data - Response data
 * @param {Number} statusCode - HTTP status code (default: 200)
 * @param {String} message - Success message (optional)
 */
const successResponse = (res, data, statusCode = 200, message = '') => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Number} statusCode - HTTP status code (default: 400)
 * @param {Object} errors - Detailed error information (optional)
 */
const errorResponse = (res, message, statusCode = 400, errors = null) => {
  const response = {
    success: false,
    message
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  return res.status(statusCode).json(response);
};

module.exports = {
  successResponse,
  errorResponse
}; 