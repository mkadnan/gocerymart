const express = require('express');
const { body } = require('express-validator');
const {
  getCategories,
  getCategoriesDetailed,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getCategories);
router.get('/detailed', getCategoriesDetailed);

// Admin only routes - must come after public routes
router.post('/', protect, adminOnly, [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters')
], createCategory);

router.put('/:id', protect, adminOnly, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters')
], updateCategory);

router.delete('/:id', protect, adminOnly, deleteCategory);

module.exports = router;
