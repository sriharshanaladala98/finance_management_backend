const Transaction = require("../models/transactionalModel");

exports.addTransaction = async (req, res) => {
  try {
    const { userId, date, name, description ,type, amount, category, paymentType, upiApp, bank } = req.body;
    const transaction = new Transaction({
      userId, 
      date: new Date(date),  // Convert string to Date
      name, description, type, amount, category, paymentType, upiApp, bank 
    });
    
    await transaction.save();
    res.status(201).json({ message: "Transaction recorded", transaction });
  } catch (error) {
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
