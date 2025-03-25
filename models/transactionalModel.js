const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  name: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ["income", "expense"], required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  paymentType: { type: String, enum: ["Cash", "Card", "UPI"], required: true },
  cardType: { type: String, enum: ["Credit", "Debit"] },
  upiApp: { type: String },
  bank: { type: String }
});

module.exports = mongoose.model("Transaction", transactionSchema);
