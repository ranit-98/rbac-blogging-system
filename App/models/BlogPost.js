const mongoose = require("mongoose");

//================================================================================>
//================================================================================>

const blogPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      minlength: [10, "Content must be at least 10 characters"],
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: [30, "Tag cannot exceed 30 characters"],
      },
    ],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//================================================================================>
//================================================================================>
// Virtual for author details
//================================================================================>
//================================================================================>
blogPostSchema.virtual("authorDetails", {
  ref: "User",
  localField: "author",
  foreignField: "_id",
  justOne: true,
});

//================================================================================>
//================================================================================>
// Static method for aggregation-based blog listing
//================================================================================>
//================================================================================>
blogPostSchema.statics.getPublishedBlogs = function (
  filters = {},
  page = 1,
  limit = 10
) {
  const pipeline = [];

  // Match stage for published blogs
  const matchStage = { isPublished: true };

  // Add filters
  if (filters.tag) {
    matchStage.tags = { $in: [filters.tag.toLowerCase()] };
  }

  if (filters.authorId) {
    matchStage.author = new mongoose.Types.ObjectId(filters.authorId);
  }

  if (filters.search) {
    matchStage.$or = [
      { title: { $regex: filters.search, $options: "i" } },
      { content: { $regex: filters.search, $options: "i" } },
    ];
  }

  pipeline.push({ $match: matchStage });

  // Lookup author details
  pipeline.push({
    $lookup: {
      from: "users",
      localField: "author",
      foreignField: "_id",
      as: "authorDetails",
      pipeline: [{ $project: { name: 1, email: 1, role: 1 } }],
    },
  });

  // Unwind author details
  pipeline.push({
    $unwind: "$authorDetails",
  });

  // Sort by creation date (newest first)
  pipeline.push({ $sort: { createdAt: -1 } });

  // Add pagination
  const skip = (page - 1) * limit;
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: limit });

  return this.aggregate(pipeline);
};

// Static method for analytics
blogPostSchema.statics.getAnalytics = function () {
  return this.aggregate([
    // Match only published blogs
    { $match: { isPublished: true } },

    // Facet for multiple analytics
    {
      $facet: {
        // Blogs per author
        blogsPerAuthor: [
          {
            $group: {
              _id: "$author",
              blogCount: { $sum: 1 },
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "_id",
              foreignField: "_id",
              as: "authorInfo",
              pipeline: [{ $project: { name: 1, email: 1 } }],
            },
          },
          {
            $unwind: "$authorInfo",
          },
          {
            $project: {
              _id: 0,
              author: "$authorInfo",
              blogCount: 1,
            },
          },
          { $sort: { blogCount: -1 } },
        ],

        // Most used tags
        mostUsedTags: [
          { $unwind: "$tags" },
          {
            $group: {
              _id: "$tags",
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              tag: "$_id",
              count: 1,
            },
          },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ],
      },
    },
  ]);
};

module.exports = mongoose.model("BlogPost", blogPostSchema);
