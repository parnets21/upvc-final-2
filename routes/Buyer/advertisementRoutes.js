const express = require('express');
const router = express.Router();
const Advertisement = require('../../models/Admin/buyerAdvertisement');
const { toAbsoluteUrl } = require('../../utils/urlHelper');

// Get all buyer advertisements for mobile app
router.get('/', async (req, res) => {
  console.log('\n[BuyerAds:GET /] =============================');
  console.log('[BuyerAds:GET /] Request from:', req.headers['origin'] || req.headers['referer'] || 'unknown');
  console.log('[BuyerAds:GET /] User-Agent:', req.headers['user-agent']);
  try {
    console.log('[BuyerAds:GET /] Querying DB...');
    const ads = await Advertisement.find().sort({ createdAt: -1 });
    console.log('[BuyerAds:GET /] DB returned', ads.length, 'documents');

    const processedAds = ads.map(ad => {
      const adObj = ad.toObject();
      if (adObj.mediaUrl) adObj.mediaUrl = toAbsoluteUrl(adObj.mediaUrl);
      if (adObj.sponsorLogo) adObj.sponsorLogo = toAbsoluteUrl(adObj.sponsorLogo);
      return adObj;
    });

    processedAds.forEach((ad, i) => {
      console.log(`[BuyerAds:GET /] Ad[${i}]:`, {
        id: ad._id, title: ad.title, type: ad.type,
        mediaUrl: ad.mediaUrl, sponsorLogo: ad.sponsorLogo,
      });
    });

    const responseBody = { success: true, advertisements: processedAds };
    console.log('[BuyerAds:GET /] Sending response key: "advertisements", count:', processedAds.length);
    console.log('[BuyerAds:GET /] =============================\n');
    res.status(200).json(responseBody);
  } catch (error) {
    console.error('[BuyerAds:GET /] ERROR:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get advertisements by type (featured/latest/trending)
router.get('/:type', async (req, res) => {
  const { type } = req.params;
  console.log('\n[BuyerAds:GET /:type] type =', type);
  try {
    let query = {};
    if (type === 'featured') query.isFeatured = true;
    else if (type === 'trending') query.likes = { $gte: 100 };
    console.log('[BuyerAds:GET /:type] DB query:', JSON.stringify(query));

    const ads = await Advertisement.find(query).sort({ createdAt: -1 });
    console.log('[BuyerAds:GET /:type] DB returned', ads.length, 'documents');

    const processedAds = ads.map(ad => {
      const adObj = ad.toObject();
      if (adObj.mediaUrl) adObj.mediaUrl = toAbsoluteUrl(adObj.mediaUrl);
      if (adObj.sponsorLogo) adObj.sponsorLogo = toAbsoluteUrl(adObj.sponsorLogo);
      return adObj;
    });

    res.status(200).json({ success: true, advertisements: processedAds });
  } catch (error) {
    console.error('[BuyerAds:GET /:type] ERROR:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Toggle like on advertisement (for mobile users)
router.post('/:id/like', async (req, res) => {
  const { id } = req.params;
  console.log('[BuyerAds:POST /:id/like] id =', id);
  try {
    const { userId } = req.body;
    const ad = await Advertisement.findById(id);
    if (!ad) {
      console.warn('[BuyerAds:POST /:id/like] Ad not found:', id);
      return res.status(404).json({ success: false, message: 'Advertisement not found' });
    }

    const likeIndex = ad.likedBy.indexOf(userId);
    if (likeIndex === -1) { ad.likedBy.push(userId); ad.likes += 1; }
    else { ad.likedBy.splice(likeIndex, 1); ad.likes -= 1; }

    await ad.save();
    console.log('[BuyerAds:POST /:id/like] Updated likes:', ad.likes);
    res.status(200).json({ success: true, likes: ad.likes, isLiked: likeIndex === -1 });
  } catch (error) {
    console.error('[BuyerAds:POST /:id/like] ERROR:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;