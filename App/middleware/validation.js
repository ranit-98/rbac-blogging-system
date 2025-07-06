const { body, query, validationResult } = require('express-validator');

//===============================================================================>
/**
 * Handle validation errors
 */
//===============================================================================>
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

//===============================================================================>
/**
 * User registration validation
 */
//===============================================================================>
const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['admin', 'author', 'reader'])
    .withMessage('Role must be admin, author, or reader'),
  handleValidationErrors
];

//===============================================================================>
/**
 * User login validation
 */
//===============================================================================>
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];


//===============================================================================>
/**
 * Blog post validation
 */
//===============================================================================>
const validateBlogPost = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('content')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be between 1 and 30 characters'),
  body('isPublished')
    .optional()
    .isBoolean()
    .withMessage('isPublished must be a boolean'),
  handleValidationErrors
];

//===============================================================================>
/**
 * Query validation for blog listing
 */
//===============================================================================>
const validateBlogQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('tag')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Tag must be between 1 and 30 characters'),
  query('authorId')
    .optional()
    .isMongoId()
    .withMessage('Author ID must be a valid MongoDB ObjectId'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateBlogPost,
  validateBlogQuery,
  handleValidationErrors
};
