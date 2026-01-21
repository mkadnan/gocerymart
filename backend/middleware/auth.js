const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ----------------  Middleware ----------------
const protect = async (req, res, next) => {
  let token = req.cookies.token;
  
  // Also check Authorization header
  if (!token && req.headers.authorization) {
    token = req.headers.authorization.replace('Bearer ', '');
  }
  
  if (!token) return res.status(401).json({ message: 'Not authorized, no token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password_hash');
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') next();
  else return res.status(403).json({ message: 'Admin access only' });
};

// ----------------  Exports ----------------
module.exports = {
  protect,
  adminOnly
};
