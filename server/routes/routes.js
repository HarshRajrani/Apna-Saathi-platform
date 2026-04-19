const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Rider = require('../models/Rider');
const { protect, authorize } = require('../middleware/auth');

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Cluster pending orders into batches using geo-proximity
 * Groups orders within a given radius (default 2km)
 * Max orders per batch controlled by maxBatchSize (default 4)
 */
function clusterOrders(orders, radiusKm = 2, maxBatchSize = 4) {
  const batches = [];
  const assigned = new Set();

  for (let i = 0; i < orders.length; i++) {
    if (assigned.has(i)) continue;

    const batch = [orders[i]];
    assigned.add(i);

    const pivotCoords = orders[i].pickup.location.coordinates; // [lng, lat]

    for (let j = i + 1; j < orders.length; j++) {
      if (assigned.has(j)) continue;
      if (batch.length >= maxBatchSize) break;

      const candidateCoords = orders[j].pickup.location.coordinates;
      const distance = haversineDistance(
        pivotCoords[1],
        pivotCoords[0], // lat, lng of pivot
        candidateCoords[1],
        candidateCoords[0] // lat, lng of candidate
      );

      if (distance <= radiusKm) {
        batch.push(orders[j]);
        assigned.add(j);
      }
    }

    batches.push(batch);
  }

  return batches;
}

/**
 * Optimise route within a batch using nearest-neighbour heuristic
 * Starting from the first order, always picks the next closest drop point
 */
function optimiseBatchRoute(batch) {
  if (batch.length <= 1) return batch;

  const optimised = [batch[0]];
  const remaining = batch.slice(1);

  while (remaining.length > 0) {
    const lastOrder = optimised[optimised.length - 1];
    const lastCoords = lastOrder.drop.location.coordinates; // [lng, lat]

    let nearestIndex = 0;
    let nearestDistance = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const candidateCoords = remaining[i].drop.location.coordinates;
      const distance = haversineDistance(
        lastCoords[1],
        lastCoords[0],
        candidateCoords[1],
        candidateCoords[0]
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }

    optimised.push(remaining[nearestIndex]);
    remaining.splice(nearestIndex, 1);
  }

  return optimised;
}

// ============================================================
// ROUTES
// ============================================================

// @route   POST /api/routes/batch
// @desc    Cluster all pending orders into optimised batches
// @access  Private (admin)
router.post('/batch', protect, authorize('admin'), async (req, res) => {
  try {
    const { radiusKm = 2, maxBatchSize = 4 } = req.body;

    // Get all pending orders
    const pendingOrders = await Order.find({ status: 'pending' })
      .populate('business', 'name type')
      .sort({ priority: -1, createdAt: 1 }); // Urgent first, then FIFO

    if (pendingOrders.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No pending orders to batch',
        data: [],
      });
    }

    // Step 1: Cluster orders by pickup proximity
    const clusters = clusterOrders(pendingOrders, radiusKm, maxBatchSize);

    // Step 2: Optimise route within each cluster
    const batches = clusters.map((cluster, index) => {
      const optimised = optimiseBatchRoute(cluster);
      const batchId = `BATCH-${Date.now()}-${index + 1}`;

      return {
        batchId,
        orders: optimised.map((order, seq) => ({
          orderId: order._id,
          orderNumber: order.orderNumber,
          business: order.business,
          pickup: order.pickup,
          drop: order.drop,
          priority: order.priority,
          sequenceInBatch: seq + 1,
        })),
        totalStops: optimised.length,
        estimatedDistance: calculateBatchDistance(optimised),
      };
    });

    res.status(200).json({
      success: true,
      totalPendingOrders: pendingOrders.length,
      totalBatches: batches.length,
      data: batches,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Calculate total estimated distance for a batch
 */
function calculateBatchDistance(orders) {
  let totalDistance = 0;

  for (let i = 0; i < orders.length; i++) {
    // Distance from pickup to drop for each order
    const pickupCoords = orders[i].pickup.location.coordinates;
    const dropCoords = orders[i].drop.location.coordinates;

    totalDistance += haversineDistance(
      pickupCoords[1],
      pickupCoords[0],
      dropCoords[1],
      dropCoords[0]
    );

    // Distance from current drop to next pickup (if not last order)
    if (i < orders.length - 1) {
      const nextPickupCoords = orders[i + 1].pickup.location.coordinates;
      totalDistance += haversineDistance(
        dropCoords[1],
        dropCoords[0],
        nextPickupCoords[1],
        nextPickupCoords[0]
      );
    }
  }

  return Math.round(totalDistance * 100) / 100; // Round to 2 decimals
}

// @route   POST /api/routes/assign-batch
// @desc    Assign a batch to the nearest available rider
// @access  Private (admin)
router.post('/assign-batch', protect, authorize('admin'), async (req, res) => {
  try {
    const { batchId, orderIds } = req.body;

    if (!batchId || !orderIds || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide batchId and orderIds',
      });
    }

    // Get the first order's pickup location to find nearest rider
    const firstOrder = await Order.findById(orderIds[0]);
    if (!firstOrder) {
      return res
        .status(404)
        .json({ success: false, message: 'Orders not found' });
    }

    const pickupCoords = firstOrder.pickup.location.coordinates; // [lng, lat]

    // Find nearest available rider within 5km using MongoDB $near
    const nearestRider = await Rider.findOne({
      status: 'available',
      isActive: true,
      currentLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: pickupCoords,
          },
          $maxDistance: 5000, // 5km in meters
        },
      },
    });

    if (!nearestRider) {
      return res.status(404).json({
        success: false,
        message: 'No available riders within 5km of pickup location',
      });
    }

    // Update all orders in the batch
    const updatePromises = orderIds.map((orderId, index) =>
      Order.findByIdAndUpdate(
        orderId,
        {
          rider: nearestRider._id,
          status: 'assigned',
          batchId: batchId,
          sequenceInBatch: index + 1,
          $push: {
            statusHistory: {
              status: 'assigned',
              timestamp: new Date(),
              note: `Assigned to ${nearestRider.name} in batch ${batchId}`,
            },
          },
        },
        { new: true }
      )
    );

    await Promise.all(updatePromises);

    // Update rider
    nearestRider.activeOrders.push(...orderIds);
    if (nearestRider.activeOrders.length >= nearestRider.maxBatchSize) {
      nearestRider.status = 'busy';
    }
    await nearestRider.save();

    // Emit Socket.io event
    const io = req.app.get('io');
    if (io) {
      io.emit('batch:assigned', {
        batchId,
        riderId: nearestRider._id,
        riderName: nearestRider.name,
        orderIds,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        batchId,
        rider: {
          id: nearestRider._id,
          name: nearestRider.name,
          phone: nearestRider.phone,
          vehicleType: nearestRider.vehicleType,
        },
        ordersAssigned: orderIds.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/routes/active
// @desc    Get all active batches with rider and order info
// @access  Private
router.get('/active', protect, async (req, res) => {
  try {
    // Find all orders that have a batchId and are not delivered/cancelled/failed
    const activeOrders = await Order.find({
      batchId: { $ne: null },
      status: { $in: ['assigned', 'picked_up', 'in_transit'] },
    })
      .populate('business', 'name type')
      .populate('rider', 'name phone currentLocation status')
      .sort({ batchId: 1, sequenceInBatch: 1 });

    // Group orders by batchId
    const batchMap = {};
    activeOrders.forEach((order) => {
      if (!batchMap[order.batchId]) {
        batchMap[order.batchId] = {
          batchId: order.batchId,
          rider: order.rider,
          orders: [],
        };
      }
      batchMap[order.batchId].orders.push(order);
    });

    const batches = Object.values(batchMap);

    res.status(200).json({
      success: true,
      count: batches.length,
      data: batches,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
