const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const User = require('../models/User');
const Rating = require('../models/Rating');
const Comment = require('../models/Comment');

// Add to favorites
router.post('/favorites', authenticateToken, async (req, res) => {
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

// Remove from favorites
router.delete('/favorites/:mediaId/:mediaType', authenticateToken, async (req, res) => {
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

// Get all favorites
router.get('/favorites', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ favorites: user.favorites });
  } catch (err) {
    res.status(500).json({ error: "Failed to get favorites" });
  }
});

// Delete account (and related data)
router.delete('/delete', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    await User.findByIdAndDelete(userId);
    await Rating.deleteMany({ userId });
    await Comment.deleteMany({ userId });

    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error("Error deleting account:", err);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

module.exports = router;
