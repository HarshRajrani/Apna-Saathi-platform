const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const { protect } = require('../middleware/auth');

// @route   GET /api/businesses
// @desc    Get all businesses
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const businesses = await Business.find({ isActive: true })
      .populate('owner', 'name email')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: businesses.length,
      data: businesses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
