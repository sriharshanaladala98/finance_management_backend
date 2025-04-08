// const EMI = require("../models/emiModel");
const Loan = require("../models/loanModel");

// // 1. Add EMI Records (Called when a new Loan is added)
// exports.addEMI = async (req, res) => {
//   try {
//     const { loanId, userId, emiAmount, tenureMonths, startDate } = req.body;

//     const emis = [];
//     let currentDueDate = new Date(startDate);

//     for (let i = 1; i <= tenureMonths; i++) {
//       const emi = new EMI({
//         loanId,
//         userId,
//         month: currentDueDate.getMonth() + 1,
//         year: currentDueDate.getFullYear(),
//         emiAmount,
//         principalAmount: emiAmount * 0.7, // Assuming 70% principal, 30% interest
//         interestAmount: emiAmount * 0.3,
//         dueDate: new Date(currentDueDate),
//         status: "Pending",
//         lastDueAmount: 0,
//         upcomingDueAmount: emiAmount
//       });

//       emis.push(emi);
//       currentDueDate.setMonth(currentDueDate.getMonth() + 1); // Move to next month
//     }

//     await EMI.insertMany(emis);
//     res.status(201).json({ message: "EMIs added successfully", emis });

//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// };

// // 2. Get all EMIs for a specific User
// exports.getEMIsForUser = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const emis = await EMI.find({ userId }).populate("loanId");
//     res.json(emis);
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// };

// // 3. Update EMI Status to "Paid"
// exports.payEMI = async (req, res) => {
//   try {
//     const { emiId } = req.params;
//     const emi = await EMI.findById(emiId);

//     if (!emi) {
//       return res.status(404).json({ message: "EMI not found" });
//     }

//     if (emi.status === "Paid") {
//       return res.status(400).json({ message: "EMI is already paid" });
//     }

//     const nextDueDate = new Date(emi.dueDate);
//     nextDueDate.setMonth(nextDueDate.getMonth() + 1); // Set next EMI due date

//     emi.status = "Paid";
//     emi.paidDate = new Date();
//     emi.lastDueAmount = emi.emiAmount;
//     emi.upcomingDueAmount = emi.emiAmount; // Assume next EMI is the same amount
//     emi.overdueDays = 0;

//     await emi.save();

//     res.json({ message: "EMI paid successfully", emi });

//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// };

// // 4. Get Overdue EMIs
// exports.getOverdueEMIs = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const overdueEMIs = await EMI.find({ userId, status: "Pending", dueDate: { $lt: new Date() } }).populate("loanId");
//     res.json(overdueEMIs);
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// };

// // 5. Get Upcoming EMIs
// exports.getUpcomingEMIs = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     console.log("User ID:", userId);
//     console.log("Current Date:", new Date());

//     const upcomingEMIs = await EMI.find({
//       userId,
//       status: "Pending",
//       dueDate: { $gte: new Date() }
//     }).populate("loanId");

//     if (!upcomingEMIs.length) {
//       return res.json({ message: "No upcoming EMIs found." });
//     }

//     res.json(upcomingEMIs);
//   } catch (error) {
//     console.error("Error fetching upcoming EMIs:", error);
//     res.status(500).json({ message: "Server error", error });
//   }
// };

exports.getEmiDetails = async (req, res) => {
  try {
    const { loanId } = req.params; // Loan ID from request URL

    if (!loanId) {
      return res.status(400).json({ message: "Loan ID is required" });
    }

    // Fetch loan details by loanId
    const loan = await Loan.findById(loanId);

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    // Extract EMI details
    const emiDetails = {
      loanId: loan._id,
      lenderName: loan.lenderName,
      loanName: loan.loanName,
      loanAmount: loan.loanAmount,
      interestRate: loan.interestRate,
      tenureMonths: loan.tenureMonths,
      startDate: loan.startDate,
      dueDate: loan.dueDate,
      emiAmount: loan.emiAmount,
      totalInterest: loan.totalInterest,
      totalPayment: loan.totalPayment,
      amortizationSchedule: loan.amortizationSchedule,
      status: loan.status,
    };

    res.status(200).json(emiDetails);
  } catch (error) {
    console.error("Error fetching EMI details:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

