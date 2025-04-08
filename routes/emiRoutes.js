const express = require("express");
// const { addEMI, getEMIsForUser, payEMI, getOverdueEMIs, getUpcomingEMIs } = require("../controllers/emiController");
const { getEmiDetails } = require("../controllers/emiController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// router.post("/add", addEMI); // Add EMIs for a loan
// router.get("/:userId",protect, getEMIsForUser); // Get all EMIs for a user
// router.put("/pay/:emiId",protect, payEMI); // Pay an EMI
// router.get("/overdue/:userId",protect, getOverdueEMIs); // Get overdue EMIs
// router.get("/upcoming/:userId",protect, getUpcomingEMIs); // Get upcoming EMIs
router.get("/getEmiDetails/:loanId",protect, getEmiDetails);

module.exports = router;
