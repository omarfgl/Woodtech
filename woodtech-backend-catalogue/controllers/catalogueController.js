const Product = require('../models/Product');
const { catalogueData } = require('../seed/catalogueData');

// Transforme un document Mongoose en objet pret a etre expose cote client.
const toPublic = (doc) => ({
  id: doc._id.toString(),
  title: doc.title,
  description: doc.description,
  price: doc.price,
  imageUrl: doc.imageUrl,
  category: doc.category,
});

// Liste filtree des produits avec recherche plein texte simple.
async function listProducts(req, res, next) {
  try {
    const { q } = req.query || {};
    const filter = q
      ? {
          $or: [
            { title: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } },
            { category: { $regex: q, $options: 'i' } },
          ],
        }
      : {};
    const items = await Product.find(filter).sort({ createdAt: -1 }).limit(200).exec();
    res.json(items.map(toPublic));
  } catch (err) {
    next(err);
  }
}

// Retourne un produit precis selon son identifiant MongoDB.
async function getProduct(req, res, next) {
  try {
    const { id } = req.params;
    const item = await Product.findById(id).exec();
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(toPublic(item));
  } catch (err) {
    next(err);
  }
}

// Cree un produit a partir des donnees recues (utilise par l'admin).
async function createProduct(req, res, next) {
  try {
    const payload = req.body || {};
    const created = await Product.create(payload);
    res.status(201).json(toPublic(created));
  } catch (err) {
    next(err);
  }
}

// Met a jour un produit existant (valide les champs du schema).
async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    const updated = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).exec();
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(toPublic(updated));
  } catch (err) {
    next(err);
  }
}

// Supprime un produit de maniere definitive.
async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await Product.findByIdAndDelete(id).exec();
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// Endpoint manuel pour injecter les donnees de demonstration depuis catalogueData.
async function seedProducts(req, res, next) {
  try {
    if (process.env.NODE_ENV === 'production' || process.env.ALLOW_SEED !== 'true') {
      return res.status(403).json({ message: 'Seeding disabled' });
    }

    const TARGET_COUNT = catalogueData.length;

    const count = await Product.countDocuments();
    if (count >= TARGET_COUNT) return res.json({ message: 'Already seeded', count });

    const existing = await Product.find({}, 'title').lean();
    const existingTitles = new Set(existing.map((d) => d.title));
    const toInsert = catalogueData
      .filter((item) => !existingTitles.has(item.title))
      .slice(0, TARGET_COUNT - count);

    if (toInsert.length === 0) return res.json({ message: 'Nothing new to insert', count });

    await Product.insertMany(toInsert);
    const items = await Product.countDocuments();
    res.json({ message: 'Seeded', count: items });
  } catch (err) {
    next(err);
  }
}

// Remplit les URLs d'images manquantes en reutilisant un set d'images par defaut.
async function backfillImages(req, res, next) {
  try {
    if (process.env.NODE_ENV === 'production' || process.env.ALLOW_SEED !== 'true') {
      return res.status(403).json({ message: 'Backfill disabled' });
    }
    const defaults = [
      'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1549187774-b4e9b0445b07?auto=format&fit=crop&w=1600&q=80',
    ];
    const missing = await Product.find({
      $or: [{ imageUrl: { $exists: false } }, { imageUrl: '' }],
    }).exec();
    if (missing.length === 0) return res.json({ message: 'No products missing imageUrl' });
    let i = 0;
    for (const doc of missing) {
      // rotate through defaults
      // eslint-disable-next-line no-plusplus
      const img = defaults[i++ % defaults.length];
      doc.imageUrl = img;
      // eslint-disable-next-line no-await-in-loop
      await doc.save();
    }
    const count = await Product.countDocuments();
    return res.json({ message: 'Backfilled images', updated: missing.length, count });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  seedProducts,
  backfillImages,
};
