const mongoose = require("mongoose");

const bankAccountSchema = new mongoose.Schema({
  bankName: String,
  accountNumber: String,
  balance: {
    type: Number,
    default: 0
  }
});

const creditCardSchema = new mongoose.Schema({
  cardName: String,
  cardNumber: String,
  creditLimit: { type: Number, required: true },
  creditDue: { type: Number, default: 0 },
  creditAvailable: {
    type: Number,
    default: function () {
      return this.creditLimit;
    }
  }
});



const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  cashBalance: { type: Number, default: 0 },
  bankAccounts: [bankAccountSchema],
  creditCards: [creditCardSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
