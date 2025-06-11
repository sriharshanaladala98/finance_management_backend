const client = require('../config/postgres');

async function getTransactionsByUserId(userId) {
  const query = `
    SELECT id, user_id, amount, category, type, date, description, payment_method AS paymentType, bank, created_at, updated_at
    FROM transactions
    WHERE user_id = $1
  `;
  const values = [userId];
  const res = await client.query(query, values);
  return res.rows;
}

async function addTransaction(transaction) {
  const query = `
    INSERT INTO transactions (user_id, amount, category, type, date, description, payment_method, bank)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;
  const values = [
    transaction.user_id,
    transaction.amount,
    transaction.category,
    transaction.type,
    transaction.date,
    transaction.description,
    transaction.payment_method,
    transaction.bank
  ];
  const res = await client.query(query, values);
  return res.rows[0];
}

async function updateTransaction(transactionId, updates) {
  const setClauses = [];
  const values = [];
  let idx = 1;
  for (const key in updates) {
    setClauses.push(`${key} = $${idx}`);
    values.push(updates[key]);
    idx++;
  }
  values.push(transactionId);
  const query = `UPDATE transactions SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *;`;
  const res = await client.query(query, values);
  return res.rows[0];
}

module.exports = {
  getTransactionsByUserId,
  addTransaction,
  updateTransaction,
};
