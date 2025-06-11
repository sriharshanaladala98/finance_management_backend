const client = require('../config/postgres');

async function getBalancesByUserId(userId) {
  const query = 'SELECT * FROM daily_balances WHERE user_id = $1';
  const values = [userId];
  const res = await client.query(query, values);
  return res.rows;
}

async function addOrUpdateBalance(balance) {
  // Upsert balance record by user_id and date
  const query = `
    INSERT INTO daily_balances (user_id, date, balance)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id, date) DO UPDATE SET balance = EXCLUDED.balance
    RETURNING *;
  `;
  const values = [balance.user_id, balance.date, balance.balance];
  const res = await client.query(query, values);
  return res.rows[0];
}

module.exports = {
  getBalancesByUserId,
  addOrUpdateBalance,
};
