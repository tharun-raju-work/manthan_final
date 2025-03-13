const mongoose = require('mongoose');
const Topic = require('../models/Topic');
const Location = require('../models/Location');
const User = require('../models/userModel');
require('dotenv').config();

// Sample topics
const topicData = [
  {
    name: 'Road Maintenance',
    description: 'Issues related to road repairs, potholes, and general road maintenance.'
  },
  {
    name: 'Traffic Safety',
    description: 'Concerns about traffic safety, including intersections, crosswalks, and speed limits.'
  },
  {
    name: 'Public Transportation',
    description: 'Discussions about public transportation systems, bus routes, and schedules.'
  },
  {
    name: 'Waste Management',
    description: 'Topics related to garbage collection, recycling, and waste disposal.'
  },
  {
    name: 'Parks and Recreation',
    description: 'Discussions about parks, playgrounds, and recreational facilities.'
  },
  {
    name: 'Water Supply',
    description: 'Issues related to water quality, supply, and infrastructure.'
  },
  {
    name: 'Street Lighting',
    description: 'Topics concerning street lights, maintenance, and coverage.'
  },
  {
    name: 'Noise Pollution',
    description: 'Discussions about noise levels, regulations, and enforcement.'
  },
  {
    name: 'Air Quality',
    description: 'Concerns about air pollution, emissions, and air quality monitoring.'
  },
  {
    name: 'Public Safety',
    description: 'Issues related to community safety, crime prevention, and law enforcement.'
  },
  {
    name: 'Housing Development',
    description: 'Topics about housing projects, affordable housing, and development.'
  },
  {
    name: 'Community Events',
    description: 'Discussions about local events, festivals, and community gatherings.'
  }
];

// Sample locations
const locationData = [
  {
    name: 'Central Park',
    description: 'The main park in the downtown area, featuring walking trails and recreational facilities.',
    type: 'Park'
  },
  {
    name: 'Downtown District',
    description: 'The central business and commercial area of the city.',
    type: 'District'
  },
  {
    name: 'Riverside Neighborhood',
    description: 'Residential area along the river with parks and walking paths.',
    type: 'Neighborhood'
  },
  {
    name: 'Main Street',
    description: 'The primary commercial street running through downtown.',
    type: 'Street'
  },
  {
    name: 'Oakwood Junction',
    description: 'A major intersection connecting several main roads and highways.',
    type: 'Junction'
  },
  {
    name: 'Industrial Area',
    description: 'Region designated for manufacturing and industrial businesses.',
    type: 'Area'
  },
  {
    name: 'Sunset Hills',
    description: 'Residential neighborhood known for its hillside homes and views.',
    type: 'Neighborhood'
  },
  {
    name: 'Memorial Park',
    description: 'Large recreational area with sports fields and picnic areas.',
    type: 'Park'
  }
];

/**
 * Seed topics and locations to database
 */
const seedTopicsLocations = async () => {
  try {
    // Get admin user for createdBy field
    const adminUser = await User.findOne({ isAdmin: true });
    const userId = adminUser ? adminUser._id : null;

    // Clear existing data
    await Topic.deleteMany({});
    await Location.deleteMany({});
    
    console.log('Existing topics and locations removed');

    // Create topics with admin as creator
    const topicPromises = topicData.map(topic => {
      return new Topic({
        ...topic,
        createdBy: userId,
        postCount: Math.floor(Math.random() * 50) + 1,
        followerCount: Math.floor(Math.random() * 100) + 1
      }).save();
    });
    
    await Promise.all(topicPromises);
    console.log(`${topicData.length} topics created`);

    // Create locations with admin as creator
    const locationPromises = locationData.map(location => {
      return new Location({
        ...location,
        createdBy: userId,
        postCount: Math.floor(Math.random() * 40) + 1
      }).save();
    });
    
    await Promise.all(locationPromises);
    console.log(`${locationData.length} locations created`);

    console.log('Topics and locations seeding completed');
  } catch (error) {
    console.error('Error seeding topics and locations:', error);
  }
};

// Execute if this file is run directly
if (require.main === module) {
  // Connect to database
  const connectDB = require('../config/database');
  connectDB().then(() => {
    seedTopicsLocations().then(() => {
      console.log('Seed completed, disconnecting...');
      mongoose.disconnect();
    });
  });
} else {
  // Export for use in other files
  module.exports = seedTopicsLocations;
} 