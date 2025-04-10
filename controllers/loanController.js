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
    const rate = Number(interestRate) / 12 / 100;
    const fee = Number(processingFee);

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
    for (let i = 1; i <= tenure; i++) {
      const interestPaid = parseFloat((remainingBalance * rate).toFixed(2));
      const principalPaid = parseFloat((emiAmount - interestPaid).toFixed(2));
      
      amortizationSchedule.push({
        month: i,
        emiAmount: parseFloat(emiAmount.toFixed(2)),
        principalPaid,
        interestPaid,
        remainingBalance: parseFloat(remainingBalance.toFixed(2)),
        isPaid: false
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
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID format" });
    }

    const loans = await Loan.find({ userId });
    
    if (!loans.length) {
      return res.status(404).json({ message: "No loans found for this user" });
    }

    // Calculate remaining balance for each loan
    const loansWithBalance = loans.map(loan => {
      let remainingBalance = loan.loanAmount;
      if (loan.amortizationSchedule) {
        const paidSchedules = loan.amortizationSchedule.filter(s => s.isPaid);
        paidSchedules.forEach(schedule => {
          remainingBalance -= schedule.principalPaid;
        });
        remainingBalance = Math.max(0, remainingBalance);
      }
      
      return {
        ...loan.toObject(),
        remainingBalance: parseFloat(remainingBalance.toFixed(2))
      };
    });

    res.status(200).json(loansWithBalance);
  } catch (error) {
    console.error("Error fetching loans:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
exports.updateEmiStatus = async (req, res) => {
  try {
    const { loanId, scheduleId, isPaid } = req.body;
    
    // Validate input
    if (!mongoose.Types.ObjectId.isValid(loanId) || 
        !mongoose.Types.ObjectId.isValid(scheduleId)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    const schedule = loan.amortizationSchedule.id(scheduleId);
schedule.isPaid = isPaid;
schedule.paymentDate = isPaid ? new Date() : null;

    // // Update payment status
    // schedule.isPaid = isPaid;
    // schedule.paymentDate = isPaid ? new Date() : null;

    // Recalculate remaining balances
    let runningBalance = schedule.remainingBalance;
    if (isPaid) {
      runningBalance -= schedule.principalPaid;
    }

    // Update subsequent payments
    const scheduleIndex = loan.amortizationSchedule.findIndex(s => s._id.equals(scheduleId));
    for (let i = scheduleIndex + 1; i < loan.amortizationSchedule.length; i++) {
      loan.amortizationSchedule[i].remainingBalance = runningBalance;
      runningBalance -= loan.amortizationSchedule[i].principalPaid;
      if (runningBalance < 0) runningBalance = 0;
    }

    // Check payment statuses
    const paidCount = loan.amortizationSchedule.filter(s => s.isPaid).length;
    const totalCount = loan.amortizationSchedule.length;

    // Update loan status
    loan.status = paidCount === totalCount ? "Completed" : "Active";

    await loan.save();
    res.status(200).json({ 
      message: "EMI status updated", 
      loan,
      paidCount,
      totalCount
    });
  } catch (error) {
    console.error("Error updating EMI status:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateLoanStatus = async (req, res) => {
  try {
    const { loanId, status } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(loanId)) {
      return res.status(400).json({ message: "Invalid Loan ID format" });
    }

    const validStatuses = ["Active", "Completed", "Defaulted"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const updatedLoan = await Loan.findByIdAndUpdate(
      loanId,
      { status },
      { new: true }
    );

    if (!updatedLoan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    res.status(200).json({
      message: "Loan status updated successfully",
      loan: updatedLoan
    });
  } catch (error) {
    console.error("Error updating loan status:", error);
    res.status(500).json({ message: "Server error", error });
  }
};