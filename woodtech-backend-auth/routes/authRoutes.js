// Ce routeur relie les URL /auth/* aux fonctions du controleur.
const { Router } = require('express');
const { register, login, me, refresh, logout, verifyEmail } = require('../controllers/authController');

// Routes publiques dediees a l'authentification des utilisateurs.
const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', me);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/verify-email', verifyEmail);

module.exports = router;
