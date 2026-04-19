const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Rider = require('../models/Rider');

// @route   GET /api/public/track/:trackingId
// @desc    Public customer tracking - NO AUTH REQUIRED
// @access  Public
router.get('/track/:trackingId', async (req, res) => {
  try {
    const { trackingId } = req.params;

    const order = await Order.findOne({ trackingId })
      .populate('business', 'name type')
      .populate('rider', 'name currentLocation status');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Tracking ID not found. Please check and try again.',
      });
    }

    // Security: Return ONLY the fields the customer needs - never expose full order data
    const publicData = {
      trackingId: order.trackingId,
      orderNumber: order.orderNumber,
      status: order.status,
      merchantName: order.business?.name || 'Store',
      merchantType: order.business?.type || 'other',
      batchId: order.batchId,
      destinationCoords: order.drop.location.coordinates, // [lng, lat]
      destinationAddress: order.drop.address,
      recipientName: order.drop.contactName,
      statusHistory: order.statusHistory.map((h) => ({
        status: h.status,
        timestamp: h.timestamp,
      })),
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      createdAt: order.createdAt,
      // Rider info: first name only + live location (if assigned)
      rider: order.rider
        ? {
            firstName: order.rider.name.split(' ')[0],
            currentLocation: order.rider.currentLocation,
            status: order.rider.status,
          }
        : null,
    };

    res.status(200).json({ success: true, data: publicData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
