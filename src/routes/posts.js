const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getPosts,
  createPost,
  votePost,
  likePost,
  sharePost,
  getPostById
} = require('../controllers/postController');
const {
  addComment,
  likeComment
} = require('../controllers/commentController');

router.get('/', getPosts);
router.get('/:id', getPostById);
router.post('/', auth, createPost);
router.post('/:id/vote', auth, votePost);
router.post('/:id/like', auth, likePost);
router.post('/:id/share', auth, sharePost);

// Comment routes
router.post('/:postId/comments', auth, addComment);
router.post('/:postId/comments/:commentId/like', auth, likeComment);

// Add this route for creating comments
module.exports = router; 