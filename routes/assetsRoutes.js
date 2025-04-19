const express = require("express");
const { addAsset, getAssets,getAsset,updateAsset,deleteAsset,recordAudit} = require("../controllers/assetController");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/",protect,addAsset);

// Get all assets for user
router.get("/", protect,getAssets);

// Get single asset
router.get("/:id",protect,getAsset);

// Update asset
router.put("/:id",protect,updateAsset);

// Delete asset
router.delete("/:id",protect,deleteAsset);

// Record asset audit
router.post("/:id/audit",protect,recordAudit);

module.exports = router;

module.exports = router;
