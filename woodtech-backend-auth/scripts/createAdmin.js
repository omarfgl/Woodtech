// Script de creation/activation d'un compte admin.
// Utilisation : npm run seed:admin
// Variables d'environnement optionnelles :
//   ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FIRSTNAME, ADMIN_LASTNAME
require('dotenv').config();
const { connectDB } = require('../db');
const User = require('../models/User');

const DEFAULT_EMAIL = 'Larmoire@gmail.com';
const DEFAULT_PASSWORD = 'Larmoire1234';

async function ensureAdmin() {
  await connectDB();

  const email = process.env.ADMIN_EMAIL || DEFAULT_EMAIL;
  const password = process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
  const firstName = process.env.ADMIN_FIRSTNAME || 'Admin';
  const lastName = process.env.ADMIN_LASTNAME || 'WoodTech';

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ email, password, firstName, lastName, role: 'admin' });
    console.log(`Created admin user ${email}`);
  } else {
    let updated = false;
    if (user.role !== 'admin') {
      user.role = 'admin';
      updated = true;
    }
    if (process.env.ADMIN_PASSWORD) {
      user.password = password;
      updated = true;
    }
    if (updated) {
      await user.save();
      console.log(`Updated admin user ${email}`);
    } else {
      console.log(`Admin user ${email} already exists`);
    }
  }
  process.exit(0);
}

ensureAdmin().catch((err) => {
  console.error('Failed to create admin user:', err);
  process.exit(1);
});
