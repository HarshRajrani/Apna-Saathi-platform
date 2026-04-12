const mongoose = require('mongoose');

const RiderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Please add a phone number'],
    },
    vehicleType: {
      type: String,
      enum: ['bike', 'bicycle', 'scooter', 'car'],
      default: 'bike',
    },
    vehicleNumber: {
      type: String,
      trim: true,
    },
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    status: {
      type: String,
      enum: ['offline', 'available', 'busy'],
      default: 'offline',
    },
    activeOrders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
      },
    ],
    maxBatchSize: {
      type: Number,
      default: 4,
    },
    earningsToday: {
      type: Number,
      default: 0,
    },
    earningsTotal: {
      type: Number,
      default: 0,
    },
    totalDeliveries: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    zone: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create 2dsphere index for geo queries (find nearest rider)
RiderSchema.index({ currentLocation: '2dsphere' });

module.exports = mongoose.model('Rider', RiderSchema);
