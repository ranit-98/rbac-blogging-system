const express = require('express');
const { register, login } = require('../controller/authController');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

//===============================================================================>
// Apply rate limiting to auth routes
//===============================================================================>
router.use(authLimiter);

//===============================================================================>
// @route   POST /auth/register
// @desc    Register a new user
// @access  Public
//===============================================================================>
router.post('/register', validateUserRegistration, register);

//===============================================================================>
// @route   POST /auth/login
// @desc    Login user and get JWT token
// @access  Public
//===============================================================================>
router.post('/login', validateUserLogin, login);

module.exports = router;
