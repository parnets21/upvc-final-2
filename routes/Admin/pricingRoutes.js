const express = require('express');
const router = express.Router();
const upload = require('../../middlewares/upload');

const {
  createVideoPrice,getAllVideoPrices,getVideoPriceById,updateVideoPrice,deleteVideoPrice,
  createPriceHeading,getAllPriceHeadings,getPriceHeadingById,updatePriceHeading,deletePriceHeading
} = require('../../controllers/Admin/pricingController');

const {
  createPriceComparison,
  getAllPriceComparisons,
  getPriceComparisonById,
  updatePriceComparison,
  deletePriceComparison,
  getPricePageContent,
  updatePricePageContent
} = require('../../controllers/Admin/priceComparisonController');

// Video pricing routes
router.post('/video', 
  // Use strict video validation for pricing videos
  upload.pricingVideo().fields([
    { name: 'video', maxCount: 1 },
    { name: 'sponsorLogo', maxCount: 1 }
  ]),
  createVideoPrice);
router.get('/video', getAllVideoPrices);
router.get('/video/:id', getVideoPriceById);
router.put('/video/:id', 
  upload.pricingVideo().fields([
    { name: 'video', maxCount: 1 },
    { name: 'sponsorLogo', maxCount: 1 }
  ]),
  updateVideoPrice);
router.delete('/video/:id', deleteVideoPrice);

// Heading routes
router.post('/heading', upload('heading', ['image/*']).single('image'), createPriceHeading);
router.get('/heading',getAllPriceHeadings);
router.get('/heading/:id', getPriceHeadingById);
router.put('/heading/:id', upload('heading', ['image/*']).single('image'), updatePriceHeading);
router.delete('/heading/:id', deletePriceHeading);

// Price comparison routes
router.post('/comparison', createPriceComparison);
router.get('/comparison', getAllPriceComparisons);
router.get('/comparison/:id', getPriceComparisonById);
router.put('/comparison/:id', updatePriceComparison);
router.delete('/comparison/:id', deletePriceComparison);

// Price page content routes
router.get('/content', getPricePageContent);
router.put('/content', updatePricePageContent);

module.exports = router;
