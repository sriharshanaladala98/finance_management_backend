const express = require("express");
const { addLoan, getLoans } = require("../controllers/loanController");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/add",protect, addLoan);
router.get("/:userId",protect, getLoans);

module.exports = router;
