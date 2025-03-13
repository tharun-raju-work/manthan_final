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

// Import routes
const testRoutes = require('./src/routes/testRoutes');
const authRoutes = require('./src/routes/authRoutes');
const postRoutes = require('./src/routes/posts');
const userRoutes = require('./src/routes/userRoutes');
const searchRoutes = require('./src/routes/searchRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');

const app = express();

// Create uploads directory if it doesn't exist (only in development)
if (process.env.NODE_ENV !== 'production') {
  (async () => {
    try {
      await fs.access('uploads');
      await fs.access('uploads/avatars');
    } catch {
      await fs.mkdir('uploads', { recursive: true });
      await fs.mkdir('uploads/avatars', { recursive: true });
    }
  })();
}

// Database connection with retry mechanism
let isConnected = false;
const connectToDatabase = async (retries = 5) => {
  while (retries > 0) {
    try {
      if (isConnected) {
        return;
      }
      await connectDB();
      isConnected = true;
      console.log('Database connected successfully');
      return;
    } catch (error) {
      console.error(`Database connection attempt failed. Retries left: ${retries - 1}`);
      retries--;
      if (retries === 0) {
        throw error;
      }
      // Wait for 2 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};

// Connect to database on startup
connectToDatabase().catch(console.error);

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  'https://manthan-final.vercel.app',
  'https://manthan-final-git-main-tharunoptimus.vercel.app'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Only use morgan in development
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Serve static files in development
if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// Routes
app.use('/api/v1/test', testRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    database: isConnected ? 'connected' : 'disconnected'
  });
});

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

module.exports = app; 