const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require("mongoose");
const { MongoMemoryServer } = require('mongodb-memory-server');

// Load env vars
dotenv.config();

// Initialize app
const app = express();
app.use(cors());
app.use(express.json());

// Import route modules
const tmdbRoutes = require('./routes/tmdbRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const commentRoutes = require('./routes/commentRoutes');
const discoverRoutes = require('./routes/discoverRoutes');

// Mount routes
app.use('/api', tmdbRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/discover', discoverRoutes);

// Database connection
let mongoServer;

async function connectToDatabase() {
  if (process.env.NODE_ENV === 'test') {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, { dbName: "test" });
    console.log("Connected to in-memory MongoDB");
  } else {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("Connected to real MongoDB");
  }
}

// Start server
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  connectToDatabase().then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  }).catch(err => {
    console.error("MongoDB connection error:", err);
  });
}

// Export for testing
function getMongoServer() {
  return mongoServer;
}

module.exports = { app, connectToDatabase, getMongoServer };
