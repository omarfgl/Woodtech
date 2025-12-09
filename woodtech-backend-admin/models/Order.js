const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, trim: true },
    qty: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false }
);

// Schema MongoDB pour les commandes clients (utilise par le front public et l'admin).
const orderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, trim: true },
    items: {
      type: [orderItemSchema],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: 'At least one item is required.',
      },
    },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ['card', 'paypal', 'stripe', null],
      default: null,
    },
    paymentDetails: { type: mongoose.Schema.Types.Mixed },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true }
);

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
module.exports = Order;
