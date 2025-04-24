const Transaction = require("../models/transactionalModel");
const User = require("../models/userModel");
const DailyBalance = require("../models/dailyBalanceModel");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const cron = require("node-cron");


exports.addTransaction = async (req, res) => {
  try {
    let {
      userId,
      date,
      name,
      description,
      type,
      amount,
      category,
      paymentType,
      cardType,
      upiApp,
      bank
    } = req.body;

    // ✅ Normalize all user inputs
    type = type?.toLowerCase().trim(); // 'income' | 'expense'
    paymentType = paymentType?.toLowerCase().trim(); // 'cash' | 'card' | 'upi' | 'banktransfer'
    cardType = cardType?.toLowerCase().trim(); // 'credit card' | 'debit card'
    bank = bank?.trim();
    category = category?.trim();
    name = name?.trim();
    description = description?.trim();
    amount = Number(amount);

    if (!userId || !type || !amount || !paymentType || isNaN(amount)) {
      return res.status(400).json({ message: "Missing or invalid required fields." });
    }

    const transaction = new Transaction({
      userId,
      date: new Date(date),
      name,
      description,
      type,
      amount,
      category,
      paymentType,
      cardType,
      upiApp,
      bank
    });

    await transaction.save();

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Handle Cash
    if (paymentType === "cash") {
      user.cashBalance += type === "income" ? amount : -amount;
    }

    // ✅ Handle Card
    if (paymentType === "card") {
      if (cardType === "credit card") {
        const creditCard = user.creditCards.find(card => card.cardName === bank);
        if (creditCard) {
          if (type === "expense") {
            creditCard.creditDue += amount;
            creditCard.creditAvailable -= amount;
          } else if (type === "income") {
            creditCard.creditDue = Math.max(0, creditCard.creditDue - amount);
            creditCard.creditAvailable += amount;
          }
        }
      } else if (cardType === "debit card") {
        const bankAccount = user.bankAccounts.find(acc => acc.bankName === bank);
        if (bankAccount) {
          bankAccount.balance += type === "income" ? amount : -amount;
        }
      }
    }

    // ✅ Handle UPI or Bank Transfer
    if (paymentType === "upi" || paymentType === "banktransfer") {
      const bankAccount = user.bankAccounts.find(acc => acc.bankName === bank);
      if (bankAccount) {
        bankAccount.balance += type === "income" ? amount : -amount;
      }
    }

    await user.save();

    res.status(201).json({
      message: "Transaction recorded and balances updated",
      transaction,
      updatedUser: user
    });

  } catch (error) {
    console.error("Transaction Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// New controller method to get income and expense data aggregated by period
exports.getIncomeExpenseData = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(400).json({ message: "User not authenticated" });
    }

    const userId = req.user._id;
    const period = req.query.period || "monthly"; // daily, weekly, monthly, yearly

    // Build the aggregation pipeline based on period
    let groupId = {};
    let dateFormat = "";

    switch (period) {
      case "daily":
        groupId = {
          year: { $year: "$date" },
          month: { $month: "$date" },
          day: { $dayOfMonth: "$date" }
        };
        dateFormat = "%Y-%m-%d";
        break;
      case "weekly":
        groupId = {
          year: { $year: "$date" },
          week: { $isoWeek: "$date" }
        };
        dateFormat = "%G-W%V"; // ISO week date format
        break;
      case "monthly":
        groupId = {
          year: { $year: "$date" },
          month: { $month: "$date" }
        };
        dateFormat = "%Y-%m";
        break;
      case "yearly":
        groupId = {
          year: { $year: "$date" }
        };
        dateFormat = "%Y";
        break;
      default:
        groupId = {
          year: { $year: "$date" },
          month: { $month: "$date" }
        };
        dateFormat = "%Y-%m";
    }

    const aggregation = [
      { $match: { userId: new ObjectId(userId) } },
      {
        $addFields: {
          dateObj: { $toDate: "$date" }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$dateObj" },
            month: { $month: "$dateObj" },
            day: { $dayOfMonth: "$dateObj" },
            week: { $isoWeek: "$dateObj" },
            type: "$type"
          },
          totalAmount: { $sum: "$amount" }
        }
      },
      {
        $group: {
          _id: {
            year: "$_id.year",
            month: "$_id.month",
            day: "$_id.day",
            week: "$_id.week"
          },
          amountsByType: {
            $push: {
              type: "$_id.type",
              totalAmount: "$totalAmount"
            }
          }
        }
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.week": 1,
          "_id.day": 1
        }
      }
    ];

    const results = await Transaction.aggregate(aggregation);

    // Format the results to { date, income, expense }
    const formattedResults = results.map(item => {
      let dateStr = "";
      const id = item._id;
      if (period === "daily") {
        dateStr = `${id.year}-${String(id.month).padStart(2, "0")}-${String(id.day).padStart(2, "0")}`;
      } else if (period === "weekly") {
        dateStr = `${id.year}-W${String(id.week).padStart(2, "0")}`;
      } else if (period === "monthly") {
        dateStr = `${id.year}-${String(id.month).padStart(2, "0")}`;
      } else if (period === "yearly") {
        dateStr = `${id.year}`;
      }

      let income = 0;
      let expense = 0;
      item.amountsByType.forEach(a => {
        if (a.type === "income") income = a.totalAmount;
        else if (a.type === "expense") expense = a.totalAmount;
      });

      return {
        date: dateStr,
        income,
        expense
      };
    });

    res.json(formattedResults);

  } catch (error) {
    console.error("Error fetching income expense data:", error);
    res.status(500).json({ message: "Server error", error });
  }
};




exports.getTransactions = async (req, res) => {
  try {
    console.log("Full req.user object:", req.user); // Debugging log
    if (!req.user || !req.user._id) {
      return res.status(400).json({ message: "User not authenticated" });
    }
    const transactions = await Transaction.find({
      userId: req.user._id // Use _id instead of userId
    }).sort({ date: -1 });
    console.log("Transactions found:", transactions);
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// New controller method to get precomputed daily balances
exports.getPrecomputedBalances = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(400).json({ message: "User not authenticated" });
    }
    const periodType = req.query.periodType || "daily";

    // Fetch daily balances for user
    let balances = await DailyBalance.find({ userId: req.user._id }).sort({ date: 1 });

    // If periodType is weekly or monthly, aggregate accordingly
    if (periodType === "weekly") {
      // Group by week number and year
      const grouped = {};
      balances.forEach(b => {
        const d = new Date(b.date);
        const year = d.getFullYear();
        const week = getWeekNumber(d);
        const key = `${year}-W${week}`;
        if (!grouped[key]) {
          grouped[key] = { periodStart: d, cashBalance: 0, count: 0 };
        }
        grouped[key].cashBalance += b.cashBalance;
        grouped[key].count++;
      });
      balances = Object.values(grouped).map(g => ({
        periodStart: g.periodStart,
        cashBalance: g.cashBalance / g.count
      }));
    } else if (periodType === "monthly") {
      // Group by month and year
      const grouped = {};
      balances.forEach(b => {
        const d = new Date(b.date);
        const year = d.getFullYear();
        const month = d.getMonth();
        const key = `${year}-M${month}`;
        if (!grouped[key]) {
          grouped[key] = { periodStart: d, cashBalance: 0, count: 0 };
        }
        grouped[key].cashBalance += b.cashBalance;
        grouped[key].count++;
      });
      balances = Object.values(grouped).map(g => ({
        periodStart: g.periodStart,
        cashBalance: g.cashBalance / g.count
      }));
    }

    res.json(balances);
  } catch (error) {
    console.error("Error fetching precomputed balances:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// Helper function to get ISO week number
function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}

// Scheduled job to compute daily balances 
cron.schedule('0 0 * * *', async () => {
  console.log("Running daily balance aggregation job...");

  try {
    // Get all users
    const users = await User.find({});

    for (const user of users) {
      // Aggregate transactions grouped by date for this user
      const transactionsByDate = await Transaction.aggregate([
        { $match: { userId: new ObjectId(user._id) } },
        {
          $group: {
            _id: {
              year: { $year: { $toDate: "$date" } },
              month: { $month: { $toDate: "$date" } },
              day: { $dayOfMonth: { $toDate: "$date" } }
            },
            totalIncome: {
              $sum: {
                $cond: [{ $eq: ["$type", "income"] }, "$amount", 0]
              }
            },
            totalExpense: {
              $sum: {
                $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0]
              }
            }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
      ]);

      let runningBalance = 0;
      let lastDate = null;

      for (const dayData of transactionsByDate) {
        const date = new Date(dayData._id.year, dayData._id.month - 1, dayData._id.day);

        // Fill missing dates with previous balance
        if (lastDate) {
          let nextDate = new Date(lastDate);
          nextDate.setDate(nextDate.getDate() + 1);
          while (nextDate < date) {
            // Check if a daily balance document already exists for this date to avoid duplicate increments
            const existingBalance = await DailyBalance.findOne({ userId: user._id, date: nextDate });
            if (!existingBalance) {
              await DailyBalance.create({
                userId: user._id,
                date: nextDate,
                cashBalance: runningBalance
              });
            }
            nextDate.setDate(nextDate.getDate() + 1);
          }
        }

        runningBalance += (dayData.totalIncome - dayData.totalExpense);

        // Upsert daily balance for current date
        const existingCurrentBalance = await DailyBalance.findOne({ userId: user._id, date: date });
        if (existingCurrentBalance) {
          // If the existing balance is different from the calculated running balance, update it
          if (existingCurrentBalance.cashBalance !== runningBalance) {
            await DailyBalance.findOneAndUpdate(
              { userId: user._id, date: date },
              { cashBalance: runningBalance }
            );
          }
        } else {
          // Create new daily balance document if not exists
          await DailyBalance.create({
            userId: user._id,
            date: date,
            cashBalance: runningBalance
          });
        }

        lastDate = date;
      }
    }

    console.log("Daily balance aggregation job completed.");
  } catch (error) {
    console.error("Error in daily balance aggregation job:", error);
  }
});
