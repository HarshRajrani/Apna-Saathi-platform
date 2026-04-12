const mongoose = require('mongoose');

const PayoutRequestSchema = new mongoose.Schema(
  {
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rider',
      required: [true, 'Payout must belong to a rider'],
    },
    amount: {
      type: Number,
      required: [true, 'Please specify payout amount'],
      min: [1, 'Minimum payout is ₹1'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'processed'],
      default: 'pending',
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: {
      type: Date,
      default: null,
    },
    adminNote: {
      type: String,
      maxlength: [500, 'Admin note cannot exceed 500 characters'],
      default: null,
    },
    upiId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PayoutRequest', PayoutRequestSchema);
