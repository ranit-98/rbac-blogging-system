const express = require('express');
const { getUsers, getProfile } = require('../controller/userController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

//===============================================================================>
// @route   GET /users
// @desc    Get paginated list of users (Admin only)
// @access  Private/Admin
//===============================================================================>
router.get('/', authenticate, authorize('admin'), getUsers);

//===============================================================================>
// @route   GET /users/profile
// @desc    Get current user profile
// @access  Private
//===============================================================================>
router.get('/profile', authenticate, getProfile);

module.exports = router;
