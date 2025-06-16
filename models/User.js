const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  favorites: [
    {
      mediaId: { type: Number, required: true },
      mediaType: { type: String, enum: ['movie', 'tv'], required: true }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
