const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  name: { type: String, required: true }, // Description of transaction
  type: { type: String, enum: ["income", "expense", "asset"], required: true },
  amount: { type: Number }, // For Income & Expense
  category: { type: String }, // Custom categories
  paymentType: { type: String, enum: ["UPI", "Card", "Credit Card", "Cash"] },
  upiApp: { type: String, enum: ["PhonePe", "Paytm", "Google Pay", "CRED", "ICICI UPI"] },
  bank: { type: String }, // Bank name for transactions
});

module.exports = mongoose.model("Transaction", transactionSchema);
