const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("./models/User.js");
const { MongoMemoryServer } = require('mongodb-memory-server');
const Rating = require("./models/Rating.js");
const Comment = require("./models/Comment.js");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_API_KEY;

// TMDb fetch wrapper
const tmdbFetcher = async (endpoint, req, res) => {
  const page = req.query.page || 1;
  console.log(`Fetching ${endpoint} — page ${page}`);

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}${endpoint}?api_key=${API_KEY}&language=en-US&page=${page}`
    );
    const data = await response.json();
    res.json(data); 
  } catch (err) {
    console.error("TMDb fetch error:", err);
    res.status(500).json({ error: 'Failed to fetch data from TMDb' });
  }
};

// TMDb routes
app.get('/api/movies/popular', (req, res) => tmdbFetcher('/movie/popular', req, res));
app.get('/api/movies/top-rated', (req, res) => tmdbFetcher('/movie/top_rated', req, res));
app.get('/api/tv/popular', (req, res) => tmdbFetcher('/tv/popular', req, res));
app.get('/api/tv/top-rated', (req, res) => tmdbFetcher('/tv/top_rated', req, res));
app.get('/api/people/popular', (req, res) => tmdbFetcher('/person/popular', req, res));
app.get('/api/movies/:id/credits', (req, res) => tmdbFetcher(`/movie/${req.params.id}/credits`, req, res));
app.get('/api/tv/:id/credits', (req, res) => tmdbFetcher(`/tv/${req.params.id}/credits`, req, res));

// Trailers
app.get('/api/movies/:id/trailer', async (req, res) => {
  try {
    const movieId = req.params.id;
    const response = await fetch(`${TMDB_BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}`);
    const data = await response.json();
    const trailer = data.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    res.json({ trailerKey: trailer?.key || null });
  } catch {
    res.status(500).json({ error: 'Failed to fetch trailer' });
  }
});

app.get('/api/tv/:id/trailer', async (req, res) => {
  try {
    const tvId = req.params.id;
    const response = await fetch(`${TMDB_BASE_URL}/tv/${tvId}/videos?api_key=${API_KEY}`);
    const data = await response.json();
    const trailer = data.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    res.json({ trailerKey: trailer?.key || null });
  } catch {
    res.status(500).json({ error: 'Failed to fetch trailer' });
  }
});

// Details
app.get('/api/movies/:id/details', async (req, res) => {
  try {
    const response = await fetch(`${TMDB_BASE_URL}/movie/${req.params.id}?api_key=${API_KEY}&language=en-US`);
    const data = await response.json();
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to fetch movie details' });
  }
});

app.get('/api/tv/:id/details', async (req, res) => {
  try {
    const response = await fetch(`${TMDB_BASE_URL}/tv/${req.params.id}?api_key=${API_KEY}&language=en-US`);
    const data = await response.json();
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to fetch TV show details' });
  }
});

app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: "Missing search query" });
  try {
    const response = await fetch(`${TMDB_BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1`);
    const data = await response.json();
    res.json(data.results);
  } catch {
    res.status(500).json({ error: 'Failed to fetch search results' });
  }
});

app.get('/api/people/:id/details', async (req, res) => {
  try {
    const response = await fetch(`${TMDB_BASE_URL}/person/${req.params.id}?api_key=${API_KEY}&language=en-US`);
    const data = await response.json();
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to fetch person details' });
  }
});

app.get('/api/people/:id/credits', async (req, res) => {
  try {
    const response = await fetch(`${TMDB_BASE_URL}/person/${req.params.id}/combined_credits?api_key=${API_KEY}&language=en-US`);
    const data = await response.json();
    res.json(data.cast || []);
  } catch {
    res.status(500).json({ error: 'Failed to fetch person credits' });
  }
});

// Auth
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
};

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({
      id: user._id,
      username: user.username,
      email: user.email
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get user info" });
  }
});

app.post('/api/users/favorites', authenticateToken, async (req, res) => {
  const { mediaId, mediaType } = req.body;
  if (!mediaId || !mediaType) return res.status(400).json({ message: "Missing media ID or type" });
  try {
    const user = await User.findById(req.user.id);
    const exists = user.favorites.some(fav => fav.mediaId === mediaId && fav.mediaType === mediaType);
    if (!exists) user.favorites.push({ mediaId, mediaType });
    await user.save();
    res.json({ message: "Added to favorites", favorites: user.favorites });
  } catch (err) {
    res.status(500).json({ error: "Failed to add favorite" });
  }
});

app.delete('/api/users/favorites/:mediaId/:mediaType', authenticateToken, async (req, res) => {
  const { mediaId, mediaType } = req.params;
  try {
    const user = await User.findById(req.user.id);
    user.favorites = user.favorites.filter(fav => !(fav.mediaId === parseInt(mediaId) && fav.mediaType === mediaType));
    await user.save();
    res.json({ message: "Removed from favorites", favorites: user.favorites });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove favorite" });
  }
});

app.get('/api/users/favorites', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ favorites: user.favorites });
  } catch (err) {
    res.status(500).json({ error: "Failed to get favorites" });
  }
});


//delete user account
app.delete('/api/users/delete', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Delete user
    await User.findByIdAndDelete(userId);

    // Optionally, delete related ratings and comments
    await Rating.deleteMany({ userId });
    await Comment.deleteMany({ userId });

    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error("Error deleting account:", err);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

//POST OR UPDATE RATING
app.post('/api/ratings', authenticateToken, async (req, res) => {
  const { mediaId, mediaType, rating } = req.body;
  if (!mediaId || !mediaType || !rating) return res.status(400).json({ message: "Missing rating data" });

  try {
    const existing = await Rating.findOne({ userId: req.user.id, mediaId, mediaType });
    if (existing) {
      existing.rating = rating;
      await existing.save();
      return res.json({ message: "Rating updated" });
    }

    const newRating = new Rating({ userId: req.user.id, mediaId, mediaType, rating });
    await newRating.save();
    res.status(201).json({ message: "Rating added" });
  } catch (err) {
    res.status(500).json({ error: "Failed to add/update rating" });
  }
});

//GET RATING
app.get('/api/ratings/:mediaType/:mediaId', async (req, res) => {
  const { mediaId, mediaType } = req.params;
  try {
    const ratings = await Rating.find({ mediaId, mediaType });
    const count = ratings.length;
    const average = count ? (ratings.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1) : null;
    res.json({ average: Number(average), count });
  } catch {
    res.status(500).json({ error: "Failed to get ratings" });
  }
});

//POST COMMENT
app.post('/api/comments', authenticateToken, async (req, res) => {
  const { mediaId, mediaType, text } = req.body;
  if (!mediaId || !mediaType || !text) return res.status(400).json({ message: "Missing comment data" });

  try {
    const newComment = new Comment({
      userId: req.user.id,
      username: req.user.username,
      mediaId,
      mediaType,
      text
    });
    await newComment.save();
    res.status(201).json({ message: "Comment added", comment: newComment });
  } catch (err) {
    res.status(500).json({ error: "Failed to add comment" });
  }
});

//GET COMMENTS
app.get('/api/comments/:mediaType/:mediaId', async (req, res) => {
  const { mediaId, mediaType } = req.params;
  try {
    const comments = await Comment.find({ mediaId, mediaType })
      .sort({ createdAt: -1 })
      .select('username text createdAt userId');
    res.json(comments);
  } catch {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

//DELETE MEDIA ITEM
app.delete('/api/ratings/:mediaType/:mediaId', authenticateToken, async (req, res) => {
  const { mediaId, mediaType } = req.params;
  try {
    const deleted = await Rating.findOneAndDelete({
      userId: req.user.id,
      mediaId,
      mediaType
    });
    if (!deleted) return res.status(404).json({ message: "Rating not found" });
    res.json({ message: "Rating removed" });
  } catch {
    res.status(500).json({ error: "Failed to remove rating" });
  }
});

// DELETE comment
app.delete('/api/comments/:commentId', authenticateToken, async (req, res) => {
  const { commentId } = req.params;
  try {
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    if (comment.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized to delete this comment" });
    }

    await Comment.findByIdAndDelete(commentId);
    res.json({ message: "Comment deleted" });
  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});


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


const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
  connectToDatabase().then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  }).catch(err => {
    console.error("MongoDB connection error:", err);
  });
}

function getMongoServer() {
  return mongoServer;
}

module.exports = { app, connectToDatabase, getMongoServer };

