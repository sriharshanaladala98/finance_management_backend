const express = require("express");
const { addTransaction, getTransactions, getPrecomputedBalances } = require("../controllers/transactionController");
const { protect } = require("../middleware/authMiddleware"); // Import protect middleware
const router = express.Router();

router.post("/add", protect, addTransaction);
router.get("/", protect, getTransactions); // 🔹 Add protect middleware
router.get("/aggregated-balances", protect, getPrecomputedBalances);

module.exports = router;
