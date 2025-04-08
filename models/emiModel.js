const mongoose = require("mongoose");

const emiSchema = new mongoose.Schema({
  loanId: { type: mongoose.Schema.Types.ObjectId, ref: "Loan", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  emiAmount: { type: Number, required: true },
  principalAmount: { type: Number, required: true },
  interestAmount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ["Paid", "Pending"], default: "Pending" },
  paidDate: { type: Date },
  overdueDays: { type: Number, default: 0 },
  lastDueAmount: { type: Number, default: 0 },
  upcomingDueAmount: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 }, // Track partial payments
  remainingAmount: { type: Number, default: function() { return this.emiAmount; } }, // Auto-calculate
  paymentMethod: { type: String, enum: ["UPI", "Bank Transfer", "Credit Card", "Cash"], default: "UPI" }
});

// Automatically update overdueDays & EMI status
emiSchema.pre("save", function (next) {
  if (this.status === "Pending") {
    const today = new Date();
    if (today > this.dueDate) {
      const diffTime = Math.abs(today - this.dueDate);
      this.overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert ms to days
    } else {
      this.overdueDays = 0;
    }
  }
  if (this.paidAmount >= this.emiAmount) {
    this.status = "Paid";
    this.paidDate = new Date();
  }
  next();
});

module.exports = mongoose.model("EMI", emiSchema);
