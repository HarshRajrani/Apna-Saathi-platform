const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Business = require('../models/Business');
const Rider = require('../models/Rider');
const { protect } = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register a new user (Legacy)
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
    });

    // Generate token
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        businessId: user.businessId,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   POST /api/auth/signup
// @desc    Signup for Merchant or Rider
// @access  Public
router.post('/signup', async (req, res) => {
  try {
    const { 
      name, email, password, role, phone, 
      businessName, businessType, address, 
      vehicleType, vehicleNumber 
    } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Please provide email, password, and role.' });
    }

    if (!['business', 'rider'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role for signup.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // 1. Create the user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      phone,
    });

    // 2. Create the associated profile based on role
    if (role === 'business') {
      const newBusiness = await Business.create({
        owner: user._id,
        name: businessName || `${name}'s Business`,
        type: businessType || 'other',
        phone,
        address: address || {
          street: 'Platform HQ',
          area: 'Digital',
          city: 'Cloud',
          pincode: '000000',
          location: { type: 'Point', coordinates: [77.209, 28.6139] }
        },
        plan: 'daily',
        isPaid: false,
        subscriptionStatus: 'trial',
      });
      user.businessId = newBusiness._id;
      await user.save();
    } else if (role === 'rider') {
      await Rider.create({
        user: user._id,
        name,
        phone,
        vehicleType: vehicleType || 'bike',
        vehicleNumber: vehicleNumber || '',
        status: 'offline',
      });
    }

    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        businessId: user.businessId,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login user & return JWT token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email.toLowerCase();

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password',
      });
    }

    // Check for user (include password for comparison)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        businessId: user.businessId,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get logged in user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;

