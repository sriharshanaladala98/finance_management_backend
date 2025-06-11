const { verifyToken } = require('../utils/jwt');
const Users = require('../models/userModel');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      console.log("Received Token:", token);

      // Verify token
      const decoded = verifyToken(token);
      console.log("Decoded Token:", decoded);
      // Find the user by decoded ID
      req.user = await Users.getUserById(decoded.id);
      console.log("Authenticated User:", req.user);

      next();
    } catch (error) {
      console.error("Auth Middleware Error:", error);
      res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

module.exports = { protect };