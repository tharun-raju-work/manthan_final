const Post = require('../models/Post');
const { validatePost } = require('../utils/validation');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
// const { getTimeAgo } = require('../utils/timeUtils');
const notificationService = require('../services/notificationService');

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
}).single('image');

exports.getPosts = async (req, res) => {
  try {
    const { sort = 'votes', category } = req.query;
    let query = {};
    
    if (category) {
      query.category = category;
    }

    let sortOption = {};
    switch (sort) {
      case 'new':
        sortOption = { createdAt: -1 };
        break;
      case 'trending':
        sortOption = { shares: -1, votes: -1 };
        break;
      default:
        sortOption = { votes: -1 };
    }

    const posts = await Post.find(query)
      .sort(sortOption)
      .populate('author', 'name')
      .populate('comments.author', 'name')
      .lean();

    // Add user-specific data if user is logged in, otherwise provide defaults
    const enhancedPosts = posts.map(post => ({
      ...post,
      userVote: post.userVotes.find(v => v.user?.toString() === req.user?._id?.toString())?.vote || 0,
      userLiked: req.user ? post.userLikes.includes(req.user._id) : false,
      timeAgo: getTimeAgo(post.createdAt),
      author: typeof post.author === 'object' ? post.author.name : 'Anonymous',
      comments: post.comments.map(comment => ({
        ...comment,
        author: typeof comment.author === 'object' ? comment.author.name : 'Anonymous'
      }))
    }));

    res.json(enhancedPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Failed to fetch posts' });
  }
};

exports.createPost = async (req, res) => {
  try {
    // Handle file upload
    upload(req, res, async function(err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: 'File upload error: ' + err.message });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      console.log(1);
      try {
        const postData = {
          title: req.body.title,
          description: req.body.description,
          category: req.body.category,
          author: req.user._id
        };

        if (req.file) {
          postData.image = '/uploads/' + req.file.filename;
        }

        console.log(3)
        const { error } = validatePost(postData);
         console.log(error);
        if (error) {
          // If validation fails and we uploaded an image, delete it
          if (req.file) {
            await fs.unlink(req.file.path);
          }
          return res.status(400).json({ message: error.details[0].message });
        }
        console.log(4)
        const post = new Post(postData);
        await post.save();

        console.log(2);
        // Populate author details
        await post.populate('author', 'name');

        res.status(201).json({
          success: true,
          data: {
            ...post.toObject(),
            author: post.author.name
          }
        });
      } catch (error) {
        // If something goes wrong and we uploaded an image, delete it
        if (req.file) {
          await fs.unlink(req.file.path);
        }
        throw error;
      }
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Failed to create post' });
  }
};

exports.votePost = async (req, res) => {
  try {
    const { direction } = req.body;
    const postId = req.params.id;
    
    if (![-1, 0, 1].includes(direction)) {
      return res.status(400).json({ message: 'Invalid vote direction' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const existingVote = post.userVotes.find(
      v => v.user.toString() === req.user._id.toString()
    );

    if (existingVote) {
      // Update existing vote
      post.votes += direction - existingVote.vote;
      existingVote.vote = direction;
    } else {
      // Add new vote
      post.votes += direction;
      post.userVotes.push({ user: req.user._id, vote: direction });
    }

    await post.save();
    
    // Send notification if this is a new upvote (direction > 0)
    // and it's not the user's own post
    if (direction > 0 && post.author.toString() !== req.user._id.toString()) {
      try {
        await notificationService.createVoteNotification({
          postId: post._id,
          postTitle: post.title,
          postAuthorId: post.author,
          voterId: req.user._id
        });
      } catch (notificationError) {
        // Log but don't fail the vote operation
        console.error('Failed to create vote notification:', notificationError);
      }
    }
    
    res.json({ success: true, data: { votes: post.votes } });
  } catch (error) {
    console.error('Error voting on post:', error);
    res.status(500).json({ message: 'Failed to vote on post' });
  }
};

exports.likePost = async (req, res) => {
  try {
    const { liked } = req.body;
    const postId = req.params.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userLiked = post.userLikes.includes(req.user._id);
    
    if (liked && !userLiked) {
      post.likes += 1;
      post.userLikes.push(req.user._id);
    } else if (!liked && userLiked) {
      post.likes -= 1;
      post.userLikes = post.userLikes.filter(
        id => id.toString() !== req.user._id.toString()
      );
    }

    await post.save();
    res.json({ success: true, data: { likes: post.likes } });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ message: 'Failed to like post' });
  }
};

exports.sharePost = async (req, res) => {
  try {
    const postId = req.params.id;
    
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.shares += 1;
    await post.save();
    
    res.json({ success: true, data: { shares: post.shares } });
  } catch (error) {
    console.error('Error sharing post:', error);
    res.status(500).json({ message: 'Failed to share post' });
  }
};

// Add a new function to get a post by ID
exports.getPostById = async (req, res) => {
  try {
    const postId = req.params.id;
    
    const post = await Post.findById(postId)
      .populate('author', 'name')
      .populate('comments.author', 'name')
      .lean();
    
    if (!post) {
      return res.status(404).json({ 
        success: false,
        message: 'Post not found' 
      });
    }

    // Add user-specific data if user is logged in
    const enhancedPost = {
      ...post,
      userVote: post.userVotes.find(v => v.user?.toString() === req.user?._id?.toString())?.vote || 0,
      userLiked: req.user ? post.userLikes.includes(req.user._id) : false,
      timeAgo: getTimeAgo(post.createdAt),
      author: typeof post.author === 'object' ? post.author.name : 'Anonymous',
      comments: post.comments.map(comment => ({
        ...comment,
        author: typeof comment.author === 'object' ? comment.author.name : 'Anonymous',
        timeAgo: getTimeAgo(comment.createdAt)
      }))
    };

    res.json(enhancedPost);
  } catch (error) {
    console.error('Error fetching post by ID:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch post' 
    });
  }
};

// Helper function to format time ago
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + 'y ago';
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + 'mo ago';
  
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + 'd ago';
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + 'h ago';
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + 'm ago';
  
  return Math.floor(seconds) + 's ago';
} 