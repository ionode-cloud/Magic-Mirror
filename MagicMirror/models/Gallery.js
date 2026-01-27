const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  name: String,
  url: String,
  priority: { type: Number, default: 1 }, // 1: Low, 2: Medium, 3: High
  date: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

module.exports = mongoose.model('Gallery', gallerySchema); 