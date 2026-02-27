const mongoose = require('mongoose');
const { Schema } = mongoose;

// Schema for Price Comparison Data
const priceComparisonSchema = new Schema({
  category: {
    type: String,
    required: true,
    trim: true
  },
  economy: {
    type: String,
    required: true,
    trim: true
  },
  midRange: {
    type: String,
    required: true,
    trim: true
  },
  premium: {
    type: String,
    required: true,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Schema for Price Page Content (header subtitle text and pricing info)
const pricePageContentSchema = new Schema({
  headerSubtitle: {
    type: String,
    required: true,
    default: 'When you are investing in uPVC windows & doors the price can vary based on several important factors- heres what goes into it'
  },
  economyPrice: {
    type: String,
    default: 'Starts at Rs. 350+GST'
  },
  midPremiumPrice: {
    type: String,
    default: 'Starts at Rs. 450+GST'
  },
  premiumPrice: {
    type: String,
    default: 'Starts at Rs. 550+GST'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to update the 'updatedAt' field before saving
priceComparisonSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

pricePageContentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Models
const PriceComparison = mongoose.model('PriceComparison', priceComparisonSchema);
const PricePageContent = mongoose.model('PricePageContent', pricePageContentSchema);

module.exports = {
  PriceComparison,
  PricePageContent
};
