const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, trim: true },
    qty: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, trim: true, unique: true, index: true },
    items: { type: [itemSchema], default: [] },
  },
  { timestamps: true }
);

const Cart = mongoose.models.Cart || mongoose.model('Cart', cartSchema);
module.exports = Cart;
