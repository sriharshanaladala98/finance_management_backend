const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    assetName: { type: String, required: true },
    description: { type: String, required: true },
    purchaseValue: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["cash", "debit", "credit card", "upi"], required: true },
    acquiredDate: { type: Date, required: true },
    lastAuditedDate: { type: Date },
    auditFrequency: { 
        type: String, 
        enum: ["monthly", "quarterly", "yearly"], 
        default: "yearly" 
    },
    nextAuditDate: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Asset", assetSchema);
