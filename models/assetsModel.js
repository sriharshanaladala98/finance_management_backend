const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  assetName: { type: String, required: true },
  purchaseDate: { type: Date, required: true },
  purchaseValue: { type: Number, required: true },
  paymentMethod: { type: String, enum: ["Cash", "Debit Card", "Credit Card", "UPI"], required: true },
  upiApp: { type: String, enum: ["PhonePe", "Paytm", "Google Pay", "CRED", "ICICI UPI"] },
  bank: { type: String }, // If paid via bank account
});

module.exports = mongoose.model("Asset", assetSchema);
