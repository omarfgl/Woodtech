const Cart = require('../models/Cart');

const toPublicItems = (cartDoc) =>
  (cartDoc?.items || []).map((item) => ({
    productId: item.productId,
    qty: item.qty,
  }));

const requireUserId = (userId) => {
  if (!userId) {
    const err = new Error('User ID is required.');
    err.status = 400;
    throw err;
  }
};

const getCart = async (req, res, next) => {
  try {
    const { userId } = req.params;
    requireUserId(userId);
    const cart = await Cart.findOne({ userId }).lean();
    res.json(toPublicItems(cart));
  } catch (err) {
    next(err);
  }
};

const addItem = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { productId, qty } = req.body || {};

    requireUserId(userId);
    if (!productId) {
      return res.status(400).json({ message: 'productId is required.' });
    }

    const increment = Number(qty ?? 1);
    const delta = Number.isFinite(increment) && increment > 0 ? Math.round(increment) : 1;

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [{ productId, qty: delta }] });
    } else {
      const existing = cart.items.find((item) => item.productId === productId);
      if (existing) {
        existing.qty += delta;
      } else {
        cart.items.push({ productId, qty: delta });
      }
    }

    await cart.save();
    res.status(201).json(toPublicItems(cart));
  } catch (err) {
    next(err);
  }
};

const removeItem = async (req, res, next) => {
  try {
    const { userId, productId } = req.params;
    requireUserId(userId);
    if (!productId) {
      return res.status(400).json({ message: 'productId is required.' });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.json([]);
    }

    cart.items = cart.items.filter((item) => item.productId !== productId);
    await cart.save();
    res.json(toPublicItems(cart));
  } catch (err) {
    next(err);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const { userId } = req.params;
    requireUserId(userId);

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.json([]);
    }

    cart.items = [];
    await cart.save();
    res.json([]);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCart,
  addItem,
  removeItem,
  clearCart,
};
