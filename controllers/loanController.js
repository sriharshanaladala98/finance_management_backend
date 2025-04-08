const Loan = require("../models/loanModel");
const mongoose = require("mongoose");

exports.addLoan = async (req, res) => {
  try {
    const { userId, lenderName, loanName, loanAmount, interestRate, tenureMonths, startDate, dueDate, processingFee } = req.body;

    // Validate required fields
    if (!userId || !lenderName || !loanName || !loanAmount || !interestRate || !tenureMonths || !startDate || !dueDate || !processingFee) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const loanAmt = Number(loanAmount);
    const tenure = Number(tenureMonths);
    const rate = Number(interestRate) / 12 / 100; // Monthly Interest Rate
    const fee = Number(processingFee);

    if (isNaN(loanAmt) || isNaN(tenure) || isNaN(rate) || isNaN(fee)) {
      return res.status(400).json({ message: "Invalid loan details provided." });
    }

    // EMI Calculation
    let emiAmount = 0;
    if (rate > 0) {
      emiAmount = (loanAmt * rate * Math.pow(1 + rate, tenure)) / (Math.pow(1 + rate, tenure) - 1);
      emiAmount = parseFloat(emiAmount.toFixed(2));
    } else {
      emiAmount = parseFloat((loanAmt / tenure).toFixed(2));
    }

    const totalInterest = parseFloat((emiAmount * tenure - loanAmt).toFixed(2));
    const totalPayment = parseFloat((loanAmt + totalInterest + fee).toFixed(2));

    // Generate Amortization Schedule
    let remainingBalance = loanAmt;
    const amortizationSchedule = [];

    for (let i = 1; i <= tenure; i++) {
      const interestPaid = parseFloat((remainingBalance * rate).toFixed(2));
      const principalPaid = parseFloat((emiAmount - interestPaid).toFixed(2));
      const tax = parseFloat((emiAmount - principalPaid).toFixed(2));

      amortizationSchedule.push({
        month: i,
        emiAmount: emiAmount.toFixed(2),
        principalPaid: principalPaid.toFixed(2),
        interestPaid: interestPaid.toFixed(2),
        tax: tax.toFixed(2),
        remainingBalance: remainingBalance.toFixed(2),
      });

      remainingBalance -= principalPaid;
      if (remainingBalance < 0.01) remainingBalance = 0;
    }

    const newLoan = new Loan({
      userId,
      lenderName,
      loanName,
      loanAmount: loanAmt,
      interestRate,
      tenureMonths: tenure,
      startDate,
      dueDate,
      processingFee: fee,
      emiAmount,
      totalInterest,
      totalPayment,
      status: "Active",
      amortizationSchedule,
    });

    await newLoan.save();
    res.status(201).json({ message: "Loan added successfully", loan: newLoan });
  } catch (error) {
    console.error("Error adding loan:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

exports.getLoans = async (req, res) => {
  try {
    const { userId } = req.params; // Extract userId from URL params

    // Validate userId as a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID format" });
    }

    const loans = await Loan.find({ userId });

    if (!loans.length) {
      return res.status(404).json({ message: "No loans found for this user" });
    }

    res.status(200).json(loans);
  } catch (error) {
    console.error("Error fetching loans:", error);
    res.status(500).json({ message: "Server error", error });
  }
};