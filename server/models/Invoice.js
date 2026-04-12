const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
    },
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: [true, 'Invoice must belong to a business'],
    },
    // ── NEW: Invoice type (delivery billing vs subscription payment) ──
    type: {
      type: String,
      enum: ['delivery', 'subscription'],
      default: 'delivery',
    },
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
      },
    ],
    period: {
      from: { type: Date },
      to: { type: Date },
    },
    totalDeliveries: {
      type: Number,
      default: 0,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      required: true, // 18% GST
    },
    total: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['unpaid', 'paid', 'overdue'],
      default: 'unpaid',
    },
    dueDate: {
      type: Date,
    },
    paidAt: {
      type: Date,
    },
    // ── NEW: Razorpay fields for subscription invoices ──
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    subscriptionPlan: {
      type: String,
      enum: ['daily', 'monthly', 'yearly'],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate invoice number before saving
InvoiceSchema.pre('save', async function (next) {
  if (!this.invoiceNumber) {
    const count = await mongoose.model('Invoice').countDocuments();
    this.invoiceNumber = `INV${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
