const express = require('express');
const router = express.Router();
const Rider = require('../models/Rider');
const User = require('../models/User');
const Order = require('../models/Order');
const PayoutRequest = require('../models/PayoutRequest');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/riders/me
// @desc    Get current rider profile
// @access  Private (Rider)
router.get('/me', protect, async (req, res) => {
  try {
    const rider = await Rider.findOne({ user: req.user._id })
      .populate('user', 'name email')
      .populate({
        path: 'activeOrders',
        populate: { path: 'business', select: 'name type phone address' },
      });

    if (!rider) {
      return res.status(404).json({ success: false, message: 'Rider profile not found' });
    }

    res.status(200).json({ success: true, data: rider });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/riders
// @desc    Get all riders (filterable by status, zone)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, zone, limit = 50 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (zone) query.zone = zone;

    const riders = await Rider.find(query)
      .populate('user', 'name email')
      .populate('activeOrders', 'orderNumber status drop')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: riders.length,
      data: riders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/riders/available
// @desc    Get available riders for assignment
// @access  Private
router.get('/available', protect, async (req, res) => {
  try {
    const riders = await Rider.find({
      status: 'available',
      isActive: true,
    })
      .populate('user', 'name email')
      .sort({ rating: -1 });

    res.status(200).json({
      success: true,
      count: riders.length,
      data: riders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ────────────────────────────────────────────────────────────────
// @route   GET /api/riders/earnings
// @desc    Get rider earnings — real aggregation from delivered orders
// @access  Private (rider)
// ────────────────────────────────────────────────────────────────
router.get('/earnings', protect, authorize('rider'), async (req, res) => {
  try {
    const rider = await Rider.findOne({ user: req.user._id });
    if (!rider) {
      return res.status(404).json({ success: false, message: 'Rider not found' });
    }

    // ── Today's earnings ──
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayResult = await Order.aggregate([
      {
        $match: {
          rider: rider._id,
          status: 'delivered',
          actualDeliveryTime: { $gte: startOfDay },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$deliveryFee' },
          count: { $sum: 1 },
        },
      },
    ]);

    const todayEarnings = todayResult.length > 0 ? todayResult[0].total : 0;
    const deliveriesToday = todayResult.length > 0 ? todayResult[0].count : 0;

    // ── Total lifetime earnings ──
    const totalResult = await Order.aggregate([
      {
        $match: {
          rider: rider._id,
          status: 'delivered',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$deliveryFee' },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalEarnings = totalResult.length > 0 ? totalResult[0].total : 0;
    const totalDeliveries = totalResult.length > 0 ? totalResult[0].count : 0;

    // ── Weekly breakdown (last 7 days) ──
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const weeklyResult = await Order.aggregate([
      {
        $match: {
          rider: rider._id,
          status: 'delivered',
          actualDeliveryTime: { $gte: weekStart },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$actualDeliveryTime' },
          },
          earnings: { $sum: '$deliveryFee' },
          deliveries: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill in missing days with 0
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const found = weeklyResult.find((r) => r._id === dateStr);
      weeklyData.push({
        day: dayNames[d.getDay()],
        date: dateStr,
        earnings: found ? found.earnings : 0,
        deliveries: found ? found.deliveries : 0,
      });
    }

    // ── Available balance (total - approved/processed payouts) ──
    const payoutsResult = await PayoutRequest.aggregate([
      {
        $match: {
          rider: rider._id,
          status: { $in: ['approved', 'processed'] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    const totalPayouts = payoutsResult.length > 0 ? payoutsResult[0].total : 0;
    const availableBalance = totalEarnings - totalPayouts;

    res.status(200).json({
      success: true,
      data: {
        todayEarnings,
        deliveriesToday,
        totalEarnings,
        totalDeliveries,
        availableBalance,
        totalPayouts,
        weeklyData,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ────────────────────────────────────────────────────────────────
// @route   POST /api/riders/payout-request
// @desc    Create a withdrawal/payout request
// @access  Private (rider)
// ────────────────────────────────────────────────────────────────
router.post('/payout-request', protect, authorize('rider'), async (req, res) => {
  try {
    const { amount, upiId } = req.body;

    const rider = await Rider.findOne({ user: req.user._id });
    if (!rider) {
      return res.status(404).json({ success: false, message: 'Rider not found' });
    }

    if (!amount || amount < 1) {
      return res.status(400).json({ success: false, message: 'Minimum payout amount is ₹1' });
    }

    // Check available balance
    const totalResult = await Order.aggregate([
      { $match: { rider: rider._id, status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$deliveryFee' } } },
    ]);
    const totalEarnings = totalResult.length > 0 ? totalResult[0].total : 0;

    const payoutsResult = await PayoutRequest.aggregate([
      { $match: { rider: rider._id, status: { $in: ['pending', 'approved', 'processed'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalPayouts = payoutsResult.length > 0 ? payoutsResult[0].total : 0;
    const availableBalance = totalEarnings - totalPayouts;

    if (amount > availableBalance) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: ₹${availableBalance}`,
      });
    }

    const payout = await PayoutRequest.create({
      rider: rider._id,
      amount,
      upiId: upiId || null,
    });

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted for admin review.',
      data: payout,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ────────────────────────────────────────────────────────────────
// @route   GET /api/riders/payout-requests
// @desc    Get payout request history for this rider
// @access  Private (rider)
// ────────────────────────────────────────────────────────────────
router.get('/payout-requests', protect, authorize('rider'), async (req, res) => {
  try {
    const rider = await Rider.findOne({ user: req.user._id });
    if (!rider) {
      return res.status(404).json({ success: false, message: 'Rider not found' });
    }

    const requests = await PayoutRequest.find({ rider: rider._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/riders/:id
// @desc    Get single rider with active orders
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const rider = await Rider.findById(req.params.id)
      .populate('user', 'name email')
      .populate({
        path: 'activeOrders',
        populate: { path: 'business', select: 'name type' },
      });

    if (!rider) {
      return res
        .status(404)
        .json({ success: false, message: 'Rider not found' });
    }

    res.status(200).json({ success: true, data: rider });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/riders
// @desc    Create a new rider (also creates user account)
// @access  Private (admin)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, phone, vehicleType, vehicleNumber, zone } =
      req.body;

    // Create user account for rider
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        password: password || 'rider123', // Default password
        role: 'rider',
        phone,
      });
    }

    // Create rider profile
    const rider = await Rider.create({
      user: user._id,
      name,
      phone,
      vehicleType,
      vehicleNumber,
      zone,
    });

    const populatedRider = await Rider.findById(rider._id).populate(
      'user',
      'name email'
    );

    res.status(201).json({ success: true, data: populatedRider });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PATCH /api/riders/:id/location
// @desc    Update rider GPS location (called every 10s by rider app)
// @access  Private
router.patch('/:id/location', protect, async (req, res) => {
  try {
    const { lat, lng } = req.body;

    const rider = await Rider.findByIdAndUpdate(
      req.params.id,
      {
        currentLocation: {
          type: 'Point',
          coordinates: [lng, lat], // MongoDB uses [longitude, latitude]
        },
      },
      { new: true }
    );

    if (!rider) {
      return res
        .status(404)
        .json({ success: false, message: 'Rider not found' });
    }

    // Emit Socket.io event for live tracking
    const io = req.app.get('io');
    if (io) {
      io.emit('rider:locationUpdate', {
        riderId: rider._id,
        name: rider.name,
        lat,
        lng,
        status: rider.status,
      });
    }

    res.status(200).json({ success: true, data: rider });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PATCH /api/riders/:id/status
// @desc    Toggle rider status (offline/available/busy)
// @access  Private
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;

    const rider = await Rider.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!rider) {
      return res
        .status(404)
        .json({ success: false, message: 'Rider not found' });
    }

    res.status(200).json({ success: true, data: rider });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PATCH /api/riders/status
// @desc    Toggle rider status (offline/available/busy) for logged in rider
// @access  Private (rider)
router.patch('/status', protect, authorize('rider'), async (req, res) => {
  try {
    const { status } = req.body;
    
    // Find rider by user ID
    const rider = await Rider.findOneAndUpdate(
      { user: req.user._id },
      { status },
      { new: true, runValidators: true }
    );

    if (!rider) {
      return res.status(404).json({ success: false, message: 'Rider not found' });
    }

    res.status(200).json({ success: true, data: rider });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/riders/:id
// @desc    Edit rider details
// @access  Private (admin)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, phone, vehicleType, vehicleNumber, zone, maxBatchSize } =
      req.body;

    const rider = await Rider.findByIdAndUpdate(
      req.params.id,
      { name, phone, vehicleType, vehicleNumber, zone, maxBatchSize },
      { new: true, runValidators: true }
    ).populate('user', 'name email');

    if (!rider) {
      return res
        .status(404)
        .json({ success: false, message: 'Rider not found' });
    }

    res.status(200).json({ success: true, data: rider });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PATCH /api/riders/accept-batch
// @desc    Accept a batch of orders
// @access  Private (Rider)
router.patch('/accept-batch', protect, async (req, res) => {
  try {
    const { batchId } = req.body;
    
    if (req.user.role !== 'rider') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const rider = await Rider.findOne({ user: req.user._id });
    if (!rider) return res.status(404).json({ success: false, message: 'Rider profile not found' });

    // Find all pending orders for this batch
    const orders = await Order.find({ batchId, status: 'pending' });
    
    if (orders.length === 0) {
      return res.status(400).json({ success: false, message: 'Batch no longer available' });
    }

    // Check capacity
    if (rider.activeOrders.length + orders.length > rider.maxBatchSize) {
      return res.status(400).json({ success: false, message: 'Batch exceeds max capacity' });
    }

    const orderIds = orders.map(o => o._id);

    // Update orders
    await Order.updateMany(
      { _id: { $in: orderIds } },
      { $set: { status: 'assigned', rider: rider._id } }
    );

    // Update rider
    rider.activeOrders.push(...orderIds);
    rider.status = rider.activeOrders.length >= rider.maxBatchSize ? 'busy' : 'busy'; // Always busy if assigned
    await rider.save();

    // Emit events
    const io = req.app.get('io');
    if (io) {
      orders.forEach(order => {
        io.emit('order:assigned', {
          orderId: order._id,
          rider: { id: rider._id, name: rider.name },
        });
        io.emit('order:statusChanged', {
          orderId: order._id,
          status: 'assigned',
        });
      });
    }

    res.status(200).json({ success: true, message: 'Batch accepted successfully', data: rider.activeOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
