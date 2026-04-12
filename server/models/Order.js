const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
    },
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: [true, 'Order must belong to a business'],
    },
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rider',
      default: null,
    },
    pickup: {
      address: { type: String, required: true },
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
      contactName: { type: String, required: true },
      contactPhone: { type: String, required: true },
    },
    drop: {
      address: { type: String, required: true },
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
      contactName: { type: String, required: true },
      contactPhone: { type: String, required: true },
    },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed', 'cancelled'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['normal', 'urgent'],
      default: 'normal',
    },
    batchId: {
      type: String,
      default: null,
    },
    trackingId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    sequenceInBatch: {
      type: Number,
      default: null,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot be more than 500 characters'],
    },
    estimatedDeliveryTime: {
      type: Date,
    },
    actualDeliveryTime: {
      type: Date,
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed', 'cancelled'],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        note: String,
      },
    ],
    platform: {
      type: String,
      enum: ['own', 'swiggy', 'zomato', 'whatsapp', 'website', 'other'],
      default: 'own',
    },
    otp: {
      type: String,
      maxlength: 4,
    },
    weight: {
      type: Number,
      max: [10, 'Weight cannot exceed 10kg'],
    },
    category: {
      type: String,
      enum: ['pharmacy', 'food', 'grocery', 'bakery', 'other'],
      default: 'other',
    },
  },
  {
    timestamps: true,
  }
);

// Create 2dsphere indexes for geo queries
OrderSchema.index({ 'pickup.location': '2dsphere' });
OrderSchema.index({ 'drop.location': '2dsphere' });

// Generate a unique 6-char alphanumeric Shadow Tracking ID (e.g., DF-7X2A)
function generateTrackingId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    if (i === 2) id += '-';
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

// Auto-generate order number before saving
OrderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `AS${String(count + 1).padStart(5, '0')}`;
  }
  // Generate trackingId only once on creation
  if (!this.trackingId) {
    let unique = false;
    while (!unique) {
      const candidate = generateTrackingId();
      const existing = await mongoose.model('Order').findOne({ trackingId: candidate });
      if (!existing) {
        this.trackingId = candidate;
        unique = true;
      }
    }
  }

  // Add to status history if status changed
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
    });
  }

  next();
});

module.exports = mongoose.model('Order', OrderSchema);
