const mongoose = require("mongoose");

const emiSchema = new mongoose.Schema({
  loanId: { type: mongoose.Schema.Types.ObjectId, ref: "Loan", required: true },
  month: { type: Number, required: true }, // EMI Month (1,2,3,...)
  year: { type: Number, required: true },
  emiAmount: { type: Number, required: true },
  principalAmount: { type: Number, required: true },
  interestAmount: { type: Number, required: true },
  status: { type: String, enum: ["Paid", "Pending"], default: "Pending" }
});

module.exports = mongoose.model("EMI", emiSchema);
