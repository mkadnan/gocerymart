const Return = require('../models/Return');
const Order = require('../models/Order');
const { validationResult } = require('express-validator');

// Create return request
const createReturnRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { orderId, productId, productName, quantity, reason, description, returnAmount } = req.body;
    const userId = req.user.id;

    // Verify order belongs to user
    const order = await Order.findById(orderId);
    if (!order || order.user_id.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized - Order not found or does not belong to you' });
    }

    // Check if product is in the order
    const productInOrder = order.items.find(item => item.product_id.toString() === productId);
    if (!productInOrder) {
      return res.status(400).json({ message: 'Product not found in this order' });
    }

    // Check if return quantity doesn't exceed order quantity
    if (quantity > productInOrder.quantity) {
      return res.status(400).json({ message: 'Return quantity exceeds ordered quantity' });
    }

    // Create return request
    const returnRequest = new Return({
      orderId,
      userId,
      productId,
      productName,
      quantity,
      reason,
      description,
      returnAmount
    });

    await returnRequest.save();

    res.status(201).json({
      success: true,
      message: 'Return request created successfully',
      return: returnRequest
    });
  } catch (error) {
    console.error('Create return error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's returns
const getUserReturns = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    let query = { userId };
    if (status) {
      query.status = status;
    }

    const returns = await Return.find(query)
      .sort({ requestedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('orderId', 'orderNumber created_at')
      .populate('productId', 'name price');

    const total = await Return.countDocuments(query);

    res.json({
      success: true,
      count: returns.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      returns
    });
  } catch (error) {
    console.error('Get user returns error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single return request
const getReturnRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const returnRequest = await Return.findById(id)
      .populate('orderId')
      .populate('productId')
      .populate('userId', 'name email');

    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    // Check authorization - user can only view their own returns
    if (returnRequest.userId.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json({
      success: true,
      return: returnRequest
    });
  } catch (error) {
    console.error('Get return error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all returns (Admin only)
const getAllReturns = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let query = {};
    if (status) {
      query.status = status;
    }

    const returns = await Return.find(query)
      .sort({ requestedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'name email phone')
      .populate('orderId', 'orderNumber total created_at')
      .populate('productId', 'name price');

    const total = await Return.countDocuments(query);

    res.json({
      success: true,
      count: returns.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      returns
    });
  } catch (error) {
    console.error('Get all returns error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update return status (Admin only)
const updateReturnStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, refundAmount, trackingNumber } = req.body;

    const returnRequest = await Return.findById(id);
    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    const validStatuses = ['requested', 'approved', 'rejected', 'shipped', 'received', 'refunded', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Update status
    returnRequest.status = status;
    if (adminNotes) returnRequest.adminNotes = adminNotes;
    if (refundAmount !== undefined) returnRequest.refundAmount = refundAmount;
    if (trackingNumber) returnRequest.trackingNumber = trackingNumber;

    // Set timestamps based on status
    switch (status) {
      case 'approved':
        returnRequest.approvedAt = new Date();
        break;
      case 'rejected':
        returnRequest.rejectedAt = new Date();
        break;
      case 'shipped':
        returnRequest.shippedAt = new Date();
        break;
      case 'received':
        returnRequest.receivedAt = new Date();
        break;
      case 'refunded':
        returnRequest.refundedAt = new Date();
        if (!returnRequest.refundAmount) {
          returnRequest.refundAmount = returnRequest.returnAmount;
        }
        break;
    }

    await returnRequest.save();

    res.json({
      success: true,
      message: 'Return status updated successfully',
      return: returnRequest
    });
  } catch (error) {
    console.error('Update return error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cancel return request
const cancelReturnRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const returnRequest = await Return.findById(id);
    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    // Check authorization
    if (returnRequest.userId.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Can only cancel if in requested or approved status
    if (!['requested', 'approved'].includes(returnRequest.status)) {
      return res.status(400).json({ message: 'Cannot cancel return in current status' });
    }

    returnRequest.status = 'cancelled';
    await returnRequest.save();

    res.json({
      success: true,
      message: 'Return request cancelled successfully',
      return: returnRequest
    });
  } catch (error) {
    console.error('Cancel return error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createReturnRequest,
  getUserReturns,
  getReturnRequest,
  getAllReturns,
  updateReturnStatus,
  cancelReturnRequest
};
