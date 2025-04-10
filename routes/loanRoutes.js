const express = require("express");
const { addLoan, getLoans,updateEmiStatus,updateLoanStatus } = require("../controllers/loanController");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/add",protect, addLoan);
router.get("/:userId",protect, getLoans);
router.put('/update-emi-status', protect, updateEmiStatus);
router.put(
    '/update-loan-status',
    protect,
    updateLoanStatus
  );

module.exports = router;
