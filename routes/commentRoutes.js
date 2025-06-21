const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const Comment = require('../models/Comment');

// Add comment
router.post('/', authenticateToken, async (req, res) => {
  const { mediaId, mediaType, text } = req.body;

  if (!mediaId || !mediaType || !text) {
    return res.status(400).json({ message: "Missing comment data" });
  }

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

// Get comments for a media item
router.get('/:mediaType/:mediaId', async (req, res) => {
  const { mediaType, mediaId } = req.params;

  try {
    const comments = await Comment.find({ mediaId, mediaType })
      .sort({ createdAt: -1 })
      .select('username text createdAt userId');

    res.json(comments);
  } catch {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// Delete a comment
router.delete('/:commentId', authenticateToken, async (req, res) => {
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

module.exports = router;
