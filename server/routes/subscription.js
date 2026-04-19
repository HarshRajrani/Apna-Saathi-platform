const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Business = require('../models/Business');
const Invoice = require('../models/Invoice');
const { protect, authorize } = require('../middleware/auth');

// ── Initialize Razorpay instance ──
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Plan pricing (in INR)
const PLAN_PRICES = {
  daily: 99,
  monthly: 2499,
  yearly: 19999,
};

// Plan duration (in days)
const PLAN_DURATIONS = {
  daily: 1,
  monthly: 30,
  yearly: 365,
};

const GST_RATE = 0.18;

// ────────────────────────────────────────────────────────────────
// @route   GET /api/subscription/status
// @desc    Get current subscription status for the merchant
// @access  Private (business)
// ────────────────────────────────────────────────────────────────
router.get('/status', protect, async (req, res) => {
  try {
    let business = req.user.businessId
      ? await Business.findById(req.user.businessId)
      : null;
    if (!business) {
      business = await Business.findOne({ owner: req.user._id });
    }
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    const subscription = business.subscription || {};
    const now = new Date();
    const expiryDate = subscription.expiryDate ? new Date(subscription.expiryDate) : null;

    // Determine real-time status
    let status = 'inactive';
    let isInGracePeriod = false;

    if (subscription.isPaid && expiryDate) {
      if (expiryDate > now) {
        status = 'active';
      } else {
        const gracePeriodEnd = new Date(expiryDate.getTime() + 24 * 60 * 60 * 1000);
        if (now <= gracePeriodEnd) {
          status = 'grace_period';
          isInGracePeriod = true;
        } else {
          status = 'expired';
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        plan: subscription.plan || business.plan,
        isPaid: subscription.isPaid || false,
        expiryDate: subscription.expiryDate,
        status,
        isInGracePeriod,
        daysRemaining: expiryDate && expiryDate > now
          ? Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24))
          : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ────────────────────────────────────────────────────────────────
// @route   POST /api/subscription/create-order
// @desc    Create a Razorpay order for a subscription plan
// @access  Private (business only)
// ────────────────────────────────────────────────────────────────
router.post('/create-order', protect, authorize('business'), async (req, res) => {
  try {
    const { plan } = req.body;

    if (!plan || !PLAN_PRICES[plan]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan. Choose from: daily, monthly, yearly',
      });
    }

    // Find the business — try user.businessId first, then fallback to owner lookup
    let business = null;
    if (req.user.businessId) {
      business = await Business.findById(req.user.businessId);
    }
    if (!business) {
      business = await Business.findOne({ owner: req.user._id });
      // Sync businessId back to user for future calls
      if (business && !req.user.businessId) {
        req.user.businessId = business._id;
        await req.user.save();
      }
    }
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'No business profile found. Please complete your business setup first.',
      });
    }

    const amount = PLAN_PRICES[plan];
    // Razorpay receipt max 40 chars — use short hash
    const shortId = req.user._id.toString().slice(-8);
    const receipt = `sub_${shortId}_${Date.now()}`.slice(0, 40);

    // Create Razorpay order (amount in paise = INR * 100)
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: 'INR',
      receipt,
      notes: {
        businessId: business._id.toString(),
        userId: req.user._id.toString(),
        plan,
      },
    });

    // Store the orderId on the business for verification later
    business.subscription.razorpayOrderId = order.id;
    await business.save();

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        plan,
        key: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error('Razorpay create-order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ────────────────────────────────────────────────────────────────
// @route   POST /api/subscription/verify-payment
// @desc    Verify Razorpay payment signature and activate subscription
// @access  Private (business only)
// ────────────────────────────────────────────────────────────────
router.post('/verify-payment', protect, authorize('business'), async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification fields',
      });
    }

    // ── SIGNATURE VERIFICATION ──
    // Razorpay signs: order_id + "|" + payment_id with the key_secret
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Signature mismatch.',
      });
    }

    // ── ACTIVATE SUBSCRIPTION ──
    let business = req.user.businessId
      ? await Business.findById(req.user.businessId)
      : null;
    if (!business) {
      business = await Business.findOne({ owner: req.user._id });
    }
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    const selectedPlan = plan || 'daily';
    const durationDays = PLAN_DURATIONS[selectedPlan] || 1;

    // Calculate expiry from now (or extend from current expiry if still active)
    const now = new Date();
    const currentExpiry = business.subscription.expiryDate
      ? new Date(business.subscription.expiryDate)
      : null;
    const startDate = currentExpiry && currentExpiry > now ? currentExpiry : now;
    const expiryDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    business.subscription.plan = selectedPlan;
    business.subscription.isPaid = true;
    business.subscription.expiryDate = expiryDate;
    business.subscription.razorpayOrderId = razorpay_order_id;
    business.subscription.lastPaymentId = razorpay_payment_id;

    // Sync legacy fields
    business.plan = selectedPlan;
    business.isPaid = true;

    await business.save();

    // ── AUTO-GENERATE INVOICE ──
    const price = PLAN_PRICES[selectedPlan];
    const tax = Math.round(price * GST_RATE * 100) / 100;
    const total = Math.round((price + tax) * 100) / 100;

    const invoice = await Invoice.create({
      business: business._id,
      type: 'subscription',
      subtotal: price,
      tax,
      total,
      status: 'paid',
      paidAt: now,
      dueDate: now, // Already paid, due date = now
      razorpayPaymentId: razorpay_payment_id,
      subscriptionPlan: selectedPlan,
      totalDeliveries: 0,
      period: {
        from: now,
        to: expiryDate,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified and subscription activated!',
      data: {
        plan: business.subscription.plan,
        isPaid: business.subscription.isPaid,
        expiryDate: business.subscription.expiryDate,
        invoiceNumber: invoice.invoiceNumber,
      },
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ────────────────────────────────────────────────────────────────
// @route   POST /api/subscription/webhook
// @desc    Razorpay webhook listener — catches payment.captured events
//          when user closes browser before verify call completes
// @access  Public (verified via webhook signature)
// ────────────────────────────────────────────────────────────────
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Verify webhook signature
    const receivedSignature = req.headers['x-razorpay-signature'];

    if (!receivedSignature || !webhookSecret) {
      return res.status(400).json({ success: false, message: 'Missing webhook signature' });
    }

    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== receivedSignature) {
      console.error('Webhook signature mismatch');
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    // Parse the event
    const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;
      const paymentId = payment.id;
      const notes = payment.notes || {};
      const businessId = notes.businessId;
      const plan = notes.plan || 'daily';

      if (businessId) {
        const business = await Business.findById(businessId);

        // Only activate if not already activated (prevent double-processing)
        if (business && business.subscription.lastPaymentId !== paymentId) {
          const durationDays = PLAN_DURATIONS[plan] || 1;
          const now = new Date();
          const currentExpiry = business.subscription.expiryDate
            ? new Date(business.subscription.expiryDate)
            : null;
          const startDate = currentExpiry && currentExpiry > now ? currentExpiry : now;
          const expiryDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

          business.subscription.plan = plan;
          business.subscription.isPaid = true;
          business.subscription.expiryDate = expiryDate;
          business.subscription.razorpayOrderId = orderId;
          business.subscription.lastPaymentId = paymentId;
          business.plan = plan;
          business.isPaid = true;

          await business.save();

          // Check if invoice already exists for this payment
          const existingInvoice = await Invoice.findOne({ razorpayPaymentId: paymentId });
          if (!existingInvoice) {
            const price = PLAN_PRICES[plan];
            const tax = Math.round(price * GST_RATE * 100) / 100;
            const total = Math.round((price + tax) * 100) / 100;

            await Invoice.create({
              business: business._id,
              type: 'subscription',
              subtotal: price,
              tax,
              total,
              status: 'paid',
              paidAt: now,
              dueDate: now,
              razorpayPaymentId: paymentId,
              subscriptionPlan: plan,
              totalDeliveries: 0,
              period: { from: now, to: expiryDate },
            });
          }

          console.log(`✅ Webhook: Subscription activated for business ${businessId} via payment ${paymentId}`);
        }
      }
    }

    // Always acknowledge webhook
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Still return 200 to prevent Razorpay retries
    res.status(200).json({ status: 'error', message: error.message });
  }
});

// ────────────────────────────────────────────────────────────────
// @route   GET /api/subscription/invoices
// @desc    Get subscription invoices for current business
// @access  Private (business)
// ────────────────────────────────────────────────────────────────
router.get('/invoices', protect, async (req, res) => {
  try {
    const query = { type: 'subscription' };

    // Business users see only their own invoices
    if (req.user.role === 'business') {
      query.business = req.user.businessId;
    }

    const invoices = await Invoice.find(query)
      .populate('business', 'name type phone')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
