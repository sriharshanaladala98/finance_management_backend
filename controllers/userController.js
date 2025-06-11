const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const { signToken } = require('../utils/jwt');

exports.registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        console.log("Register User called with:", { username, email });

        if (!username || !email || !password) {
            return res.status(400).json({ message: "Username, email and password are required" });
        }

        const existingUser = await User.getUserByEmail(email);
        if (existingUser) {
            console.log("User already exists:", existingUser);
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.addUser({ username, email, password: hashedPassword });

        console.log("New user created:", newUser);

        if (!newUser) {
            return res.status(500).json({ message: "Failed to create user" });
        }

        res.status(201).json({ message: "User registered successfully", user: newUser });
    } catch (error) {
        console.error("Register User Error:", error);
        res.status(500).json({ message: "Server error", error });
    }
};

exports.addBankAccounts = async (req, res) => {
    try {
        const { email, bankAccounts } = req.body;
        if (!Array.isArray(bankAccounts) || bankAccounts.length === 0) {
            return res.status(400).json({ message: "bankAccounts must be a non-empty array" });
        }

        const user = await User.getUserByEmail(email);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Validate each bank account object
        for (const account of bankAccounts) {
            if (!account.bankName || !account.accountNumber) {
                return res.status(400).json({ message: "Each bank account must have bankName and accountNumber" });
            }
        }

        const updatedBankAccounts = [...(user.bankAccounts || []), ...bankAccounts];
        const updatedUser = await User.updateUser(user.id, { bankAccounts: updatedBankAccounts });

        if (!updatedUser) {
            return res.status(500).json({ message: "Failed to update user bank accounts" });
        }

        res.status(200).json({ message: "Bank accounts added", bankAccounts: updatedBankAccounts });
    } catch (err) {
        console.error("Add Bank Accounts Error:", err);
        res.status(500).json({ message: "Server error", error: err });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.getUserByEmail(email);
        if (!user) {
            return res.status(200).json({ success: false, message: 'Invalid email' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = signToken(user);

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

exports.getCurrentUser = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.getUserByEmail(email);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        // Convert cashbalance string to number and store as cashBalance
        if (user.cashbalance !== undefined) {
            user.cashBalance = Number(user.cashbalance);
            // Optionally update the database to store as number if needed
            if (isNaN(user.cashBalance)) {
                user.cashBalance = 0;
            } else if (typeof user.cashbalance === 'string') {
                // Update database to store cashbalance as number
                await User.updateUser(user.id, { cashbalance: user.cashBalance });
            }
        } else {
            user.cashBalance = 0;
        }
        delete user.cashbalance;

        // Ensure bankAccounts is an array
        if (!Array.isArray(user.bankAccounts)) {
            user.bankAccounts = [];
        }

        // Ensure creditCards is an array
        if (!Array.isArray(user.creditCards)) {
            user.creditCards = [];
        }

        // Calculate total bank balance
        user.totalBankBalance = user.bankAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
        // Calculate available credit limit
        user.availableCreditLimit = user.creditCards.reduce((sum, card) => sum + (card.creditAvailable || 0), 0);

        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.addBankAccount = async (req, res) => {
    try {
        const { email, bankAccount } = req.body;
        const user = await User.getUserByEmail(email);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (!bankAccount || !bankAccount.bankName || !bankAccount.accountNumber) {
          console.error("Invalid bankAccount data:", bankAccount);
          return res.status(400).json({ message: "Invalid bank account data" });
        }

        // Ensure bankAccounts is an array before appending
        const currentBankAccounts = Array.isArray(user.bankAccounts) ? user.bankAccounts : [];

        // Log current bankAccounts before update
        console.log("Current bankAccounts before update:", currentBankAccounts);

        const updatedBankAccounts = [...currentBankAccounts, bankAccount];
        console.log("Updating bankAccounts with:", updatedBankAccounts, "Type:", typeof updatedBankAccounts);

        const updatedUser = await User.updateUser(user.id, { bankAccounts: updatedBankAccounts });

        if (!updatedUser) {
          console.error("Failed to update user bank accounts");
          return res.status(500).json({ message: "Failed to update user bank accounts" });
        }

        res.status(200).json({ message: "Bank account added", bankAccounts: updatedBankAccounts });
    } catch (err) {
        console.error("Add Bank Account Error:", err);
        if (err && err.message) {
          console.error("Detailed error message:", err.message);
        }
        if (err && err.stack) {
          console.error("Stack trace:", err.stack);
        }
        res.status(500).json({ message: "Server error", error: err });
    }
};

exports.updateBankAccount = async (req, res) => {
    try {
      const { email, updatedDetails } = req.body;
      const { accountNumber } = req.params;
  
      const user = await User.getUserByEmail(email);
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      const bankAccounts = user.bankAccounts || [];
      const accountIndex = bankAccounts.findIndex(acc => acc.accountNumber === accountNumber);
      if (accountIndex === -1) return res.status(404).json({ message: 'Bank account not found' });
  
      bankAccounts[accountIndex] = { ...bankAccounts[accountIndex], ...updatedDetails };
  
      await User.updateUser(user.id, { bankAccounts });
      res.status(200).json({ message: 'Bank account updated', bankAccounts });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err });
    }
  };

exports.deleteBankAccount = async (req, res) => {
    try {
      const { email } = req.body;
      const { accountNumber } = req.params;
  
      const user = await User.getUserByEmail(email);
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      const bankAccounts = (user.bankAccounts || []).filter(acc => acc.accountNumber !== accountNumber);
  
      await User.updateUser(user.id, { bankAccounts });
      res.status(200).json({ message: 'Bank account deleted', bankAccounts });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err });
    }
  };

exports.addCreditCard = async (req, res) => {
    try {
      const { email, cardName, cardNumber, creditLimit, creditDue, creditAvailable } = req.body;
  
      const user = await User.getUserByEmail(email);
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
  
      const creditCards = [...(user.creditCards || []), newCard];
      await User.updateUser(user.id, { creditCards });
  
      res.status(200).json({ message: "Credit card added successfully", creditCards });
    } catch (error) {
      console.error("Add Credit Card Error:", error);
      res.status(500).json({ message: "Server error", error });
    }
  };

exports.updateCreditCard = async (req, res) => {
    try {
      const { email, cardNumber, updatedData } = req.body;
  
      const user = await User.getUserByEmail(email);
      if (!user) return res.status(404).json({ message: "User not found" });
  
      const creditCards = user.creditCards || [];
      const cardIndex = creditCards.findIndex(card => card.cardNumber === cardNumber);
      if (cardIndex === -1) return res.status(404).json({ message: "Credit card not found" });
  
      creditCards[cardIndex] = { ...creditCards[cardIndex], ...updatedData };
  
      await User.updateUser(user.id, { creditCards });
  
      res.status(200).json({
        message: "Credit card updated",
        creditCards,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  };
  
exports.deleteCreditCard = async (req, res) => {
    try {
      const { email, cardNumber } = req.body;
  
      const user = await User.getUserByEmail(email);
      if (!user) return res.status(404).json({ message: "User not found" });
  
      const initialLength = (user.creditCards || []).length;
  
      const creditCards = (user.creditCards || []).filter(card => card.cardNumber !== cardNumber);
  
      if (creditCards.length === initialLength)
        return res.status(404).json({ message: "Card not found" });
  
      await User.updateUser(user.id, { creditCards });
  
      res.status(200).json({
        message: "Credit card deleted",
        creditCards,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  };
  
exports.addUpiApp = async (req, res) => {
    try {
        const { email, appName, upiId } = req.body;
        
        const user = await User.getUserByEmail(email);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if ((user.upiAccounts || []).some(account => account.upiId === upiId)) {
            return res.status(400).json({ message: "UPI ID already exists" });
        }

        const upiAccounts = [...(user.upiAccounts || []), { appName, upiId }];
        await User.updateUser(user.id, { upiAccounts });

        res.status(201).json({
            message: "UPI account added successfully",
            upiAccounts
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateUpiApp = async (req, res) => {
    try {
        const { email, upiId, updatedData } = req.body;
        
        const user = await User.getUserByEmail(email);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const upiAccounts = user.upiAccounts || [];
        const upiIndex = upiAccounts.findIndex(account => account.upiId === upiId);
        if (upiIndex === -1) {
            return res.status(404).json({ message: "UPI account not found" });
        }

        upiAccounts[upiIndex] = { ...upiAccounts[upiIndex], ...updatedData };
        await User.updateUser(user.id, { upiAccounts });

        res.status(200).json({
            message: "UPI account updated successfully",
            upiAccounts
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteUpiApp = async (req, res) => {
    try {
        const { email, upiId } = req.body;
        
        const user = await User.getUserByEmail(email);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const upiAccounts = (user.upiAccounts || []).filter(account => account.upiId !== upiId);
        await User.updateUser(user.id, { upiAccounts });

        res.status(200).json({
            message: "UPI account deleted successfully",
            upiAccounts
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
        
exports.updateCashBalance = async (req, res) => {
    try {
        let { email, cashBalance } = req.body;
        console.log("updateCashBalance called with:", { email, cashBalance });

        // Convert cashBalance to number explicitly
        cashBalance = Number(cashBalance);
        if (isNaN(cashBalance)) {
            return res.status(400).json({ message: "Invalid cashBalance value" });
        }

        const user = await User.getUserByEmail(email);
        if (!user) {
            console.log("User not found for email:", email);
            return res.status(404).json({ message: "User not found" });
        }

        const updatedUser = await User.updateUser(user.id, { cashbalance: cashBalance });
        if (!updatedUser) {
            console.log("Failed to update cash balance for user:", user.id);
            return res.status(500).json({ message: "Failed to update cash balance" });
        }

        res.status(200).json({ message: "Cash balance updated", cashBalance });
    } catch (err) {
        console.error("Error in updateCashBalance:", err);
        res.status(500).json({ message: "Server error", error: err.message || err });
    }
};

exports.getUserBalances = async (req, res) => {
    try {
      const userId = req.params.userId;
      const user = await User.getUserById(userId);
  
      if (!user) return res.status(404).json({ message: "User not found" });

      // Map cashbalance to cashBalance for consistency
      let cashBalance = 0;
      if (user.cashbalance !== undefined && !isNaN(Number(user.cashbalance))) {
        cashBalance = Number(user.cashbalance);
      }

      // Ensure bankAccounts and creditCards are arrays
      const bankAccounts = Array.isArray(user.bankAccounts) ? user.bankAccounts : [];
      const creditCards = Array.isArray(user.creditCards) ? user.creditCards : [];

      const balances = {
        cashBalance,
        bankAccounts,
        creditCards
      };
  
      res.status(200).json(balances);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  };
