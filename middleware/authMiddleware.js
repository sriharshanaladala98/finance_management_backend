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
        console.log(decoded)
      // Find the user by decoded ID
      req.user = await Users.findById(decoded.id).select('-password');


      next();
    } catch (error) {
      res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

module.exports = { protect };