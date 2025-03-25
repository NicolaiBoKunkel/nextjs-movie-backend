import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_API_KEY;

// Reusable function to fetch from TMDb
const tmdbFetcher = async (endpoint, res) => {
  try {
    const response = await fetch(`${TMDB_BASE_URL}${endpoint}?api_key=${API_KEY}&language=en-US&page=1`);
    const data = await response.json();
    res.json(data.results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch data from TMDb' });
  }
};

// Popular movies
app.get('/api/movies/popular', (req, res) => {
  tmdbFetcher('/movie/popular', res);
});

// Top rated movies
app.get('/api/movies/top-rated', (req, res) => {
  tmdbFetcher('/movie/top_rated', res);
});

// Popular TV shows
app.get('/api/tv/popular', (req, res) => {
  tmdbFetcher('/tv/popular', res);
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
  

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
