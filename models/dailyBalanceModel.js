const mongoose = require("mongoose");

const dailyBalanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  cashBalance: { type: Number, required: true }
});

dailyBalanceSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DailyBalance", dailyBalanceSchema);
