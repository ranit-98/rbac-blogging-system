const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

//================================================================================>
//================================================================================>

const authRoutes = require("./App/routes/authRoutes");
const userRoutes = require("./App/routes/userRoutes");
const blogRoutes = require("./App/routes/blogRoutes");

//================================================================================>
//================================================================================>

// Import middleware
const { apiLimiter } = require("./App/middleware/rateLimiter");

//================================================================================>
//================================================================================>

// Create Express app
const app = express();
app.use(express.json());
// Security middleware
app.use(helmet());

// CORS middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  })
);

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

//================================================================================>
//================================================================================>

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

//================================================================================>
//================================================================================>

// Rate limiting middleware
app.use("/api/", apiLimiter);

// Health check route
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Blog API is running!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

//================================================================================>
//================================================================================>

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/blogs", blogRoutes);

//================================================================================>
//================================================================================>

// Global error handler
app.use((error, req, res, next) => {
  console.error("Global error handler:", error);

  // Mongoose validation error
  if (error.name === "ValidationError") {
    const errors = Object.values(error.errors).map((err) => ({
      field: err.path,
      message: err.message,
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
  }

  // JWT errors
  if (error.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  if (error.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired",
    });
  }

  // Default error
  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal server error",
  });
});

//================================================================================>
//================================================================================>

module.exports = app;
