const BlogPost = require("../models/BlogPost");
const mongoose = require("mongoose");

//===============================================================================>
//===============================================================================>
/**
 * Create a new blog post (Author only)
 * POST /blogs
 */
//===============================================================================>
//===============================================================================>
const createBlog = async (req, res) => {
  try {
    const { title, content, tags, isPublished } = req.body;

    const blogPost = new BlogPost({
      title,
      content,
      tags: tags || [],
      author: req.user._id,
      isPublished: isPublished || false,
    });

    await blogPost.save();
    await blogPost.populate("author", "name email role");

    res.status(201).json({
      success: true,
      message: "Blog post created successfully",
      data: {
        blog: blogPost,
      },
    });
  } catch (error) {
    console.error("Create blog error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating blog post",
    });
  }
};

//===============================================================================>
//===============================================================================>
/**
 * Get published blogs with filters (Public)
 * GET /blogs
 */
//===============================================================================>
//===============================================================================>
const getBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const filters = {};
    if (req.query.tag) filters.tag = req.query.tag;
    if (req.query.authorId) filters.authorId = req.query.authorId;
    if (req.query.search) filters.search = req.query.search;

    // Use aggregation pipeline for blog listing
    const blogs = await BlogPost.getPublishedBlogs(filters, page, limit);

    // Get total count for pagination
    const matchStage = { isPublished: true };
    if (filters.tag) matchStage.tags = { $in: [filters.tag.toLowerCase()] };
    if (filters.authorId)
      matchStage.author = new mongoose.Types.ObjectId(filters.authorId);
    if (filters.search) {
      matchStage.$or = [
        { title: { $regex: filters.search, $options: "i" } },
        { content: { $regex: filters.search, $options: "i" } },
      ];
    }

    const totalBlogs = await BlogPost.countDocuments(matchStage);
    const totalPages = Math.ceil(totalBlogs / limit);

    res.json({
      success: true,
      data: {
        blogs,
        pagination: {
          currentPage: page,
          totalPages,
          totalBlogs,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get blogs error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching blogs",
    });
  }
};

//===============================================================================>
//===============================================================================>
/**
 * Get user's own blogs (Author only)
 * GET /blogs/my
 */
//===============================================================================>
//===============================================================================>
const getMyBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const blogs = await BlogPost.find({ author: req.user._id })
      .populate("author", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalBlogs = await BlogPost.countDocuments({ author: req.user._id });
    const totalPages = Math.ceil(totalBlogs / limit);

    res.json({
      success: true,
      data: {
        blogs,
        pagination: {
          currentPage: page,
          totalPages,
          totalBlogs,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get my blogs error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching your blogs",
    });
  }
};

//===============================================================================>
//===============================================================================>
/**
 * Update blog post (Author only - own blogs)
 * PATCH /blogs/:id
 */
//===============================================================================>
//===============================================================================>
const updateBlog = async (req, res) => {
  try {
    const { title, content, tags, isPublished } = req.body;
    const blogId = req.params.id;

    const blog = await BlogPost.findById(blogId);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    // Check ownership (middleware should handle this, but double-check)
    if (
      blog.author.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own blog posts",
      });
    }

    // Update fields
    if (title !== undefined) blog.title = title;
    if (content !== undefined) blog.content = content;
    if (tags !== undefined) blog.tags = tags;
    if (isPublished !== undefined) blog.isPublished = isPublished;

    await blog.save();
    await blog.populate("author", "name email role");

    res.json({
      success: true,
      message: "Blog post updated successfully",
      data: {
        blog,
      },
    });
  } catch (error) {
    console.error("Update blog error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating blog post",
    });
  }
};

//===============================================================================>
//===============================================================================>
/**
 * Delete blog post (Author only - own blogs)
 * DELETE /blogs/:id
 */
//===============================================================================>
//===============================================================================>
const deleteBlog = async (req, res) => {
  try {
    const blogId = req.params.id;

    const blog = await BlogPost.findById(blogId);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    // Check ownership (middleware should handle this, but double-check)
    if (
      blog.author.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own blog posts",
      });
    }

    await BlogPost.findByIdAndDelete(blogId);

    res.json({
      success: true,
      message: "Blog post deleted successfully",
    });
  } catch (error) {
    console.error("Delete blog error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting blog post",
    });
  }
};

//===============================================================================>
//===============================================================================>
/**
 * Get blog analytics (Admin only)
 * GET /blogs/analytics
 */
//===============================================================================>
//===============================================================================>
const getBlogAnalytics = async (req, res) => {
  try {
    const analytics = await BlogPost.getAnalytics();

    res.json({
      success: true,
      data: {
        analytics: analytics[0], // Facet returns array with one object
      },
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching analytics",
    });
  }
};

module.exports = {
  createBlog,
  getBlogs,
  getMyBlogs,
  updateBlog,
  deleteBlog,
  getBlogAnalytics,
};
