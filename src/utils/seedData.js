const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/userModel');

const samplePosts = [
  {
    title: 'Traffic Light Malfunction at Main Street',
    description: 'The traffic light at the intersection has been malfunctioning for the past 2 days, causing significant delays.',
    category: 'Traffic',
    image: 'https://images.unsplash.com/photo-1597176116047-876a32798fcc',
    votes: 125,
    likes: 45,
    shares: 12,
    comments: [],
    commentCount: 2
  },
  {
    title: 'Park Cleanup Initiative',
    description: 'Organizing a community cleanup event at Central Park this weekend. Looking for volunteers!',
    category: 'Environment',
    image: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5',
    votes: 89,
    likes: 34,
    shares: 8,
    comments: [],
    commentCount: 3
  },
  {
    title: 'Street Light Outage in Residential Area',
    description: 'Multiple street lights are out on Oak Avenue, creating safety concerns for residents.',
    category: 'Public Safety',
    votes: 67,
    likes: 23,
    shares: 5,
    comments: [],
    commentCount: 1
  },
  {
    title: 'Waste Collection Delay Notice',
    description: 'Due to maintenance issues, waste collection in the downtown area will be delayed by one day this week.',
    category: 'Sanitation',
    votes: 45,
    likes: 12,
    shares: 3,
    comments: [],
    commentCount: 0
  },
  {
    title: 'New Bike Lane Construction',
    description: 'Construction of dedicated bike lanes on Maple Street will begin next week. Please expect minor traffic adjustments.',
    category: 'Traffic',
    image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b',
    votes: 156,
    comments: 34,
    likes: 67,
    shares: 15
  }
];

// Sample comments to add to posts
const sampleComments = [
  {
    content: 'This needs immediate attention!',
    likes: 5
  },
  {
    content: 'I noticed this issue too. Very concerning.',
    likes: 3
  },
  {
    content: 'The authorities should look into this.',
    likes: 7
  }
];

// Function to seed the database
const seedDatabase = async () => {
  try {
    // Check if database already has posts
    const existingPosts = await Post.countDocuments();
    if (existingPosts > 0) {
      console.log('Database already has posts, skipping seed');
      return;
    }

    // Create a test user if it doesn't exist
    let testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
    }

    // Delete existing posts
    await Post.deleteMany({});

    // Add sample posts with the test user as author
    const postsWithAuthor = samplePosts.map(post => {
      // Create 1-3 random comments for each post
      const numComments = Math.floor(Math.random() * 3) + 1;
      const postComments = Array.from({ length: numComments }, () => {
        const randomComment = sampleComments[Math.floor(Math.random() * sampleComments.length)];
        return {
          author: testUser._id,
          content: randomComment.content,
          likes: randomComment.likes,
          userLikes: [testUser._id], // Add test user as liker
          createdAt: new Date(Date.now() - Math.random() * 1000000000) // Random time in the past
        };
      });

      return {
        ...post,
        author: testUser._id,
        userVotes: [{ user: testUser._id, vote: 1 }], // Add an upvote from the test user
        userLikes: [testUser._id], // Add a like from the test user
        comments: postComments,
        commentCount: postComments.length
      };
    });

    await Post.insertMany(postsWithAuthor);
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

module.exports = seedDatabase; 