const express = require('express');
const { body } = require('express-validator');
const {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword
} = require('../controllers/authController');
const authenticate = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.post(
    '/register',
    validate([
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 6 }),
        body('name').notEmpty().trim()
    ]),
    register
);

router.post('/login', validate([
    body('email').isEmail(),
    body('password').notEmpty()
]), login);

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);

module.exports = router;