const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  mediaId: { type: Number, required: true },
  mediaType: { type: String, enum: ['movie', 'tv'], required: true },
  text: { type: String, required: true, maxlength: 1000 }
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);