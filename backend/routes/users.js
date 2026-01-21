const express = require('express');
const { 
  getAllUsers, 
  getUserDetails, 
  updateUserRole, 
  deleteUser, 
  getWishlist, 
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  addToWishlist,
  removeFromWishlist
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Protected routes - these must come BEFORE parameterized routes
router.get('/wishlist', protect, getWishlist);
router.post('/wishlist', protect, addToWishlist);
router.delete('/wishlist/:productId', protect, removeFromWishlist);

router.get('/addresses', protect, getAddresses);
router.post('/addresses', protect, addAddress);
router.put('/addresses/:addressId', protect, updateAddress);
router.delete('/addresses/:addressId', protect, deleteAddress);

// Admin only routes
router.use(protect);
router.use(adminOnly);

// Get all users
router.get('/', getAllUsers);

// Get single user details
router.get('/:id', getUserDetails);

// Update user role
router.put('/:id/role', updateUserRole);

// Delete user
router.delete('/:id', deleteUser);

module.exports = router;
