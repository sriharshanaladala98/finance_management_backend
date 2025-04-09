const express = require("express");
const {
    registerUser,
    loginUser,
    getCurrentUser,
    addBankAccount,
    addCreditCard,
    updateCashBalance,
    getUserBalances,
    addUpiApp,
    updateUpiApp,
    deleteUpiApp,
    updateBankAccount,
    deleteBankAccount,
    updateCreditCard,
    deleteCreditCard
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/currentuser", getCurrentUser);

router.post("/add-bank", protect, addBankAccount);
router.post("/add-card", protect, addCreditCard);
router.put('/update-card', protect, updateCreditCard);
router.delete('/delete-card', protect, deleteCreditCard);

router.post("/add-upi", protect, addUpiApp);
router.put("/update-upi", protect, updateUpiApp);
router.delete("/delete-upi", protect, deleteUpiApp);

router.post("/update-cash", protect, updateCashBalance);
router.get("/:userId/balances", getUserBalances);
router.put('/bank/:accountNumber', protect, updateBankAccount);
router.delete('/bank/:accountNumber', protect, deleteBankAccount);
module.exports = router;
