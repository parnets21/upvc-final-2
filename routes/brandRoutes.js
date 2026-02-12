const express = require('express');
const router = express.Router();
const brandController = require('../controllers/Admin/brandController');
const adminAuth = require('../middlewares/adminAuth');

// Public routes (for seller registration)
router.get('/all', brandController.getAllActiveBrands);
router.get('/category/:categoryId', brandController.getBrandsByCategory);

// Admin routes (protected)
router.get('/', adminAuth, brandController.getAllBrands);
router.get('/:id', adminAuth, brandController.getBrandById);
router.post('/', adminAuth, brandController.createBrand);
router.put('/:id', adminAuth, brandController.updateBrand);
router.delete('/:id', adminAuth, brandController.deleteBrand);

module.exports = router;
