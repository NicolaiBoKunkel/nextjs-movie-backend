const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const Rating = require('../models/Rating');

// Add or update rating
router.post('/', authenticateToken, async (req, res) => {
  const { mediaId, mediaType, rating } = req.body;
  if (!mediaId || !mediaType || !rating) {
    return res.status(400).json({ message: "Missing rating data" });
  }

  try {
    const existing = await Rating.findOne({ userId: req.user.id, mediaId, mediaType });

    if (existing) {
      existing.rating = rating;
      await existing.save();
      return res.json({ message: "Rating updated" });
    }

    const newRating = new Rating({
      userId: req.user.id,
      mediaId,
      mediaType,
      rating
    });

    await newRating.save();
    res.status(201).json({ message: "Rating added" });
  } catch (err) {
    res.status(500).json({ error: "Failed to add/update rating" });
  }
});

// Get average rating
router.get('/:mediaType/:mediaId', async (req, res) => {
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

// Delete rating
router.delete('/:mediaType/:mediaId', authenticateToken, async (req, res) => {
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

module.exports = router;
