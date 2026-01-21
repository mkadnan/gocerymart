const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { requestOtp, verifyOtp } = require('../controllers/otpController');
const { register: authRegister, login: authLogin, getMe, updateProfile } = require('../controllers/authController');

const router = express.Router();

// ---------------- JWT ----------------
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// ---------------- OTP Setup ----------------
// Removed duplicate transporter config - using otpController instead

// ---------------- Register Route ----------------
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    // Save user (without password initially, will be set after OTP verification)
    const user = await User.create({
      name,
      email,
      password_hash: password,
    });

    // Use the requestOtp function to send OTP
    await requestOtp({ body: { email } }, res);
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// ---------------- Verify OTP ----------------
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

    // OTP matched → clear OTP
    user.otp = undefined;
    await user.save();

    const token = generateToken(user._id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({ 
      success: true,
      message: 'Registration successful', 
      role: user.role,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        contact: user.contact,
        role: user.role,
        points_balance: user.points_balance,
        referral_code: user.referral_code
      }
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
});

// ---------------- Login Route ----------------
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log("Login attempt:", email);

    let user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    // Generate referral code if user doesn't have one
    if (!user.referral_code) {
      let referralCode;
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        const existingUser = await User.findOne({ referral_code: referralCode });
        if (!existingUser) {
          isUnique = true;
        }
        attempts++;
      }
      user.referral_code = referralCode || user._id.toString().substring(0, 8).toUpperCase();
      await user.save();
    }

    const token = generateToken(user._id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    console.log("Login successful for:", user.email);

    res.json({
      message: 'Login successful',
      role: user.role,
      user: { 
        id: user._id, 
        name: user.name,
        email: user.email, 
        contact: user.contact,
        role: user.role,
        points_balance: user.points_balance,
        referral_code: user.referral_code
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// ---------------- Middleware ----------------
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

// ---------------- Routes ----------------
router.post('/send-otp', requestOtp);
router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);

// ---------------- Export ----------------
module.exports = { router, protect, adminOnly };
