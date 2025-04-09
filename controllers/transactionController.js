const Transaction = require("../models/transactionalModel");
const User = require("../models/userModel");


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
