// Ce microservice se charge uniquement du catalogue (produits + seeding + operations admin).
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB } = require('./db');
const catalogueRoutes = require('./routes/catalogueRoutes');
const { seedCatalogue } = require('./seed/seedCatalogue');

const app = express();
const PORT = process.env.PORT || 4100;

// Origines autorisees pour l'appel des frontends WoodTech.
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
  : '*';

const corsOptions = {
  origin: corsOrigins === '*' ? true : corsOrigins,
  credentials: true,
};

// Middlewares globaux de securite/observabilite.
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));

// Endpoint pour supervision (utile aux orchestrateurs).
app.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok' });
});

// Toutes les routes de gestion produit sont prefixees par /catalogue.
app.use('/catalogue', catalogueRoutes);

// Gestionnaire d'erreurs unifie.
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: {
      message: err.message || 'An unexpected error occurred.',
    },
  });
});

// Initialise MongoDB, effectue un seeding optionnel puis lance le serveur HTTP.
const startServer = async () => {
  try {
    await connectDB();
    try {
      const result = await seedCatalogue();
      if (result.seeded) {
        console.log(`Seeded catalogue with ${result.count} items`);
      } else {
        console.log(`Catalogue seeding skipped: ${result.reason ?? 'n/a'}`);
      }
    } catch (error) {
      console.warn('Catalogue seeding failed:', error.message);
    }

    app.listen(PORT, () => {
      console.log(`Catalogue service listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start catalogue service:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
