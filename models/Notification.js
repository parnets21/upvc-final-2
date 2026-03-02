const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  userType: {
    type: String,
    enum: ['buyer', 'seller'],
    required: true
  },
  // Optional: specific user (if null, it's a broadcast to all users of that type)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'userModel',
    default: null
  },
  userModel: {
    type: String,
    enum: ['User', 'Seller'],
    default: null
  },
  // Notification metadata
  type: {
    type: String,
    default: 'admin_notification'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  // For tracking which users have seen broadcast notifications
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'userModel'
  }]
}, {
  timestamps: true
});

// Index for faster queries
notificationSchema.index({ userType: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
