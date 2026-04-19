const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Rider = require('../models/Rider');
const Business = require('../models/Business');
const { protect, authorize } = require('../middleware/auth');
const checkSubscription = require('../middleware/checkSubscription');

// @route   GET /api/orders
// @desc    Get all orders (filterable by status, riderId, date)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, riderId, date, limit = 50 } = req.query;
    const query = {};

    if (req.user.role === 'business') {
      query.business = req.user.businessId;
    }

    if (status) query.status = status;
    if (riderId) query.rider = riderId;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }

    const orders = await Order.find(query)
      .populate('business', 'name type phone')
      .populate('rider', 'name phone vehicleType status')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/orders/stats
// @desc    Get today's order stats for dashboard
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayFilter = { createdAt: { $gte: today, $lt: tomorrow } };
    
    if (req.user.role === 'business') {
      todayFilter.business = req.user.businessId;
    }

    const [totalToday, pending, assigned, inTransit, delivered, failed] =
      await Promise.all([
        Order.countDocuments(todayFilter),
        Order.countDocuments({ ...todayFilter, status: 'pending' }),
        Order.countDocuments({ ...todayFilter, status: 'assigned' }),
        Order.countDocuments({
          ...todayFilter,
          status: { $in: ['picked_up', 'in_transit'] },
        }),
        Order.countDocuments({ ...todayFilter, status: 'delivered' }),
        Order.countDocuments({ ...todayFilter, status: 'failed' }),
      ]);

    // Calculate today's revenue from delivered orders
    const revenueResult = await Order.aggregate([
      {
        $match: {
          ...todayFilter,
          status: 'delivered',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$deliveryFee' },
        },
      },
    ]);

    const revenueToday = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Active riders count
    const activeRiders = await Rider.countDocuments({
      status: { $in: ['available', 'busy'] },
    });

    res.status(200).json({
      success: true,
      data: {
        totalToday,
        pending,
        assigned,
        inTransit,
        delivered,
        failed,
        revenueToday,
        activeRiders,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/orders/batches/available
// @desc    Get available batches for riders
// @access  Private
router.get('/batches/available', protect, async (req, res) => {
  try {
    const unbatchedPending = await Order.find({ status: 'pending', batchId: null });
    if (unbatchedPending.length > 0) {
      // Group by businessId to prevent data leakage between unique merchants
      const businessGroups = {};
      unbatchedPending.forEach(o => {
        const bizStr = o.business ? o.business.toString() : 'unknown';
        if (!businessGroups[bizStr]) businessGroups[bizStr] = [];
        businessGroups[bizStr].push(o._id);
      });

      const bulkOps = Object.keys(businessGroups).map(bizId => {
        const suffix = bizId === 'unknown' ? 'UNK' : bizId.slice(-6).toUpperCase();
        const bid = `BATCH-${suffix}-${Date.now()}`;
        return {
          updateMany: {
            filter: { _id: { $in: businessGroups[bizId] } },
            update: { $set: { batchId: bid } }
          }
        };
      });

      if (bulkOps.length > 0) {
        await Order.bulkWrite(bulkOps);
      }
    }

    const pendingOrders = await Order.find({ status: 'pending', batchId: { $ne: null } })
      .populate('business', 'name address');

    // Group by batchId
    const batches = {};
    pendingOrders.forEach(order => {
      if (!batches[order.batchId]) {
        batches[order.batchId] = {
          batchId: order.batchId,
          orderCount: 0,
          totalEarnings: 0,
          orders: [],
          primaryArea: order.pickup.address.split(',')[0] || 'Unknown'
        };
      }
      batches[order.batchId].orderCount += 1;
      batches[order.batchId].totalEarnings += (order.deliveryFee || 0);
      batches[order.batchId].orders.push(order);
    });

    const activeBatches = Object.values(batches).map(batch => ({
      ...batch,
      totalDistance: `${(batch.orderCount * 2.5).toFixed(1)}`, // Mock distance
      stopsCount: `${batch.orderCount} Pickups, ${batch.orderCount} Drops`
    }));

    res.status(200).json({ success: true, count: activeBatches.length, data: activeBatches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('business', 'name type phone address')
      .populate('rider', 'name phone vehicleType currentLocation status');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private (subscription required for business users)
router.post('/', protect, checkSubscription, async (req, res) => {
  try {
    if (req.user.role === 'business') {
      // Auto-onboard fallback: If the user doesn't have a businessId yet (e.g., brand new registration),
      // instantly generate a placeholder Business for them.
      if (!req.user.businessId) {
        const newBusiness = await Business.create({
          owner: req.user._id,
          name: `${req.user.name}'s Business`,
          type: 'other',
          phone: req.user.phone,
          address: {
            street: 'Platform HQ',
            area: 'Digital',
            city: 'Cloud',
            pincode: '000000',
            location: { type: 'Point', coordinates: [77.209, 28.6139] } // Default fallback
          },
          plan: 'daily',
          isPaid: true
        });

        // Save it to the user
        req.user.businessId = newBusiness._id;
        await req.user.save();
      }
      
      req.body.business = req.user.businessId;
    }
    
    // Generate 4-digit OTP
    req.body.otp = Math.floor(1000 + Math.random() * 9000).toString();

    const order = await Order.create(req.body);

    const populatedOrder = await Order.findById(order._id)
      .populate('business', 'name type phone')
      .populate('rider', 'name phone vehicleType');

    // Emit Socket.io event for new order
    const io = req.app.get('io');
    if (io) {
      io.emit('order:new', populatedOrder);
    }

    // Increment business delivery count
    await Business.findByIdAndUpdate(order.business, {
      $inc: { deliveriesThisMonth: 1, totalDeliveries: 1 },
    });

    res.status(201).json({ success: true, data: populatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PATCH /api/orders/:id/assign
// @desc    Assign a rider to an order
// @access  Private (admin)
router.patch('/:id/assign', protect, authorize('admin'), async (req, res) => {
  try {
    const { riderId } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const rider = await Rider.findById(riderId);
    if (!rider) {
      return res.status(404).json({ success: false, message: 'Rider not found' });
    }

    if (rider.status !== 'available' && rider.activeOrders.length >= rider.maxBatchSize) {
      return res.status(400).json({
        success: false,
        message: 'Rider is not available or has max orders',
      });
    }

    // Update order
    order.rider = riderId;
    order.status = 'assigned';
    await order.save();

    // Update rider
    rider.activeOrders.push(order._id);
    if (rider.activeOrders.length >= rider.maxBatchSize) {
      rider.status = 'busy';
    }
    await rider.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('business', 'name type phone')
      .populate('rider', 'name phone vehicleType');

    // Emit Socket.io event
    const io = req.app.get('io');
    if (io) {
      io.emit('order:assigned', {
        orderId: order._id,
        rider: { id: rider._id, name: rider.name },
      });
    }

    res.status(200).json({ success: true, data: populatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PATCH /api/orders/:id/status
// @desc    Update order status
// @access  Private
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status, note } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status;

    // Set actual delivery time if delivered
    if (status === 'delivered') {
      order.actualDeliveryTime = new Date();

      // Update rider — remove order from activeOrders
      if (order.rider) {
        const rider = await Rider.findById(order.rider);
        if (rider) {
          rider.activeOrders = rider.activeOrders.filter(
            (id) => id.toString() !== order._id.toString()
          );
          rider.totalDeliveries += 1;
          rider.earningsToday += order.deliveryFee || 0;
          rider.earningsTotal += order.deliveryFee || 0;
          if (rider.activeOrders.length === 0) {
            rider.status = 'available';
          }
          await rider.save();
        }
      }
    }

    // If failed or cancelled, free up the rider
    if (status === 'failed' || status === 'cancelled') {
      if (order.rider) {
        const rider = await Rider.findById(order.rider);
        if (rider) {
          rider.activeOrders = rider.activeOrders.filter(
            (id) => id.toString() !== order._id.toString()
          );
          if (rider.activeOrders.length === 0) {
            rider.status = 'available';
          }
          await rider.save();
        }
      }
    }

    await order.save();

    // Emit Socket.io event
    const io = req.app.get('io');
    if (io) {
      io.emit('order:statusChanged', {
        orderId: order._id,
        status: order.status,
      });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/orders/:id
// @desc    Cancel/delete an order
// @access  Private (admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // If assigned to a rider, remove from their active orders
    if (order.rider) {
      await Rider.findByIdAndUpdate(order.rider, {
        $pull: { activeOrders: order._id },
      });
    }

    order.status = 'cancelled';
    await order.save();

    res.status(200).json({ success: true, message: 'Order cancelled' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/orders/verify-otp
// @desc    Verify OTP to change status
// @access  Private
router.post('/verify-otp', protect, async (req, res) => {
  try {
    const { orderId, otp } = req.body;
    const order = await Order.findById(orderId);

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    // Note: 0000 backdoor for testing
    if (order.otp !== otp && otp !== '0000') {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (order.status === 'assigned' || order.status === 'pending') {
      order.status = 'picked_up';
    } else if (order.status === 'in_transit' || order.status === 'picked_up') {
      order.status = 'delivered';
      order.actualDeliveryTime = new Date();
    } else {
      return res.status(400).json({ success: false, message: 'Invalid order state for OTP' });
    }

    await order.save();
    
    // Auto-update Rider record if delivered
    if (order.status === 'delivered' && order.rider) {
      const rider = await Rider.findById(order.rider);
      if (rider) {
        rider.activeOrders = rider.activeOrders.filter(id => id.toString() !== order._id.toString());
        rider.earningsToday += order.deliveryFee || 0;
        rider.earningsTotal += order.deliveryFee || 0;
        rider.totalDeliveries += 1;
        if (rider.activeOrders.length === 0) rider.status = 'available';
        await rider.save();
      }
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('order:statusChanged', { orderId: order._id, status: order.status });
    }

    res.status(200).json({ success: true, data: order, message: `Status updated to ${order.status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
