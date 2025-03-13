const User = require('../models/userModel');
const Post = require('../models/Post');
const fs = require('fs').promises;
const path = require('path');

// @desc    Get user profile with stats
// @route   GET /api/v1/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user stats
    const stats = await getUserStats(req.user._id);

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        stats
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/v1/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, bio } = req.body;
    const updateData = { name, bio };

    // Handle avatar upload
    if (req.file) {
      // Delete old avatar if it exists
      const user = await User.findById(req.user._id);
      if (user.avatar) {
        try {
          const oldAvatarPath = path.join(__dirname, '../..', user.avatar.replace('/uploads/', 'uploads/'));
          await fs.access(oldAvatarPath);
          await fs.unlink(oldAvatarPath);
        } catch (error) {
          console.error('Error deleting old avatar:', error);
        }
      }
      
      // Set new avatar path
      updateData.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update last active timestamp
    await updatedUser.updateLastActive();

    // Get user stats
    const stats = await getUserStats(req.user._id);

    res.json({
      success: true,
      data: {
        ...updatedUser.toObject(),
        stats
      }
    });
  } catch (error) {
    // If there was an error and we uploaded a new file, delete it
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }

    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating profile'
    });
  }
};

// @desc    Get top contributors
// @route   GET /api/v1/users/top-contributors
// @access  Public
exports.getTopContributors = async (req, res) => {
  try {
    // Get all users
    const users = await User.find().select('-password');
    
    // Calculate contribution points for each user
    const contributors = await Promise.all(users.map(async (user) => {
      const stats = await getUserStats(user._id);
      const points = calculatePoints(stats);
      
      return {
        id: user._id,
        name: user.name,
        avatar: user.avatar,
        points,
        stats
      };
    }));

    // Sort by points in descending order and take top 5
    const topContributors = contributors
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);

    res.json({
      success: true,
      data: topContributors
    });
  } catch (error) {
    console.error('Error fetching top contributors:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching top contributors'
    });
  }
};

// @desc    Get user profile by username
// @route   GET /api/v1/users/profile/:username
// @access  Public
exports.getProfileByUsername = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user stats
    const stats = await getUserStats(user._id);

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        stats
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile'
    });
  }
};

// Helper function to calculate contribution points
function calculatePoints(stats) {
  return (
    (stats.totalPosts * 10) +     // 10 points per post
    (stats.totalComments * 5) +   // 5 points per comment
    (stats.totalVotes * 2)        // 2 points per vote received
  );
}

// Helper function to get user stats
async function getUserStats(userId) {
  try {
    // Get total posts
    const totalPosts = await Post.countDocuments({ author: userId });

    // Get total comments and votes
    const posts = await Post.find({});
    let totalComments = 0;
    let totalVotes = 0;

    posts.forEach(post => {
      // Count comments by this user
      totalComments += post.comments.filter(comment => 
        comment.author.toString() === userId.toString()
      ).length;

      // Count votes on user's posts
      if (post.author.toString() === userId.toString()) {
        totalVotes += post.votes || 0;
      }
    });

    return {
      totalPosts,
      totalComments,
      totalVotes
    };
  } catch (error) {
    console.error('Error calculating user stats:', error);
    return {
      totalPosts: 0,
      totalComments: 0,
      totalVotes: 0
    };
  }
} 