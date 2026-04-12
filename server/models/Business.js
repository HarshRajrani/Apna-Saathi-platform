const mongoose = require('mongoose');

const BusinessSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please add a business name'],
      trim: true,
      maxlength: [100, 'Business name cannot be more than 100 characters'],
    },
    type: {
      type: String,
      enum: ['restaurant', 'pharmacy', 'kirana', 'bakery', 'grocery', 'other'],
      default: 'other',
    },
    phone: {
      type: String,
      required: [true, 'Please add a phone number'],
    },
    address: {
      street: { type: String, required: true },
      area: { type: String, required: true },
      city: { type: String, required: true },
      pincode: { type: String, required: true },
      location: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          required: true,
        },
      },
    },
    // Legacy fields preserved for backward compatibility
    plan: {
      type: String,
      enum: ['daily', 'monthly', 'yearly', 'pay-per-delivery', 'monthly-150', 'monthly-300'],
      default: 'daily',
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    subscriptionStatus: {
      type: String,
      enum: ['trial', 'active', 'expired'],
      default: 'trial',
    },
    // ── NEW: Subscription tracking object ──
    subscription: {
      plan: {
        type: String,
        enum: ['daily', 'monthly', 'yearly'],
        default: 'daily',
      },
      isPaid: {
        type: Boolean,
        default: false,
      },
      expiryDate: {
        type: Date,
        default: null,
      },
      razorpayOrderId: {
        type: String,
        default: null,
      },
      lastPaymentId: {
        type: String,
        default: null,
      },
    },
    deliveriesThisMonth: {
      type: Number,
      default: 0,
    },
    totalDeliveries: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create 2dsphere index for geo queries
BusinessSchema.index({ 'address.location': '2dsphere' });

module.exports = mongoose.model('Business', BusinessSchema);
