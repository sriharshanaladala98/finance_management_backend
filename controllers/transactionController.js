const Transaction = require("../models/transactionalModel");

exports.addTransaction = async (req, res) => {
  try {
    const { userId, date, name, type, amount, category, paymentType, upiApp, bank } = req.body;
    const transaction = new Transaction({ userId, date, name, description, type, amount, category, paymentType, upiApp, bank });
    await transaction.save();
    res.status(201).json({ message: "Transaction recorded", transaction });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.email }).sort({ date: -1 });
    console.log(transactions)
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
