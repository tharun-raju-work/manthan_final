const { validateComment } = require('../utils/validation');
const Post = require('../models/Post');
const notificationService = require('../services/notificationService');

exports.addComment = async (req, res) => {
  try {
    // Validate comment data
    const { error } = validateComment(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const newComment = {
      author: req.user._id,
      content: req.body.content.trim(),
      likes: 0,
      userLikes: []
    };

    post.comments.push(newComment);
    post.commentCount = post.comments.length;
    await post.save();

    // Populate the author details for the new comment
    const populatedPost = await Post.findById(post._id)
      .populate('comments.author', 'name');

    const addedComment = populatedPost.comments[populatedPost.comments.length - 1];

    // Create notification for post author (if not self)
    try {
      await notificationService.createCommentNotification({
        postId: post._id,
        postTitle: post.title || 'a post',
        commentId: addedComment._id,
        postAuthorId: post.author,
        commentAuthorId: req.user._id
      });
    } catch (notificationError) {
      // Log but don't fail the comment creation
      console.error('Failed to create comment notification:', notificationError);
    }

    res.status(201).json({
      success: true,
      data: {
        ...addedComment.toObject(),
        author: addedComment.author.name
      }
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Failed to add comment' });
  }
};

exports.likeComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const userLikeIndex = comment.userLikes.indexOf(userId);
    if (userLikeIndex === -1) {
      // User hasn't liked the comment yet
      comment.userLikes.push(userId);
      comment.likes += 1;
    } else {
      // User already liked the comment, so unlike it
      comment.userLikes.splice(userLikeIndex, 1);
      comment.likes -= 1;
    }

    await post.save();

    res.json({
      success: true,
      data: {
        likes: comment.likes,
        isLiked: userLikeIndex === -1
      }
    });
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({ message: 'Failed to like comment' });
  }
}; 