const express = require('express');
const { body } = require('express-validator');
const {
  createReturnRequest,
  getUserReturns,
  getReturnRequest,
  getAllReturns,
  updateReturnStatus,
  cancelReturnRequest
} = require('../controllers/returnController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// User routes (protected)
router.post(
  '/',
  protect,
  [
    body('orderId').notEmpty().withMessage('Order ID is required'),
    body('productId').notEmpty().withMessage('Product ID is required'),
    body('productName').trim().notEmpty().withMessage('Product name is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('reason').isIn([
      'damaged',
      'defective',
      'not_as_described',
      'wrong_item',
      'changed_mind',
      'expired',
      'poor_quality',
      'other'
    ]).withMessage('Invalid reason'),
    body('returnAmount').isFloat({ min: 0 }).withMessage('Return amount must be valid'),
  ],
  createReturnRequest
);

router.get('/', protect, getUserReturns);
router.get('/:id', protect, getReturnRequest);
router.put('/:id/cancel', protect, cancelReturnRequest);

// Admin routes
router.get('/admin/all', protect, adminOnly, getAllReturns);
router.put('/:id/status', protect, adminOnly, updateReturnStatus);

module.exports = router;
