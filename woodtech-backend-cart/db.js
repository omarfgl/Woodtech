const mongoose = require('mongoose');

// Fallback URI so the service can run locally without manual configuration.
const DEFAULT_URI =
  'mongodb+srv://woodtech:woodtech123@cluster0.g0aws.mongodb.net/woodtech?retryWrites=true&w=majority&appName=Cluster0';

// Shared Mongo connection for the cart service.
const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || DEFAULT_URI;

  if (!mongoUri) {
    throw new Error('Missing MongoDB connection string. Set MONGODB_URI or MONGO_URI in your environment.');
  }

  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  mongoose.connection.on('connected', () => {
    console.log('MongoDB connected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });

  await mongoose.connect(mongoUri, {
    dbName: new URL(mongoUri).pathname.replace('/', '') || undefined,
  });

  return mongoose.connection;
};

module.exports = {
  connectDB,
};
