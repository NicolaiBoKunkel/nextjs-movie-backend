const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("./models/User.js");


dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_API_KEY;

// function to fetch from TMDb
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



// Popular movies
app.get('/api/movies/popular', (req, res) => {
  tmdbFetcher('/movie/popular', req, res);
});

// Top rated movies
app.get('/api/movies/top-rated', (req, res) => {
  tmdbFetcher('/movie/top_rated', req, res);
});

// Popular TV shows
app.get('/api/tv/popular', (req, res) => {
  tmdbFetcher('/tv/popular', req, res);
});

// Top rated Tv shows
app.get('/api/tv/top-rated', (req, res) => {
  tmdbFetcher('/tv/top_rated', req, res);
});

// Popular people
app.get('/api/people/popular', (req, res) => {
  tmdbFetcher('/person/popular', req, res);
});

// for trailers
app.get('/api/movies/:id/trailer', async (req, res) => {
    try {
      const movieId = req.params.id;
      const response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${API_KEY}`);
      const data = await response.json();
      const trailer = data.results?.find(video => video.type === 'Trailer' && video.site === 'YouTube');
      res.json({ trailerKey: trailer?.key || null });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch trailer' });
    }
  });
  
  app.get('/api/tv/:id/trailer', async (req, res) => {
    try {
      const tvId = req.params.id;
      const response = await fetch(`https://api.themoviedb.org/3/tv/${tvId}/videos?api_key=${API_KEY}`);
      const data = await response.json();
      const trailer = data.results?.find(video => video.type === 'Trailer' && video.site === 'YouTube');
      res.json({ trailerKey: trailer?.key || null });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch trailer' });
    }
  });
  

  // for details
  app.get('/api/movies/:id/details', async (req, res) => {
    const movieId = req.params.id;
    try {
      const response = await fetch(`${TMDB_BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=en-US`);
      const data = await response.json();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch movie details" });
    }
  });

  app.get('/api/tv/:id/details', async (req, res) => {
    const tvId = req.params.id;
    try {
      const response = await fetch(`${TMDB_BASE_URL}/tv/${tvId}?api_key=${API_KEY}&language=en-US`);
      const data = await response.json();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch TV show details" });
    }
  });
  
  //search
  app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: "Missing search query" });
  
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1`
      );
      const data = await response.json();
      res.json(data.results);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch search results" });
    }
  });


  // Person details
  app.get('/api/people/:id/details', async (req, res) => {
    const { id } = req.params;
    try {
      const response = await fetch(`${TMDB_BASE_URL}/person/${id}?api_key=${API_KEY}&language=en-US`);
      const data = await response.json();
      res.json(data);
    } catch {
      res.status(500).json({ error: "Failed to fetch person details" });
    }
  });

  // Person credits
  app.get('/api/people/:id/credits', async (req, res) => {
    const { id } = req.params;
    try {
      const response = await fetch(`${TMDB_BASE_URL}/person/${id}/combined_credits?api_key=${API_KEY}&language=en-US`);
      const data = await response.json();
      res.json(data.cast || []);
    } catch {
      res.status(500).json({ error: "Failed to fetch person credits" });
    }
  });

  // Movie credits (cast and crew)
  app.get('/api/movies/:id/credits', (req, res) => {
    tmdbFetcher(`/movie/${req.params.id}/credits`, req, res);
  });


    // For TV show credits
  app.get('/api/tv/:id/credits', (req, res) => {
    tmdbFetcher(`/tv/${req.params.id}/credits`, req, res);
  });


  mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  }); 



  const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization; // expected: "Bearer <token>"
    const token = authHeader && authHeader.split(" ")[1];
  
    if (!token) return res.status(401).json({ message: "No token provided" });
  
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ message: "Invalid token" });
      req.user = user; // { id, username }
      next();
    });
  };
  


  // REGISTER
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

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// User info
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password"); // exclude password
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get user info" });
  }
});


app.post('/api/users/favorites', authenticateToken, async (req, res) => {
  const { mediaId, mediaType } = req.body;
  if (!mediaId || !mediaType) {
    return res.status(400).json({ message: "Missing media ID or type" });
  }

  try {
    const user = await User.findById(req.user.id);
    const exists = user.favorites.some(fav => fav.mediaId === mediaId && fav.mediaType === mediaType);

    if (!exists) {
      user.favorites.push({ mediaId, mediaType });
      await user.save();
    }

    res.json({ message: "Added to favorites", favorites: user.favorites });
  } catch (err) {
    res.status(500).json({ error: "Failed to add favorite" });
  }
});


app.delete('/api/users/favorites/:mediaId/:mediaType', authenticateToken, async (req, res) => {
  const { mediaId, mediaType } = req.params;

  try {
    const user = await User.findById(req.user.id);
    user.favorites = user.favorites.filter(
      fav => !(fav.mediaId === parseInt(mediaId) && fav.mediaType === mediaType)
    );
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


const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
