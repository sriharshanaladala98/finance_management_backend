const express = require("express");
const { addTransaction, getTransactions } = require("../controllers/transactionController");
const { protect } = require("../middleware/authMiddleware"); // Import protect middleware
const router = express.Router();

router.post("/add",protect, addTransaction);
router.get("/", protect, getTransactions); // 🔹 Add protect middleware

module.exports = router;
