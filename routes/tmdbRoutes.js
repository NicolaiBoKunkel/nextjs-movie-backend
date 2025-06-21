const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { tmdbFetcher, TMDB_BASE_URL, API_KEY } = require('../utils/tmdbFetcher');

// Popular & Top Rated
router.get('/movies/popular', (req, res) => tmdbFetcher('/movie/popular', req, res));
router.get('/movies/top-rated', (req, res) => tmdbFetcher('/movie/top_rated', req, res));
router.get('/tv/popular', (req, res) => tmdbFetcher('/tv/popular', req, res));
router.get('/tv/top-rated', (req, res) => tmdbFetcher('/tv/top_rated', req, res));
router.get('/people/popular', (req, res) => tmdbFetcher('/person/popular', req, res));

// Credits
router.get('/movies/:id/credits', (req, res) => tmdbFetcher(`/movie/${req.params.id}/credits`, req, res));
router.get('/tv/:id/credits', (req, res) => tmdbFetcher(`/tv/${req.params.id}/credits`, req, res));

// Trailers
router.get('/movies/:id/trailer', async (req, res) => {
  try {
    const response = await fetch(`${TMDB_BASE_URL}/movie/${req.params.id}/videos?api_key=${API_KEY}`);
    const data = await response.json();
    const trailer = data.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    res.json({ trailerKey: trailer?.key || null });
  } catch {
    res.status(500).json({ error: 'Failed to fetch trailer' });
  }
});

router.get('/tv/:id/trailer', async (req, res) => {
  try {
    const response = await fetch(`${TMDB_BASE_URL}/tv/${req.params.id}/videos?api_key=${API_KEY}`);
    const data = await response.json();
    const trailer = data.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    res.json({ trailerKey: trailer?.key || null });
  } catch {
    res.status(500).json({ error: 'Failed to fetch trailer' });
  }
});

// Details
router.get('/movies/:id/details', async (req, res) => {
  try {
    const response = await fetch(`${TMDB_BASE_URL}/movie/${req.params.id}?api_key=${API_KEY}&language=en-US`);
    const data = await response.json();
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to fetch movie details' });
  }
});

router.get('/tv/:id/details', async (req, res) => {
  try {
    const response = await fetch(`${TMDB_BASE_URL}/tv/${req.params.id}?api_key=${API_KEY}&language=en-US`);
    const data = await response.json();
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to fetch TV show details' });
  }
});

router.get('/people/:id/details', async (req, res) => {
  try {
    const response = await fetch(`${TMDB_BASE_URL}/person/${req.params.id}?api_key=${API_KEY}&language=en-US`);
    const data = await response.json();
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to fetch person details' });
  }
});

router.get('/people/:id/credits', async (req, res) => {
  try {
    const response = await fetch(`${TMDB_BASE_URL}/person/${req.params.id}/combined_credits?api_key=${API_KEY}&language=en-US`);
    const data = await response.json();
    res.json(data.cast || []);
  } catch {
    res.status(500).json({ error: 'Failed to fetch person credits' });
  }
});

// Search
router.get('/search', async (req, res) => {
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

module.exports = router;
