const mongoose = require('mongoose');

// URI de secours afin d'eviter les plantages en local si la variable d'environnement n'est pas definie.
const DEFAULT_URI =
  'mongodb+srv://woodtech:woodtech123@cluster0.g0aws.mongodb.net/woodtech?retryWrites=true&w=majority&appName=Cluster0';

// Cette fonction etablit une connexion MongoDB partagee pour tout le service.
const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || DEFAULT_URI;

  if (!mongoUri) {
    throw new Error('Missing MongoDB connection string. Set MONGODB_URI or MONGO_URI in your environment.');
  }

  // On reutilise la connexion existante pour eviter d'ouvrir plusieurs sockets.
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

  // Le dbName est deduit de l'URI afin de pouvoir cibler une base precise dans le cluster Atlas.
  await mongoose.connect(mongoUri, {
    dbName: new URL(mongoUri).pathname.replace('/', '') || undefined,
  });

  return mongoose.connection;
};

module.exports = {
  connectDB,
};
