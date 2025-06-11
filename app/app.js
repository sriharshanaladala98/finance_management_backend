const express = require("express");
const cors = require("../config/cors");
const mongoose = require("../config/database");
const dotenv = require("dotenv");
const db = require("../config/postgres");
// const supabase = require("../config/supabaseClient");

dotenv.config();
const app = express();
const port = process.env.PORT || 3550;

app.use(cors);
app.use(express.json());

// const db = require("../config/postgres");

// Test PostgreSQL connection on server start using query
db.query('SELECT NOW()')
  .then(res => {
    console.log("PostgreSQL connected successfully at", res.rows[0].now);
  })
  .catch(err => {
    console.error("PostgreSQL connection error:", err.stack);
  });

// Import Routes
const userRoutes = require("../routes/userRoutes");
const transactionRoutes = require("../routes/transactionalRoutes");
const assetRoutes = require("../routes/assetsRoutes");
const loanRoutes = require("../routes/loanRoutes");
const emiRoutes = require("../routes/emiRoutes");

// Health check route to confirm Supabase connection
// app.get('/health', async (req, res) => {
//   try {
//     const { data, error } = await supabase.from('users').select('*').limit(1);
//     if (error) {
//       console.error('Supabase health check error:', error);
//       return res.status(500).json({ status: 'error', message: 'Database connection failed' });
//     }
//     res.status(200).json({ status: 'ok', message: 'Connected to Supabase database', sampleUser: data[0] || null });
//   } catch (err) {
//     console.error('Health check exception:', err);
//     res.status(500).json({ status: 'error', message: 'Internal server error' });
//   }
// });

app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/emi", emiRoutes);

app.get("/", (req, res) => res.send("Financial Management API Running"));

app.listen(port, () => console.log(`Server running on port ${port}`));
