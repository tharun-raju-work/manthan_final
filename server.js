const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs').promises;
const morgan = require('morgan');
const helmet = require('helmet');
require('dotenv').config();

const { errorHandler, notFound } = require('./src/middleware/errorMiddleware');
const connectDB = require('./src/config/database');
const seedDatabase = require('./src/utils/seedData');

// Import routes
const testRoutes = require('./src/routes/testRoutes');
const authRoutes = require('./src/routes/authRoutes');
const postRoutes = require('./src/routes/posts');
const userRoutes = require('./src/routes/userRoutes');
const searchRoutes = require('./src/routes/searchRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');

const app = express();

// Create uploads directory if it doesn't exist
(async () => {
  try {
    await fs.access('uploads');
    await fs.access('uploads/avatars');
  } catch {
    await fs.mkdir('uploads', { recursive: true });
    await fs.mkdir('uploads/avatars', { recursive: true });
  }
})();

// Connect to database
connectDB();

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Security headers with CORS-friendly config
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));

app.use(morgan('dev')); // Logging
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/v1/test', testRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Try different ports if default port is in use
const startServer = async () => {
  const ports = [5000, 5001, 5002, 5003];
  
  // Remove seeding to prevent data deletion
  // await seedDatabase();
  
  for (const port of ports) {
    try {
      await new Promise((resolve, reject) => {
        const server = app.listen(port)
          .once('listening', () => {
            console.log(`Server running in ${process.env.NODE_ENV} mode on port ${port}`);
            resolve(server);
          })
          .once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
              reject(err);
            } else {
              console.error('Server error:', err);
              reject(err);
            }
          });
      });
      break;
    } catch (err) {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is in use, trying next port...`);
        if (port === ports[ports.length - 1]) {
          console.error('All ports in use. Please free up a port and try again.');
          process.exit(1);
        }
        continue;
      }
      console.error('Server error:', err);
      process.exit(1);
    }
  }
};

startServer(); 