const mongoose = require("mongoose");

const emiSchema = new mongoose.Schema({
  loanId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Loan", 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  month: { type: Number, required: true }, // EMI Month (1,2,3,...)
  year: { type: Number, required: true },
  emiAmount: { type: Number, required: true }, // Monthly EMI Amount
  principalAmount: { type: Number, required: true }, // Principal Paid in EMI
  interestAmount: { type: Number, required: true }, // Interest Paid in EMI
  dueDate: { type: Date, required: true }, // EMI Due Date
  status: { type: String, enum: ["Paid", "Pending"], default: "Pending" }, // EMI Status
  paidDate: { type: Date }, // Payment Date (if paid)
  overdueDays: { type: Number, default: 0 }, // Days past due date
  lastDueAmount: { type: Number, default: 0 }, // Last EMI amount due
  upcomingDueAmount: { type: Number, default: 0 }, // Next EMI due amount
});

// Middleware to calculate overdue days before saving
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
  next();
});

module.exports = mongoose.model("EMI", emiSchema);

