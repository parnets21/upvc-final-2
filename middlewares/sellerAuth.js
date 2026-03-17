// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const Seller = require('../models/Seller/Seller');

exports.authenticateSeller = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token required'
      });
    }

    // Verify token
    console.log("decoded")
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Check if user still exists
    const seller = await Seller.findById({_id : decoded.sellerId});
    if (!seller) {
      return res.status(401).json({
        success: false,
        message: 'Seller not found'
      });
    }

    // Block access only if seller account is still pending approval
    if (seller.status === 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Your account is under verification. You will be notified once approved.',
        status: seller.status
      });
    }

    // Block access if seller account was rejected or blocked
    if (seller.status === 'rejected' || seller.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: seller.status === 'blocked'
          ? 'Your account has been blocked. Please contact support.'
          : 'Your application was not approved. Please contact support.',
        status: seller.status
      });
    }

    // Attach user to request object
    req.seller = seller;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token failed',
      error: error.message
    });
  }
};