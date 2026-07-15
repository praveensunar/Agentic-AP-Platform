const db = require('../models/db');

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication token missing or invalid.' });
    }

    const token = authHeader.split(' ')[1];
    
    // Parse mock token format: mock-token-{userId}-{role}
    if (!token.startsWith('mock-token-')) {
      return res.status(401).json({ success: false, message: 'Invalid token format.' });
    }

    const parts = token.split('-');
    if (parts.length < 4) {
      return res.status(401).json({ success: false, message: 'Malformed token.' });
    }

    const userId = parts[2];
    const user = db.findById('users', userId);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'User matching token session not found.' });
    }

    // Attach user profile to request object
    req.user = {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Unauthorized session.' });
  }
};

const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted. Required roles: [${allowedRoles.join(', ')}]`
      });
    }

    next();
  };
};

module.exports = { requireAuth, requireRole };
