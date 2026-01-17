const express = require('express');
const router = express.Router();
const Advertisement = require('../../models/Admin/buyerAdvertisement');
const { toAbsoluteUrl } = require('../../utils/urlHelper');

// Get all buyer advertisements for mobile app
router.get('/', async (req, res) => {
  try {
    console.log('[MobileAPI] Fetching buyer advertisements for mobile');
    const ads = await Advertisement.find().sort({ createdAt: -1 });
    console.log('[MobileAPI] Found', ads.length, 'advertisements');
    
    // Process URLs through URL helper to ensure clean URLs
    const processedAds = ads.map(ad => {
      const adObj = ad.toObject();
      if (adObj.mediaUrl) {
        adObj.mediaUrl = toAbsoluteUrl(adObj.mediaUrl);
      }
      if (adObj.sponsorLogo) {
        adObj.sponsorLogo = toAbsoluteUrl(adObj.sponsorLogo);
      }
      return adObj;
    });
    
    processedAds.forEach((ad, index) => {
      console.log(`[MobileAPI] Ad ${index + 1}:`, {
        id: ad._id,
        title: ad.title,
        type: ad.type,
        mediaUrl: ad.mediaUrl,
        sponsorLogo: ad.sponsorLogo,
        sponsorText: ad.sponsorText,
        defaultMuted: ad.defaultMuted
      });
    });
    res.status(200).json({ success: true, advertisements: processedAds });
  } catch (error) {
    console.error('[MobileAPI] Error fetching buyer advertisements:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get advertisements by type (featured/latest/trending)
router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    let query = {};
    
    if (type === 'featured') {
      query.isFeatured = true;
    } else if (type === 'trending') {
      query.likes = { $gte: 100 }; // Example threshold for trending
    }
    
    const ads = await Advertisement.find(query).sort({ createdAt: -1 });
    
    // Process URLs through URL helper to ensure clean URLs
    const processedAds = ads.map(ad => {
      const adObj = ad.toObject();
      if (adObj.mediaUrl) {
        adObj.mediaUrl = toAbsoluteUrl(adObj.mediaUrl);
      }
      if (adObj.sponsorLogo) {
        adObj.sponsorLogo = toAbsoluteUrl(adObj.sponsorLogo);
      }
      return adObj;
    });
    
    res.status(200).json({ success: true, advertisements: processedAds });
  } catch (error) {
    console.error('Error fetching buyer advertisements by type:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Toggle like on advertisement (for mobile users)
router.post('/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const ad = await Advertisement.findById(id);
    if (!ad) {
      return res.status(404).json({ success: false, message: 'Advertisement not found' });
    }

    const likeIndex = ad.likedBy.indexOf(userId);
    if (likeIndex === -1) {
      ad.likedBy.push(userId);
      ad.likes += 1;
    } else {
      ad.likedBy.splice(likeIndex, 1);
      ad.likes -= 1;
    }

    await ad.save();
    res.status(200).json({ success: true, likes: ad.likes, isLiked: likeIndex === -1 });
  } catch (error) {
    console.error('Error toggling like on advertisement:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;