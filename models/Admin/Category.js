const mongoose = require('mongoose');

const videoSponsorSchema = new mongoose.Schema({
  videoUrl: { type: String, required: true },
  sponsorLogo: { type: String },
  sponsorText: { type: String },
  order: { type: Number, default: 0 }
}, { _id: true });

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String },
  videoUrl: { type: String }, 
  videos: [videoSponsorSchema],
  subCategories: { type: String, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
