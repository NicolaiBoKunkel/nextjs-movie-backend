const fetch = require('node-fetch');

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_API_KEY;

const tmdbFetcher = async (endpoint, req, res) => {
  const page = req.query.page || 1;

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

module.exports = { tmdbFetcher, TMDB_BASE_URL, API_KEY };
