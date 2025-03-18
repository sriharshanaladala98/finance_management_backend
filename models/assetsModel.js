const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, // Ensuring userId is stored as ObjectId
        ref: "User", // Referencing the User model
        required: true
    },
    assetName: { type: String, required: true },
    purchaseValue: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["cash", "debit", "credit card", "upi"], required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Asset", assetSchema);
