const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { TMDB_BASE_URL, API_KEY } = require('../utils/tmdbFetcher');

// Discover movies
router.get('/movies', async (req, res) => {
  try {
    const page = Math.floor(Math.random() * 10) + 1;
    const response = await fetch(
      `${TMDB_BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc&page=${page}`
    );
    const data = await response.json();
    res.json(data.results.slice(0, 10));
  } catch (err) {
    console.error("Discover movies error:", err);
    res.status(500).json({ error: 'Failed to fetch discovered movies' });
  }
});

// Discover TV shows
router.get('/tv', async (req, res) => {
  try {
    const page = Math.floor(Math.random() * 10) + 1;
    const response = await fetch(
      `${TMDB_BASE_URL}/discover/tv?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc&page=${page}`
    );
    const data = await response.json();
    res.json(data.results.slice(0, 10));
  } catch (err) {
    console.error("Discover TV error:", err);
    res.status(500).json({ error: 'Failed to fetch discovered TV shows' });
  }
});

module.exports = router;
