const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const { signToken } = require('../utils/jwt');

exports.registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ name, email, password: hashedPassword });

        res.status(201).json({ message: "User registered successfully", user: newUser });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        console.log(user)
        if (!user) {
            return res.status(200).json({ success: false, message: 'Invalid email' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        console.log(isMatch)
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Generate JWT token
        const token = signToken(user._id);
        console.log(token)
        
        res.status(200).json({ message: "Login successful", token,user});
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
exports.getCurrentUser = async (req, res) => {
    try {
        const {email} = req.body
        // Assuming `req.user` contains the user info after decoding the JWT
        const user = await User.findOne({email});
        console.log(user.email)
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.addBankAccount = async (req, res) => {
    try {
        const { email, bankAccount } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        user.bankAccounts.push(bankAccount);
        await user.save();

        res.status(200).json({ message: "Bank account added", bankAccounts: user.bankAccounts });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err });
    }
};

exports.updateBankAccount = async (req, res) => {
    try {
      const { email, updatedDetails } = req.body;
      const { accountNumber } = req.params;
  
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      const account = user.bankAccounts.find(
        (acc) => acc.accountNumber === accountNumber
      );
  
      if (!account) return res.status(404).json({ message: 'Bank account not found' });
  
      // Update fields
      Object.assign(account, updatedDetails);
  
      await user.save();
      res.status(200).json({ message: 'Bank account updated', bankAccounts: user.bankAccounts });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err });
    }
  };

  exports.deleteBankAccount = async (req, res) => {
    try {
      const { email } = req.body;
      const { accountNumber } = req.params;
  
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      user.bankAccounts = user.bankAccounts.filter(
        (acc) => acc.accountNumber !== accountNumber
      );
  
      await user.save();
      res.status(200).json({ message: 'Bank account deleted', bankAccounts: user.bankAccounts });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err });
    }
  };
  

exports.addCreditCard = async (req, res) => {
    try {
      const { email, cardName, cardNumber, creditLimit, creditDue, creditAvailable } = req.body;
  
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: "User not found" });
  
      const finalCreditAvailable = creditAvailable !== undefined
        ? creditAvailable
        : creditLimit - creditDue;
  
      const newCard = {
        cardName,
        cardNumber,
        creditLimit,
        creditDue,
        creditAvailable: finalCreditAvailable
      };
  
      user.creditCards.push(newCard);
      await user.save();
  
      res.status(200).json({ message: "Credit card added successfully", creditCards: user.creditCards });
    } catch (error) {
      console.error("Add Credit Card Error:", error);
      res.status(500).json({ message: "Server error", error });
    }
  };

  exports.updateCreditCard = async (req, res) => {
    try {
      const { email, cardNumber, updatedData } = req.body;
  
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: "User not found" });
  
      const cardIndex = user.creditCards.findIndex(
        (card) => card.cardNumber === cardNumber
      );
  
      if (cardIndex === -1)
        return res.status(404).json({ message: "Credit card not found" });
  
      // Update fields
      user.creditCards[cardIndex] = {
        ...user.creditCards[cardIndex],
        ...updatedData,
      };
  
      await user.save();
  
      res.status(200).json({
        message: "Credit card updated",
        creditCards: user.creditCards,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  };
  
  exports.deleteCreditCard = async (req, res) => {
    try {
      const { email, cardNumber } = req.body;
  
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: "User not found" });
  
      const initialLength = user.creditCards.length;
  
      user.creditCards = user.creditCards.filter(
        (card) => card.cardNumber !== cardNumber
      );
  
      if (user.creditCards.length === initialLength)
        return res.status(404).json({ message: "Card not found" });
  
      await user.save();
  
      res.status(200).json({
        message: "Credit card deleted",
        creditCards: user.creditCards,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  };
  
  
  
exports.addUpiApp = async (req, res) => {
    try {
        const { email, appName, upiId } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if UPI ID already exists
        if (user.upiAccounts.some(account => account.upiId === upiId)) {
            return res.status(400).json({ message: "UPI ID already exists" });
        }

        user.upiAccounts.push({ appName, upiId });
        await user.save();

        res.status(201).json({
            message: "UPI account added successfully",
            upiAccounts: user.upiAccounts
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateUpiApp = async (req, res) => {
    try {
        const { email, upiId, updatedData } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const upiAccount = user.upiAccounts.find(account => account.upiId === upiId);
        if (!upiAccount) {
            return res.status(404).json({ message: "UPI account not found" });
        }

        Object.assign(upiAccount, updatedData);
        await user.save();

        res.status(200).json({
            message: "UPI account updated successfully",
            upiAccounts: user.upiAccounts
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteUpiApp = async (req, res) => {
    try {
        const { email, upiId } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.upiAccounts = user.upiAccounts.filter(account => account.upiId !== upiId);
        await user.save();

        res.status(200).json({
            message: "UPI account deleted successfully",
            upiAccounts: user.upiAccounts
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
            
exports.updateCashBalance = async (req, res) => {
    try {
        const { email, cashBalance } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        user.cashBalance = cashBalance;
        await user.save();

        res.status(200).json({ message: "Cash balance updated", cashBalance: user.cashBalance });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err });
    }
};

exports.getUserBalances = async (req, res) => {
    try {
      const userId = req.params.userId;
      const user = await User.findById(userId);
  
      if (!user) return res.status(404).json({ message: "User not found" });
  
      const balances = {
        cashBalance: user.cashBalance,
        bankAccounts: user.bankAccounts.map(acc => ({
          bankName: acc.bankName,
          accountNumber: acc.accountNumber,
          balance: acc.balance
        })),
        creditCards: user.creditCards.map(card => ({
          cardName: card.cardName,
          cardNumber: card.cardNumber,
          creditLimit: card.creditLimit,
          creditDue: card.creditDue,
          creditAvailable: card.creditAvailable
        }))
      };
  
      res.status(200).json(balances);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  };
  

