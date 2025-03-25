const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  name: { type: String, required: true },
  description: { type: String },
  type: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  paymentType: { type: String, required: true },
  cardType: { type: String},
  upiApp: { type: String },
  bank: { type: String }
});

module.exports = mongoose.model("Transaction", transactionSchema);
