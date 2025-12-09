// Ce modele Mongoose represente les utilisateurs de WoodTech.
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Modele utilisateur : email unique, mot de passe chiffre et role simple (user/admin).
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    verified: {
      type: Boolean,
      default: true, // anciens utilisateurs restent actifs; les nouveaux seront créés avec verified=false
    },
  },
  {
    timestamps: true,
  },
);

// Avant chaque sauvegarde on chiffre le mot de passe si besoin.
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (error) {
    return next(error);
  }
});

// Methode d'instance utilisee par le controleur pour comparer les mots de passe.
userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
