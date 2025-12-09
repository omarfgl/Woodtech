const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');

// Convertit un document Mongoose de commande en representation publique compatible avec le front.
const toPublic = (doc) => ({
  id: doc._id.toString(),
  items: (doc.items || []).map((item) => ({
    productId: item.productId,
    qty: item.qty,
  })),
  total: doc.total,
  createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
  status: doc.status,
});

// Liste paginee des commandes avec filtres simples (texte + statut).
const listOrders = async (req, res, next) => {
  try {
    const { q, status } = req.query || {};
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));

    const filter = {};

    if (status && ['pending', 'in_progress', 'completed'].includes(status)) {
      filter.status = status;
    }

    if (q && typeof q === 'string' && q.trim() !== '') {
      const trimmed = q.trim();
      const or = [
        { userId: { $regex: trimmed, $options: 'i' } },
        { 'items.productId': { $regex: trimmed, $options: 'i' } },
      ];

      if (mongoose.Types.ObjectId.isValid(trimmed)) {
        or.push({ _id: trimmed });
      }

      filter.$or = or;
    }

    const [items, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      Order.countDocuments(filter),
    ]);

    res.json({
      items: items.map(toPublic),
      total,
      page,
      pageSize: limit,
    });
  } catch (err) {
    next(err);
  }
};

// Retourne une commande precise par son identifiant MongoDB.
const getOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const order = await Order.findById(id).exec();
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(toPublic(order));
  } catch (err) {
    next(err);
  }
};

// Cree une nouvelle commande a partir du panier client.
const createOrder = async (req, res, next) => {
  try {
    const { userId, items, paymentMethod, paymentDetails } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'items array is required.' });
    }

    const normalizedUserId = typeof userId === 'string' && userId.trim() ? userId.trim() : 'guest';
    const productIds = items.map((item) => item.productId).filter(Boolean);

    if (productIds.length === 0) {
      return res.status(400).json({ message: 'Each item must contain a productId.' });
    }

    const products = await Product.find({ _id: { $in: productIds } }).exec();
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    let total = 0;
    const normalizedItems = items.map((item) => {
      const qty = Math.max(1, Math.round(Number(item.qty) || 1));
      const product = productMap.get(item.productId);
      if (product) {
        total += qty * product.price;
      }
      return {
        productId: item.productId,
        qty,
      };
    });

    const order = await Order.create({
      userId: normalizedUserId,
      items: normalizedItems,
      total,
      paymentMethod: paymentMethod || null,
      paymentDetails: paymentDetails || undefined,
    });

    res.status(201).json(toPublic(order));
  } catch (err) {
    next(err);
  }
};

// Permet de mettre a jour uniquement le statut d'une commande existante.
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!['pending', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).exec();

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(toPublic(order));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
};
