const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  loanName: { type: String, required: true }, // e.g., Home Loan, Car Loan
  loanAmount: { type: Number, required: true },
  interestRate: { type: Number, required: true }, // Annual interest rate
  tenureMonths: { type: Number, required: true }, // Loan period in months
  startDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  emiAmount: { type: Number }, // Monthly EMI
});

module.exports = mongoose.model("Loan", loanSchema);


