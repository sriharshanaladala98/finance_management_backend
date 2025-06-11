const Loan = require("../models/loanModel");
const { v4: uuidv4 } = require("uuid");

exports.addLoan = async (req, res) => {
  try {
    const { userId, lenderName, loanName, loanAmount, interestRate, tenureMonths, startDate, dueDate, processingFee, isEMIEligible } = req.body;

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
        _id: uuidv4(),
        month: i + 1,
        emiAmount,
        interestPaid,
        principalPaid,
        remainingBalance: parseFloat(remainingBalance.toFixed(2)),
        dueDate: scheduleDueDate.toISOString(),
        isPaid: false,
        paymentDate: null
      });
    }

    let nextDue = null;
    if (amortizationSchedule.length > 0) {
      nextDue = amortizationSchedule[0].dueDate;
    } else {
      nextDue = dueDate || startDate || new Date().toISOString();
    }

    const newLoan = {
      user_id: userId,
      lender_name: lenderName,
      loan_name: loanName,
      loan_amount: loanAmt,
      interest_rate: interestRate,
      tenure_months: tenure,
      start_date: startDate ? new Date(startDate).toISOString() : null,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      processing_fee: fee,
      emi_amount: emiAmount,
      total_interest: totalInterest,
      total_payment: totalPayment,
      amortization_schedule: JSON.stringify(amortizationSchedule),
      next_due_date: nextDue,
      is_emi_eligible: isEMIEligible === true,
    };

    const createdLoan = await Loan.addLoan(newLoan);
    res.status(201).json({ message: "Loan added successfully", loan: createdLoan });
  } catch (error) {
    console.error("Error adding loan:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

exports.getLoans = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const loans = await Loan.getLoansByUserId(userId);

    if (!loans || loans.length === 0) {
      return res.status(404).json({ message: "No loans found for this user" });
    }

    // Import client for DB queries
    const client = require('../config/postgres');

    // For each loan, fetch amortization schedules from amortization_schedules table
    const loansWithBalance = await Promise.all(loans.map(async (loan) => {
      console.log("Loan id for amortization query:", loan.id);
      const amortizationQuery = 'SELECT * FROM amortization_schedules WHERE loan_id = $1 ORDER BY month ASC';
      const amortizationResult = await client.query(amortizationQuery, [loan.id]);
      const amortizationSchedule = amortizationResult.rows;

      let remainingBalance = loan.total_payment || 0;

      if (amortizationSchedule.length > 0) {
        const paidSchedules = amortizationSchedule.filter(s => s.is_paid);
        const totalPaidAmount = paidSchedules.reduce((sum, schedule) => {
          const principal = parseFloat(schedule.principal_paid) || 0;
          const interest = parseFloat(schedule.interest_paid) || 0;
          return sum + principal + interest;
        }, 0);
        // Calculate remaining balance as (total loan amount + interest) - amount paid
        remainingBalance = (loan.loan_amount + (loan.total_interest || 0)) - totalPaidAmount;

        remainingBalance = Math.max(0, remainingBalance);

        const nextDue = loan.is_emi_eligible
          ? amortizationSchedule.find(s => !s.is_paid)?.due_date || null
          : loan.due_date || loan.start_date || new Date();

        // Get next unpaid amortization schedule entry for next EMI amount
        const nextUnpaidSchedule = amortizationSchedule.find(s => !s.is_paid);
        const nextEmiAmount = nextUnpaidSchedule ? nextUnpaidSchedule.emiAmount : remainingBalance;

        return {
          ...loan,
          amortizationSchedule,
          remainingBalance: parseFloat(nextEmiAmount.toFixed(2)),
          remaining_balance: parseFloat(nextEmiAmount.toFixed(2)),
          nextDueDate: nextDue,
          status: loan.status,
          amortizationScheduleRaw: amortizationSchedule,
          nextEmiAmount: nextEmiAmount
        };
      }

      const nextDue = loan.due_date || loan.start_date || null;
      // Set remaining_balance to total_payment if loan is active and no amortization schedules
      const remBalance = loan.status === "Active" ? loan.total_payment : null;
      return {
        ...loan,
        amortizationSchedule: [],
        remaining_balance: remBalance,
        nextDueDate: nextDue
      };
    }));

    res.status(200).json(loansWithBalance);
  } catch (error) {
    console.error("Error fetching loans:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

exports.updateEmiStatus = async (req, res) => {
  try {
    const { loanId, scheduleId, isPaid, userId } = req.body;

    console.log("updateEmiStatus called with loanId:", loanId, "scheduleId:", scheduleId, "isPaid:", isPaid);
    console.log("Type of loanId:", typeof loanId, "Length:", loanId ? loanId.length : 0);
    console.log("Type of scheduleId:", typeof scheduleId, "Length:", scheduleId ? scheduleId.length : 0);

    if (!loanId || !scheduleId) {
      return res.status(400).json({ message: "Loan ID and Schedule ID are required" });
    }

    const client = require('../config/postgres');

    // Fetch the loan to get amortization_schedule JSON
    const loanRes = await client.query('SELECT amortization_schedule FROM loans WHERE id = $1', [loanId]);
    if (loanRes.rowCount === 0) {
      return res.status(404).json({ message: "Loan not found" });
    }

    let amortizationSchedule;
    try {
      const rawSchedule = loanRes.rows[0].amortization_schedule;
      if (typeof rawSchedule === 'string') {
        amortizationSchedule = JSON.parse(rawSchedule);
      } else if (typeof rawSchedule === 'object') {
        amortizationSchedule = rawSchedule;
      } else {
        throw new Error('Invalid amortization_schedule format');
      }
    } catch (err) {
      console.error("Failed to parse amortization_schedule JSON:", err);
      return res.status(500).json({ message: "Failed to parse amortization schedule" });
    }

    // Find the schedule by _id
    const scheduleIndex = amortizationSchedule.findIndex(s => s._id === scheduleId);
    if (scheduleIndex === -1) {
      return res.status(404).json({ message: "Schedule not found in amortization schedule" });
    }

    // Update the schedule entry
    amortizationSchedule[scheduleIndex].isPaid = isPaid;
    amortizationSchedule[scheduleIndex].paymentDate = isPaid ? new Date().toISOString() : null;

    // Calculate loan status and next due date
    const paidCount = amortizationSchedule.filter(s => s.isPaid).length;
    const totalCount = amortizationSchedule.length;
    const loanStatus = paidCount === totalCount ? "Completed" : "Active";
    const nextDueSchedule = amortizationSchedule.find(s => !s.isPaid);
    const nextDue = nextDueSchedule ? nextDueSchedule.dueDate : null;

    // Update the amortization_schedule JSON and loan status in loans table
    await client.query(
      'UPDATE loans SET amortization_schedule = $1, status = $2, next_due_date = $3, updated_at = NOW() WHERE id = $4',
      [JSON.stringify(amortizationSchedule), loanStatus, nextDue, loanId]
    );

    res.status(200).json({
      message: "EMI status updated",
      amortizationSchedule,
      status: loanStatus,
      nextDueDate: nextDue,
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
    const { loanId, status, userId } = req.body;

    if (!loanId) {
      return res.status(400).json({ message: "Loan ID is required" });
    }

    const validStatuses = ["Active", "Completed", "Defaulted"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const loans = await Loan.getLoansByUserId(userId);
    const loan = loans.find(l => l.id === loanId);
    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    if (!loan.isEMIEligible) {
      const now = new Date();
      if (status === "Completed") {
        loan.status = "Completed";
      } else if (now > loan.dueDate) {
        loan.status = "Defaulted";
      } else {
        loan.status = "Active";
      }
      await Loan.updateLoan(loanId, { status: loan.status });
      return res.status(200).json({
        message: "Loan status updated successfully for non-EMI loan",
        loan,
      });
    }

    loan.status = status;
    await Loan.updateLoan(loanId, { status });

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
    const { loanId, paymentAmount, userId } = req.body;

    console.log("payNonEmiLoan called with loanId:", loanId, "paymentAmount:", paymentAmount, "userId:", userId);

    if (!loanId) {
      return res.status(400).json({ message: "Loan ID is required" });
    }

    if (!paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({ message: "Invalid payment amount" });
    }

    const loans = await Loan.getLoansByUserId(userId);
    console.log("Loans fetched for user:", userId, loans);

    const loan = loans.find(l => l.id === loanId);
    if (!loan) {
      console.error("Loan not found for loanId:", loanId);
      return res.status(404).json({ message: "Loan not found" });
    }

    if (loan.isEMIEligible) {
      return res.status(400).json({ message: "This endpoint is for non-EMI loans only" });
    }

    if (paymentAmount >= loan.total_payment) {
      loan.status = "Closed";
      loan.nextDueDate = null;
    } else {
      loan.status = "Active";
    }

    await Loan.updateLoan(loanId, { status: loan.status, next_due_date: loan.nextDueDate });

    res.status(200).json({
      message: "Non-EMI loan payment processed successfully",
      loan,
    });
  } catch (error) {
    console.error("Error processing non-EMI loan payment:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
