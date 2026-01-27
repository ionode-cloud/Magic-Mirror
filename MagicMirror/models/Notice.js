const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: String,
  content: String,
  imageUrl: String,
  priority: { type: Number, default: 1 }, // 1: Low, 2: Medium, 3: High
  date: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

module.exports = mongoose.model('Notice', noticeSchema); 