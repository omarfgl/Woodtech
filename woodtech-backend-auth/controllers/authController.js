// Ce controleur regroupe toute la logique metier liee aux routes /auth.
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PendingVerification = require('../models/PendingVerification');
const axios = require('axios');
const crypto = require('crypto');

// Secrets et durees des JWT (avec valeurs de secours pour l'environnement de dev).
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'woodtech_access_secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'woodtech_refresh_secret';
const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL || '7d';
const MAIL_SERVICE_URL = process.env.MAIL_SERVICE_URL || 'http://localhost:4600';
const VERIFICATION_TTL_MS = 1000 * 60 * 60 * 24; // 24h

// Reponse JSON standardisee en cas de reussite.
const success = (res, payload, status = 200) => res.status(status).json({ success: true, data: payload });

// Reponse JSON standardisee en cas d'echec.
const failure = (res, statusCode, message, details) =>
  res.status(statusCode).json({
    success: false,
    error: { message, details },
  });

// Genere les deux jetons JWT a partir de l'identifiant utilisateur.
const issueTokens = (userId) => ({
  accessToken: jwt.sign({ sub: userId }, ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_TTL }),
  refreshToken: jwt.sign({ sub: userId, type: 'refresh' }, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL }),
});

const sendVerificationEmail = async (email, firstName, code) => {
  await axios.post(`${MAIL_SERVICE_URL}/mail/verification`, { email, name: firstName, code }, { timeout: 10000 });
};

const generateCode = () => crypto.randomInt(100000, 999999).toString();

// On retire les champs sensibles (mot de passe, etc.) avant de renvoyer l'utilisateur cote client.
const sanitizeUser = (user) => ({
  id: user._id.toString(),
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  role: user.role || 'user',
  createdAt: user.createdAt ? user.createdAt.toISOString() : new Date().toISOString(),
});

// Assemble un objet session contenant utilisateur normalise + jetons.
const buildSession = (user) => ({
  user: sanitizeUser(user),
  tokens: issueTokens(user._id.toString()),
});

// Extrait le token Bearer depuis l'en-tete Authorization.
const requireAuthHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
};

// Inscription d'un nouvel utilisateur avec verification d'unicite de l'email.
const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body || {};

    if (!email || !password) {
      return failure(res, 400, 'Email and password are required.');
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.verified === false) {
        await User.deleteOne({ _id: existingUser._id });
      } else {
        return failure(res, 409, 'Email is already registered.');
      }
    }

    await PendingVerification.deleteOne({ email });

    const code = generateCode();
    const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);

    await PendingVerification.create({
      email,
      password,
      firstName,
      lastName,
      code,
      expiresAt,
    });

    await sendVerificationEmail(email, firstName, code);

    return success(res, { status: 'pending_verification', email }, 202);
  } catch (error) {
    return next(error);
  }
};

// Authentifie un utilisateur existant et renvoie une session complete.
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return failure(res, 400, 'Email and password are required.');
    }

    const user = await User.findOne({ email });

    if (!user) {
      return failure(res, 401, 'Invalid credentials.');
    }

    if (user.verified === false) {
      return failure(res, 401, 'Email not verified.');
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return failure(res, 401, 'Invalid credentials.');
    }

    return success(res, buildSession(user));
  } catch (error) {
    return next(error);
  }
};

// Retourne le profil de l'utilisateur identifie par son token d'acces.
const me = async (req, res) => {
  try {
    const token = requireAuthHeader(req);
    if (!token) {
      return failure(res, 401, 'Missing access token.');
    }

    const decoded = jwt.verify(token, ACCESS_SECRET);
    const user = await User.findById(decoded.sub);
    if (!user) {
      return failure(res, 404, 'User not found.');
    }
    return success(res, sanitizeUser(user));
  } catch (error) {
    const status = error.name === 'TokenExpiredError' ? 401 : 401;
    const message = error.name === 'TokenExpiredError' ? 'Access token expired.' : 'Invalid access token.';
    return failure(res, status, message);
  }
};

// Cree une nouvelle paire de jetons a partir d'un refresh token valide.
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
      return failure(res, 400, 'Refresh token is required.');
    }

    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    if (decoded.type !== 'refresh') {
      return failure(res, 400, 'Invalid refresh token.');
    }

    const user = await User.findById(decoded.sub);
    if (!user) {
      return failure(res, 404, 'User not found.');
    }
    if (user.verified === false) {
      return failure(res, 401, 'Email not verified.');
    }

    return success(res, issueTokens(user._id.toString()));
  } catch (error) {
    const status = error.name === 'TokenExpiredError' ? 401 : 400;
    const message = error.name === 'TokenExpiredError' ? 'Refresh token expired.' : 'Invalid refresh token.';
    return failure(res, status, message);
  }
};

// Le logout cote API est stateless : on repond simplement positivement.
const logout = async (_req, res) => success(res, { message: 'Logged out.' });

// Vérifie un code et crée le compte.
const verifyEmail = async (req, res, next) => {
  try {
    const { email, code } = req.body || {};
    if (!email || !code) {
      return failure(res, 400, 'Email and code are required.');
    }

    const pending = await PendingVerification.findOne({ email });
    if (!pending) {
      return failure(res, 400, 'Verification not requested.');
    }
    if (pending.code !== code) {
      return failure(res, 400, 'Invalid verification code.');
    }
    if (pending.expiresAt.getTime() < Date.now()) {
      await PendingVerification.deleteOne({ _id: pending._id });
      return failure(res, 400, 'Verification code expired.');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.verified !== false) {
      await PendingVerification.deleteOne({ _id: pending._id });
      return success(res, buildSession(existingUser));
    }
    if (existingUser && existingUser.verified === false) {
      await User.deleteOne({ _id: existingUser._id });
    }

    const user = await User.create({
      email,
      password: pending.password,
      firstName: pending.firstName,
      lastName: pending.lastName,
      verified: true,
    });
    await PendingVerification.deleteOne({ _id: pending._id });
    return success(res, buildSession(user));
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  register,
  login,
  me,
  refresh,
  logout,
  verifyEmail,
};
