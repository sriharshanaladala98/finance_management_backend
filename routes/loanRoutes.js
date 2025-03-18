const express = require("express");
const { addLoan, getLoans } = require("../controllers/loanController");
const router = express.Router();

router.post("/add", addLoan);
router.get("/", getLoans);

module.exports = router;
