const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  lenderName: {
    type: String,
    // removed required to make optional
  },
  loanName: {
    type: String,
    // removed required to make optional
  },
  loanAmount: {
    type: Number,
    // removed required to make optional
  },
  processingFee: {
    type: Number,
  },
  interestRate: {
    type: Number,
    // removed required to make optional
  },
  isEMIEligible: {
    type: Boolean,
    default: false,
  },
  tenureMonths: {
    type: Number,
    // removed required function to make optional
  },
  startDate: {
    type: Date,
    // removed required function to make optional
  },
  dueDate: {
    type: Date,
    // removed required function to make optional
  },
  emiAmount: {
    type: Number,
    // removed required function to make optional
  },
  totalInterest: {
    type: Number,
    // removed required to make optional
  },
  totalPayment: {
    type: Number,
    // removed required to make optional
  },
  amortizationSchedule: [{
    month: Number,
    emiAmount: Number,
    principalPaid: Number,
    interestPaid: Number,
    remainingBalance: Number,
    isPaid: { type: Boolean, default: false },
    paymentDate: Date,
    dueDate: Date,
  }],
  nextDueDate: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: ["Active", "Completed", "Defaulted"],
    default: "Active",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Loan", loanSchema);
