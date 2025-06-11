const Transaction = require("../models/transactionalModel");
const User = require("../models/userModel");
const DailyBalance = require("../models/dailyBalanceModel");

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

    type = type?.toLowerCase().trim();
    paymentType = paymentType?.toLowerCase().trim();
    cardType = cardType?.toLowerCase().trim();
    bank = bank?.trim();
    category = category?.trim();
    name = name?.trim();
    description = description?.trim();
    amount = Number(amount);

    if (!userId || !type || !amount || !paymentType || isNaN(amount)) {
      return res.status(400).json({ message: "Missing or invalid required fields." });
    }

    const transaction = {
      user_id: userId,
      date: new Date(date),
      name,
      description,
      type,
      amount,
      category,
      payment_method: paymentType,  // map paymentType to payment_method for DB
      cardType,
      upiApp,
      bank
    };

    const createdTransaction = await Transaction.addTransaction(transaction);

    const user = await User.getUserById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (paymentType === "cash") {
      // Deduct amount from cashBalance for expense, add for income
      user.cashBalance += type === "income" ? amount : -amount;
      // Ensure cashBalance does not go below zero
      if (user.cashBalance < 0) user.cashBalance = 0;
    }

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

    if (paymentType === "upi" || paymentType === "banktransfer") {
      const bankAccount = user.bankAccounts.find(acc => acc.bankName === bank);
      if (bankAccount) {
        bankAccount.balance += type === "income" ? amount : -amount;
      }
    }

    // Ensure cashBalance is a number before updating and returning
    const cashBalanceNum = Number(user.cashBalance);
    const updatedCashBalance = isNaN(cashBalanceNum) ? 0 : cashBalanceNum;

    await User.updateUser(userId, {
      cashbalance: updatedCashBalance,
      bankAccounts: user.bankAccounts,
      creditCards: user.creditCards
    });

    // Fetch updated user from DB to get latest data
    const refreshedUser = await User.getUserById(userId);

    // Convert cashbalance string to number for response
    if (refreshedUser && refreshedUser.cashbalance !== undefined && refreshedUser.cashbalance !== null) {
      const numCashBalance = Number(refreshedUser.cashbalance);
      refreshedUser.cashBalance = isNaN(numCashBalance) ? 0 : numCashBalance;
    } else {
      refreshedUser.cashBalance = 0;
    }

    res.status(201).json({
      message: "Transaction recorded and balances updated",
      transaction: createdTransaction,
      updatedUser: refreshedUser
    });

  } catch (error) {
    console.error("Transaction Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

exports.getIncomeExpenseData = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(400).json({ message: "User not authenticated" });
    }

    const userId = req.user.id;
    const period = req.query.period || "monthly";

    // Supabase does not support aggregation pipelines like MongoDB,
    // so this aggregation should be done client-side or via SQL views/stored procedures.
    // For now, fetch all transactions and aggregate in code.

    const transactions = await Transaction.getTransactionsByUserId(userId);

    // Aggregate transactions by period and type
    // Implementation of aggregation logic is omitted for brevity

    res.json(transactions); // Placeholder response

  } catch (error) {
    console.error("Error fetching income expense data:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(400).json({ message: "User not authenticated" });
    }
    const transactions = await Transaction.getTransactionsByUserId(req.user.id);
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

exports.getPrecomputedBalances = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(400).json({ message: "User not authenticated" });
    }
    const periodType = req.query.periodType || "daily";

    let balances = await DailyBalance.getBalancesByUserId(req.user.id);

    // Aggregation for weekly/monthly can be done here or in SQL views

    res.json(balances);
  } catch (error) {
    console.error("Error fetching precomputed balances:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// The cron job for daily balance aggregation should be reimplemented using Supabase queries and scheduled externally.
