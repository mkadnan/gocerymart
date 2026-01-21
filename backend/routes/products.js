// routes/products.js

const express = require('express');
const { body } = require('express-validator');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories
} = require('../controllers/productController.js');

const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

const productValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  body('price')
    .toFloat()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('stock')
    .toInt()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot be more than 500 characters')
];

// Public Routes
router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/:id', getProduct);

// Protected Routes (Admin Only)
router.post('/', protect, adminOnly, upload.single('image'), productValidation, createProduct);
router.put('/:id', protect, adminOnly, upload.single('image'), productValidation, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

console.log('getProducts:', getProducts);
console.log('createProduct:', createProduct);

module.exports = router;
