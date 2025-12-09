// Cart microservice: manages per-user cart items.
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB } = require('./db');
const cartRoutes = require('./routes/cartRoutes');

const app = express();
const PORT = process.env.PORT || 4200;

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
  : '*';

const corsOptions = {
  origin: corsOrigins === '*' ? true : corsOrigins,
  credentials: true,
};

app.use(helmet());
app.use(cors(corsOptions));
app.set('etag', false);
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok' });
});

app.use('/cart', cartRoutes);

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

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Cart service listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start cart service:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
