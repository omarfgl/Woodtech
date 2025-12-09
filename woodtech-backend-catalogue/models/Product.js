const mongoose = require('mongoose');

// Schema MongoDB decrivant les produits exposes cote front (titre, description, prix, etc.).
const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['tables', 'portes', 'armoires', 'autres'],
      required: true,
      default: 'autres',
    },
  },
  { timestamps: true }
);

// On reutilise le modele si deja compile (utile avec les hot reload).
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
module.exports = Product;
