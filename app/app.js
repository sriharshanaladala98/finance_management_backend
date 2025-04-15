const express = require("express");
const cors = require("cors");
const mongoose = require("../config/database");
const dotenv = require("dotenv");


dotenv.config();
const app = express();
const port = process.env.PORT || 3550;

app.use(cors());
app.use(express.json());

// Import Routes
const userRoutes = require("../routes/userRoutes");
const transactionRoutes = require("../routes/transactionalRoutes");
const assetRoutes = require("../routes/assetsRoutes");
const loanRoutes = require("../routes/loanRoutes");
const emiRoutes = require("../routes/emiRoutes");

// Use Routes
app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/emi",emiRoutes)

app.get("/", (req, res) => res.send("Financial Management API Running"));

app.listen(port, () => console.log(`Server running on port ${port}`));
