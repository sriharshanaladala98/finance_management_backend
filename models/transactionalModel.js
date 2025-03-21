const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: true
  },
  date: { 
    type: Date, 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  }, // Description of transaction
  description:{
    type:String,
    required:true
  },
  type: { 
    type: String, 
    enum: ["income", "expense", "asset"], 
    required: true 
  },
  amount: { 
    type: Number,
    required: function () {
      return this.type !== "asset"; // amount is required for income & expense
    }
  },
  purchaseValue: {
    type: Number,
    required: function () {
      return this.type === "asset"; // Only required for assets
    }
  },
  category: { 
    type: String 
  }, // Custom categories
  paymentType: { 
    type: String, 
    enum: ["UPI", "Card", "Cash"] 
  },
  upiApp: { 
    type: String, 
    enum: ["PhonePe", "Paytm", "Google Pay", "CRED", "ICICI UPI"],
    required: function () {
      return this.paymentType === "UPI";
    }
  },
  bank: { 
    type: String, 
    required: function () {
      return this.paymentType === "Card" || this.paymentType === "Credit Card";
    }
  },
  debitcard:{
    type:String,
    required:function(){
      return this.paymentType==="Card";
    }
  },
  creditcard:{
    type:String,
    required:function(){
      return this.paymentType==="Card";
    }
  }
});

module.exports = mongoose.model("Transaction", transactionSchema);
