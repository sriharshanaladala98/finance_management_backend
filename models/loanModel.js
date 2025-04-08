const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  lenderName: {
    type: String,
    required: true,
  },
  loanName: {
    type: String,
    required: true,
  },
  loanAmount: {
    type: Number,
    required: true,
  },
  processingFee: {
    type: Number,
    required: true,
  },
  interestRate: {
    type: Number,
    required: true,
  },
  isEMIEligible: {
    type: Boolean,
    default: false,
  },
  tenureMonths: {
    type: Number,
    required: function () {
      return this.isEMIEligible;
    },
  },
  startDate: {
    type: Date,
    required: function () {
      return !this.isEMIEligible;
    },
  },
  dueDate: {
    type: Date,
    required: function () {
      return !this.isEMIEligible;
    },
  },
  emiAmount: {
    type: Number,
    required: function () {
      return this.isEMIEligible;
    },
  },
  totalInterest: {
    type: Number,
    required: true,
  },
  totalPayment: {
    type: Number,
    required: true,
  },
  amortizationSchedule: [
    {
      month: Number,
      emiAmount: Number,
      principalPaid: Number,
      interestPaid: Number,
      remainingBalance: Number,
      actualPaidAmount: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      paid: { type: Boolean, default: false },
    },
  ],
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
