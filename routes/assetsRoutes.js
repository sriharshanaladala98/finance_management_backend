const express = require("express");
const { addAsset, getAssets } = require("../controllers/assetController");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/add",protect, addAsset);
router.get("/",protect, getAssets);

module.exports = router;
