const express = require("express");
const {
    registerUser,
    loginUser,
    getCurrentUser,
    addBankAccount,
    addCreditCard,
    updateCashBalance,
    getUserBalances
} = require("../controllers/userController");

const router = express.Router();



router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/currentuser", getCurrentUser);

router.post("/add-bank", addBankAccount);
router.post("/add-card", addCreditCard);
router.post("/update-cash", updateCashBalance);
router.get("/:userId/balances", getUserBalances);


module.exports = router;
