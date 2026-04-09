const Business = require('../models/Business');

/**
 * checkSubscription — "The Enforcer"
 *
 * Ensures that merchants have an active, paid subscription before
 * allowing access to protected routes (e.g., creating new orders).
 *
 * Logic:
 * 1. Skip check for non-business roles (admin, rider).
 * 2. If subscriptionStatus === 'active' OR 'trial' AND expiryDate > now → allow.
 * 3. If expired but within 24-hour grace period → allow with warning header.
 * 4. Otherwise → block with 402 Payment Required.
 */
const checkSubscription = async (req, res, next) => {
  try {
    // Only enforce for business users
    if (req.user.role !== 'business') {
      return next();
    }

    const business = req.user.businessId
      ? await Business.findById(req.user.businessId)
      : await Business.findOne({ owner: req.user._id });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business profile not found. Please complete your profile first.',
      });
    }

    const status = business.subscriptionStatus || 'trial';
    const subscription = business.subscription;

    if (status === 'expired') {
      return res.status(402).json({
        success: false,
        code: 'SUBSCRIPTION_EXPIRED',
        message: 'Your subscription has expired. Please renew to continue creating orders.',
        data: {
          currentPlan: subscription?.plan,
          status: 'expired',
        },
      });
    }

    if (status === 'trial') {
      return next(); // Trial users are allowed
    }

    // For 'active' status, we should ideally check expiry date as well
    if (status === 'active') {
      if (!subscription || !subscription.expiryDate) {
        return next(); // If no expiry date, assume valid active subscription
      }
      
      const now = new Date();
      const expiryDate = new Date(subscription.expiryDate);

      if (expiryDate > now) {
        // Subscription is active
        return next();
      }

      // Check 24-hour grace period
      const gracePeriodEnd = new Date(expiryDate.getTime() + 24 * 60 * 60 * 1000);

      if (now <= gracePeriodEnd) {
        // Within grace period — allow but warn
        res.set('X-Subscription-Warning', 'grace-period');
        res.set('X-Subscription-Expiry', expiryDate.toISOString());
        return next();
      }

      // Fully expired — block access
      business.subscriptionStatus = 'expired';
      business.subscription.isPaid = false;
      await business.save();

      return res.status(402).json({
        success: false,
        code: 'SUBSCRIPTION_EXPIRED',
        message: 'Your subscription has expired. Please renew to continue creating orders.',
        data: {
          currentPlan: subscription.plan,
          status: 'expired',
          expiredAt: expiryDate.toISOString(),
        },
      });
    }

    // Fallback block
    return res.status(402).json({
      success: false,
      code: 'SUBSCRIPTION_REQUIRED',
      message: 'Active subscription required. Please subscribe to a plan to continue.',
    });
  } catch (error) {
    console.error('checkSubscription middleware error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error checking subscription status.',
    });
  }
};

module.exports = checkSubscription;
