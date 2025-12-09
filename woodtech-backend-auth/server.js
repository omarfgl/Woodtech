// Ce fichier demarre le microservice d'authentification et branche tous les middlewares necessaires.
// Il ne gere plus que les routes /auth depuis que le catalogue a son propre service.
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const { connectDB } = require('./db');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 4000;
// On decoupe la liste d'origines autorisees pour eviter les refus CORS cote front.
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
  : '*';

const corsOptions = {
  origin: corsOrigins === '*' ? true : corsOrigins,
  credentials: true,
};

// Bloc de middlewares de securite et d'observabilite appliques a toutes les requetes.
app.use(helmet());
app.use(cors(corsOptions));
// Avoid 304/empty bodies on XHR by disabling ETag and caching for JSON APIs
app.set('etag', false);
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));

// Route de sante simple pour que le monitoring verifie la disponibilite du service.
app.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok' });
});

// L'API auth expose les actions register/login/me/refresh/logout.
app.use('/auth', authRoutes);

// Gestionnaire d'erreurs unique qui renvoie un JSON homogene.
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

// Cette fonction encapsule la connexion MongoDB et le demarrage HTTP.
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Auth service listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;




