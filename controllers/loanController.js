const Loan = require("../models/loanModel");
const mongoose = require("mongoose");

exports.addLoan = async (req, res) => {
  try {
    const { userId, lenderName, loanName, loanAmount, interestRate, tenureMonths, startDate, dueDate, processingFee } = req.body;

    // Remove strict all fields required check to allow partial data submission
    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const loanAmt = loanAmount ? Number(loanAmount) : 0;
    const tenure = tenureMonths ? Number(tenureMonths) : 0;
    const rate = interestRate ? Number(interestRate) / 12 / 100 : 0;
    const fee = processingFee ? Number(processingFee) : 0;

    let emiAmount = 0;
    if (rate > 0 && tenure > 0) {
      emiAmount = (loanAmt * rate * Math.pow(1 + rate, tenure)) / (Math.pow(1 + rate, tenure) - 1);
    } else if (tenure > 0) {
      emiAmount = loanAmt / tenure;
    }
    emiAmount = parseFloat(emiAmount.toFixed(2));

    let totalInterest = 0;
    let totalPayment = 0;
    if (tenure > 0) {
      totalInterest = parseFloat((emiAmount * tenure - loanAmt).toFixed(2));
      totalPayment = parseFloat((loanAmt + totalInterest + fee).toFixed(2));
    } else {
      // For non-EMI loans, calculate simple interest based on startDate and dueDate
      let durationInYears = 0;
      if (startDate && dueDate) {
        const start = new Date(startDate);
        const due = new Date(dueDate);
        const diffTime = due.getTime() - start.getTime();
        durationInYears = diffTime / (1000 * 60 * 60 * 24 * 365);
        if (durationInYears < 0) durationInYears = 0;
      }
      totalInterest = parseFloat((loanAmt * (interestRate / 100) * durationInYears).toFixed(2));
      totalPayment = parseFloat((loanAmt + totalInterest + fee).toFixed(2));
    }

    const amortizationSchedule = [];
    let remainingBalance = loanAmt;

    for (let i = 0; i < tenure; i++) {
      const scheduleDueDate = dueDate ? new Date(dueDate) : new Date();
      scheduleDueDate.setMonth(scheduleDueDate.getMonth() + i);

      const interestPaid = parseFloat((remainingBalance * rate).toFixed(2));
      const principalPaid = parseFloat((emiAmount - interestPaid).toFixed(2));
      remainingBalance -= principalPaid;

      amortizationSchedule.push({
        month: i + 1,
        emiAmount,
        interestPaid,
        principalPaid,
        remainingBalance: parseFloat(remainingBalance.toFixed(2)),
        dueDate: scheduleDueDate,
        isPaid: false,
        paymentDate: null
      });
    }

    let nextDue = null;
    if (amortizationSchedule.length > 0) {
      nextDue = amortizationSchedule[0].dueDate;
    } else {
      nextDue = dueDate || startDate || new Date();
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
      amortizationSchedule,
      nextDueDate: nextDue,
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

    const loansWithBalance = loans.map(loan => {
      let remainingBalance = loan.loanAmount;

      if (loan.amortizationSchedule) {
        const paidSchedules = loan.amortizationSchedule.filter(s => s.isPaid);
        paidSchedules.forEach(schedule => {
          remainingBalance -= schedule.principalPaid;
        });

        remainingBalance = Math.max(0, remainingBalance);

        // For loans with isEMIEligible false, use initial dueDate as nextDueDate
        const nextDue = loan.isEMIEligible
          ? loan.amortizationSchedule.find(s => !s.isPaid)?.dueDate || null
          : loan.dueDate || loan.startDate || new Date();

        return {
          ...loan.toObject(),
          remainingBalance: parseFloat(remainingBalance.toFixed(2)),
          nextDueDate: nextDue
        };
      }

      return loan;
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

    if (!mongoose.Types.ObjectId.isValid(loanId) || !mongoose.Types.ObjectId.isValid(scheduleId)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    const schedule = loan.amortizationSchedule.id(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    schedule.isPaid = isPaid;
    schedule.paymentDate = isPaid ? new Date() : null;

    let runningBalance = schedule.remainingBalance;
    if (isPaid) {
      runningBalance -= schedule.principalPaid;
    }

    const scheduleIndex = loan.amortizationSchedule.findIndex(s => s._id.equals(scheduleId));
    for (let i = scheduleIndex + 1; i < loan.amortizationSchedule.length; i++) {
      loan.amortizationSchedule[i].remainingBalance = runningBalance;
      runningBalance -= loan.amortizationSchedule[i].principalPaid;
      if (runningBalance < 0) runningBalance = 0;
    }

    const paidCount = loan.amortizationSchedule.filter(s => s.isPaid).length;
    const totalCount = loan.amortizationSchedule.length;

    loan.status = paidCount === totalCount ? "Completed" : "Active";

    const nextDue = loan.amortizationSchedule.find(s => !s.isPaid)?.dueDate || null;
    loan.nextDueDate = nextDue;

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

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    // For non-EMI loans, auto-update status based on dueDate and payment
    if (!loan.isEMIEligible) {
      const now = new Date();
      if (status === "Completed") {
        loan.status = "Completed";
      } else if (now > loan.dueDate) {
        loan.status = "Defaulted";
      } else {
        loan.status = "Active";
      }
      await loan.save();
      return res.status(200).json({
        message: "Loan status updated successfully for non-EMI loan",
        loan,
      });
    }

    // For EMI loans, update status as requested
    loan.status = status;
    await loan.save();

    res.status(200).json({
      message: "Loan status updated successfully",
      loan,
    });
  } catch (error) {
    console.error("Error updating loan status:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

exports.payNonEmiLoan = async (req, res) => {
  try {
    const { loanId, paymentAmount } = req.body;

    if (!mongoose.Types.ObjectId.isValid(loanId)) {
      return res.status(400).json({ message: "Invalid Loan ID format" });
    }

    if (!paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({ message: "Invalid payment amount" });
    }

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    if (loan.isEMIEligible) {
      return res.status(400).json({ message: "This endpoint is for non-EMI loans only" });
    }

    // Here you can add logic to record the payment transaction if needed

    // Mark loan as completed if paymentAmount covers totalPayment
    if (paymentAmount >= loan.totalPayment) {
      loan.status = "Completed";
      loan.nextDueDate = null;
    } else {
      // Partial payment logic can be added here if needed
      loan.status = "Active";
    }

    await loan.save();

    res.status(200).json({
      message: "Non-EMI loan payment processed successfully",
      loan,
    });
  } catch (error) {
    console.error("Error processing non-EMI loan payment:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
