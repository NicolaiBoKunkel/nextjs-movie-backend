const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mediaId: { type: Number, required: true },
  mediaType: { type: String, enum: ['movie', 'tv'], required: true },
  rating: { type: Number, required: true, min: 1, max: 10 }
}, { timestamps: true });

ratingSchema.index({ userId: 1, mediaId: 1, mediaType: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);
