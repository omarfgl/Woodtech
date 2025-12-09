// Microservice admin : gestion des commandes (creation via front public + consultation/edition depuis l'espace admin).
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB } = require('./db');
const ordersRoutes = require('./routes/ordersRoutes');

const app = express();
const PORT = process.env.PORT || 4300;

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
// Evite les reponses 304/vides sur les APIs JSON.
app.set('etag', false);
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));

// Endpoint pour supervision (utile aux orchestrateurs).
app.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok' });
});

// Toutes les routes de gestion des commandes sont prefixees par /orders.
app.use('/orders', ordersRoutes);

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

// Initialise MongoDB puis lance le serveur HTTP.
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Admin service listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start admin service:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;

