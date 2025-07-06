const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

//===============================================================================>
/**
 * Authentication middleware - Verify JWT token
 */
//===============================================================================>
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided or invalid format.'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      console.log(token);
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id);

      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. User not found.'
        });
      }
      
      req.user = user;
      next();
    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

//===============================================================================>
/**
 * Role-based authorization middleware
 * @param {...String} roles - Allowed roles
 */
//===============================================================================>
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    console.log('User role:', req.user.role);
    if (!roles.includes(req.user.role)) {
      console.log('Access denied. Required roles:', roles);
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }
    
    next();
  };
};

//===============================================================================>
/**
 * Check if user owns the resource (for blog posts)
 */
//===============================================================================>
const checkOwnership = (Model) => {
  return async (req, res, next) => {
    try {
      const resource = await Model.findById(req.params.id);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }
      
      // Admin can access everything, or user must own the resource
      if (req.user.role === 'admin' || resource.author.toString() === req.user._id.toString()) {
        req.resource = resource;
        next();
      } else {
        res.status(403).json({
          success: false,
          message: 'Access denied. You can only modify your own resources.'
        });
      }
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during ownership verification'
      });
    }
  };
};

module.exports = {
  authenticate,
  authorize,
  checkOwnership
};
