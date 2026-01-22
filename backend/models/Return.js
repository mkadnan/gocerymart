const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  reason: {
    type: String,
    enum: [
      'damaged',
      'defective',
      'not_as_described',
      'wrong_item',
      'changed_mind',
      'expired',
      'poor_quality',
      'other'
    ],
    required: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  returnAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['requested', 'approved', 'rejected', 'shipped', 'received', 'refunded', 'cancelled'],
    default: 'requested'
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  refundAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  refundDate: {
    type: Date
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  },
  shippedAt: {
    type: Date
  },
  receivedAt: {
    type: Date
  },
  refundedAt: {
    type: Date
  },
  trackingNumber: {
    type: String
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
returnSchema.index({ userId: 1, createdAt: -1 });
returnSchema.index({ orderId: 1 });
returnSchema.index({ status: 1 });

module.exports = mongoose.model('Return', returnSchema);
