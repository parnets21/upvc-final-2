const express = require('express');
const {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory
} = require('../../controllers/Admin/categoryController');
const authenticateAdmin = require('../../middlewares/adminAuth');
const upload = require('../../middlewares/upload');

const router = express.Router();
router.get('/', getAllCategories);
router.use(authenticateAdmin);

// Categories can now have multiple videos with sponsor logos
router.post('/', upload('video').any(), createCategory);
router.patch('/:id', upload('video').any(), updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;
