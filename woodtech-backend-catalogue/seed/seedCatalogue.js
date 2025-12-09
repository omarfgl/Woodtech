const Product = require('../models/Product');
const { catalogueData } = require('./catalogueData');

const TARGET_COUNT = catalogueData.length;

// Insere au besoin les produits de demonstration sans dupliquer ceux deja presents.
async function seedCatalogue() {
  const allow = process.env.ALLOW_SEED === 'true' || process.env.SEED_CATALOGUE === 'true';
  if (!allow) return { seeded: false, reason: 'ALLOW_SEED not set' };
  if (process.env.NODE_ENV === 'production') {
    return { seeded: false, reason: 'Skipping in production' };
  }

  const count = await Product.countDocuments();
  if (count >= TARGET_COUNT) return { seeded: false, reason: `Already has ${count} items` };

  const existing = await Product.find({}, 'title').lean();
  const existingTitles = new Set(existing.map((d) => d.title));
  const toInsert = catalogueData
    .filter((item) => !existingTitles.has(item.title))
    .slice(0, TARGET_COUNT - count);

  if (toInsert.length === 0) {
    return { seeded: false, reason: 'Nothing new to insert' };
  }

  await Product.insertMany(toInsert);
  const newCount = await Product.countDocuments();
  return { seeded: true, count: newCount };
}

module.exports = { seedCatalogue };
