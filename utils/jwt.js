const jwt = require('jsonwebtoken');
const secretKey = require("dotenv");

secretKey.config();
const jwtSecrete = process.env.JWT_SECRET || '2c1c241ea7f882e6faeb4e1f74ea7037770153314c001fe8001f661fda9946ef';
console.log("JWT Secret:", jwtSecrete); // Add this line

// Function to sign a JWT token
const signToken = (user) => {
    try {
      return jwt.sign({ id: user.id }, jwtSecrete, { expiresIn: "10h" });
    } catch (error) {
      console.error("Error signing JWT token:", error);
      throw new Error("Token generation failed");
    }
  };

// Function to verify a JWT token
const verifyToken = (token) => {
    try {

      return jwt.verify(token, jwtSecrete);
    } catch (error) {
      console.error("JWT Verification Error:", error.message);
      throw new Error("Invalid token");
    }
  };
  
  
  
module.exports = { signToken, verifyToken };