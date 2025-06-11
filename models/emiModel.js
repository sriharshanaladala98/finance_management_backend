const client = require('../config/postgres');

async function getEmisByUserId(userId) {
  const query = 'SELECT * FROM emis WHERE user_id = $1';
  const values = [userId];
  const res = await client.query(query, values);
  return res.rows;
}

async function addEmi(emi) {
  const query = `
    INSERT INTO emis (user_id, loan_id, month, year, emi_amount, principal_amount, interest_amount, due_date, status, last_due_amount, upcoming_due_amount, paid_date, overdue_days)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *;
  `;
  const values = [
    emi.user_id,
    emi.loan_id,
    emi.month,
    emi.year,
    emi.emi_amount,
    emi.principal_amount,
    emi.interest_amount,
    emi.due_date,
    emi.status,
    emi.last_due_amount,
    emi.upcoming_due_amount,
    emi.paid_date,
    emi.overdue_days
  ];
  const res = await client.query(query, values);
  return res.rows[0];
}

async function updateEmi(emiId, updates) {
  const setClauses = [];
  const values = [];
  let idx = 1;
  for (const key in updates) {
    setClauses.push(`${key} = $${idx}`);
    values.push(updates[key]);
    idx++;
  }
  values.push(emiId);
  const query = `UPDATE emis SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *;`;
  const res = await client.query(query, values);
  return res.rows[0];
}

module.exports = {
  getEmisByUserId,
  addEmi,
  updateEmi,
};
