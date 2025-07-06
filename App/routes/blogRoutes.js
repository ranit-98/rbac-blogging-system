const express = require('express');
const {
  createBlog,
  getBlogs,
  getMyBlogs,
  updateBlog,
  deleteBlog,
  getBlogAnalytics
} = require('../controller/blogController');
const {
  authenticate,
  authorize,
  checkOwnership
} = require('../middleware/auth');
const {
  validateBlogPost,
  validateBlogQuery
} = require('../middleware/validation');
const BlogPost = require('../models/BlogPost');

const router = express.Router();

//===============================================================================>
// @route   GET /api/blogs/analytics
// @desc    Get blog analytics (Admin only)
// @access  Private/Admin
//===============================================================================>
router.get(
  '/analytics',
  authenticate,
  authorize('admin'),
  getBlogAnalytics
);

//===============================================================================>
// @route   GET /api/blogs/my
// @desc    Get user's own blogs (Author only)
// @access  Private/Author
//===============================================================================>
router.get(
  '/my',
  authenticate,
  authorize('author', 'admin'),
  getMyBlogs
);

//===============================================================================>
// @route   POST /api/blogs
// @desc    Create a new blog post (Author only)
// @access  Private/Author

router.post(
  '/',
  authenticate,
  authorize('author', 'admin'),
  validateBlogPost,
  createBlog
);

//===============================================================================>
// @route   GET /api/blogs
// @desc    Get published blogs with filters (Public)
// @access  Public
//===============================================================================>
router.get(
  '/',
  validateBlogQuery,
  getBlogs
);

//===============================================================================>
// @route   PATCH /api/blogs/:id
// @desc    Update blog post (Author only - own blogs)
// @access  Private/Author
//===============================================================================>
router.patch(
  '/:id',
  authenticate,
  authorize('author', 'admin'),
  validateBlogPost,
  checkOwnership(BlogPost),
  updateBlog
);

//===============================================================================>
// @route   DELETE /api/blogs/:id
// @desc    Delete blog post (Author only - own blogs)
// @access  Private/Author
//===============================================================================>
router.delete(
  '/:id',
  authenticate,
  authorize('author', 'admin'),
  checkOwnership(BlogPost),
  deleteBlog
);

module.exports = router;
