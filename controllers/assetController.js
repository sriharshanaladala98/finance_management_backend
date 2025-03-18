const Asset = require("../models/assetsModel");
const mongoose = require("mongoose");

exports.addAsset = async (req, res) => {
    try {
        const { userId, assetName, purchaseValue, paymentMethod } = req.body;
        const newAsset = new Asset({ userId, assetName, purchaseValue, paymentMethod });

        await newAsset.save();
        res.status(201).json({ message: "Asset added successfully", asset: newAsset });
    } catch (error) {
        console.error("Asset creation error:", error);
        res.status(500).json({ message: "Server error", error });
    }
};



exports.getAssets = async (req, res) => {
  try {
    const assets = await Asset.find({ userId: req.user.id }).sort({ purchaseDate: -1 });
    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
