const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Order = require('../models/Order');
const Business = require('../models/Business');
const { protect, authorize } = require('../middleware/auth');

const GST_RATE = 0.18; // 18% GST

// @route   GET /api/billing/invoices
// @desc    Get all invoices (filterable by status, business)
// @access  Private
router.get('/invoices', protect, async (req, res) => {
  try {
    const { status, businessId, limit = 50 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (businessId) query.business = businessId;

    const invoices = await Invoice.find(query)
      .populate('business', 'name type phone plan')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/billing/invoices/:id
// @desc    Get single invoice with full order breakdown
// @access  Private
router.get('/invoices/:id', protect, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('business', 'name type phone address plan')
      .populate({
        path: 'orders',
        select: 'orderNumber status deliveryFee pickup drop createdAt actualDeliveryTime',
      });

    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, message: 'Invoice not found' });
    }

    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/billing/generate
// @desc    Generate invoice for a business (date range)
// @access  Private (admin)
router.post('/generate', protect, authorize('admin'), async (req, res) => {
  try {
    const { businessId, from, to } = req.body;

    if (!businessId || !from || !to) {
      return res.status(400).json({
        success: false,
        message: 'Please provide businessId, from date, and to date',
      });
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res
        .status(404)
        .json({ success: false, message: 'Business not found' });
    }

    // Find all delivered orders for this business in the date range
    const orders = await Order.find({
      business: businessId,
      status: 'delivered',
      actualDeliveryTime: {
        $gte: new Date(from),
        $lte: new Date(to),
      },
    });

    if (orders.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No delivered orders found for this period',
      });
    }

    // Calculate totals
    const subtotal = orders.reduce(
      (sum, order) => sum + (order.deliveryFee || 0),
      0
    );
    const tax = Math.round(subtotal * GST_RATE * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    // Due date = 15 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15);

    const invoice = await Invoice.create({
      business: businessId,
      orders: orders.map((o) => o._id),
      period: { from: new Date(from), to: new Date(to) },
      totalDeliveries: orders.length,
      subtotal,
      tax,
      total,
      dueDate,
    });

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('business', 'name type phone plan')
      .populate('orders', 'orderNumber deliveryFee status');

    res.status(201).json({ success: true, data: populatedInvoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PATCH /api/billing/invoices/:id/pay
// @desc    Mark invoice as paid
// @access  Private (admin)
router.patch(
  '/invoices/:id/pay',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const invoice = await Invoice.findById(req.params.id);

      if (!invoice) {
        return res
          .status(404)
          .json({ success: false, message: 'Invoice not found' });
      }

      invoice.status = 'paid';
      invoice.paidAt = new Date();
      await invoice.save();

      const populatedInvoice = await Invoice.findById(invoice._id).populate(
        'business',
        'name type phone plan'
      );

      res.status(200).json({ success: true, data: populatedInvoice });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// @route   GET /api/billing/summary
// @desc    Monthly revenue + unpaid totals + top businesses
// @access  Private
router.get('/summary', protect, async (req, res) => {
  try {
    // Current month boundaries
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Monthly revenue (from paid invoices this month)
    const monthlyRevenueResult = await Invoice.aggregate([
      {
        $match: {
          status: 'paid',
          paidAt: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Unpaid totals
    const unpaidResult = await Invoice.aggregate([
      {
        $match: {
          status: { $in: ['unpaid', 'overdue'] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Top 5 businesses by total deliveries
    const topBusinesses = await Business.find({ isActive: true })
      .sort({ totalDeliveries: -1 })
      .limit(5)
      .select('name type totalDeliveries plan');

    // Total deliveries this month
    const monthlyDeliveries = await Order.countDocuments({
      status: 'delivered',
      actualDeliveryTime: { $gte: startOfMonth, $lte: endOfMonth },
    });

    res.status(200).json({
      success: true,
      data: {
        monthlyRevenue:
          monthlyRevenueResult.length > 0 ? monthlyRevenueResult[0].total : 0,
        monthlyPaidInvoices:
          monthlyRevenueResult.length > 0 ? monthlyRevenueResult[0].count : 0,
        unpaidTotal:
          unpaidResult.length > 0 ? unpaidResult[0].total : 0,
        unpaidCount:
          unpaidResult.length > 0 ? unpaidResult[0].count : 0,
        monthlyDeliveries,
        topBusinesses,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
