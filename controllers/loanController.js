const Loan = require("../models/loanModel");

exports.addLoan = async (req, res) => {
    try {
      const { userId, loanName, loanAmount, interestRate, tenureMonths, startDate, dueDate } = req.body;
  
      // Convert annual interest rate to monthly rate
      const monthlyRate = interestRate / 100 / 12;
  
      // Calculate EMI using the correct formula
      const emiAmount = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) /
                        (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  
      // Create and save loan
      const loan = new Loan({ userId, loanName, loanAmount, interestRate, tenureMonths, startDate, dueDate, emiAmount });
      await loan.save();
  
      res.status(201).json({ message: "Loan added successfully", loan });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  };

exports.getLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ userId: req.user.id }).sort({ startDate: -1 });
    res.json(loans);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
