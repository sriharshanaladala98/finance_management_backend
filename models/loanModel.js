const client = require('../config/postgres');

async function getLoansByUserId(userId) {
  const query = 'SELECT * FROM loans WHERE user_id = $1';
  const values = [userId];
  const res = await client.query(query, values);
  console.log("Loans fetched for user:", userId, res.rows);
  return res.rows;
}

async function addLoan(loan) {
  const query = `
    INSERT INTO loans (user_id, lender_name, loan_name, loan_amount, interest_rate, tenure_months, start_date, due_date, emi_amount, total_interest, total_payment, amortization_schedule, status, is_emi_eligible)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *;
  `;
  const values = [
    loan.user_id,
    loan.lender_name,
    loan.loan_name,
    loan.loan_amount,
    loan.interest_rate,
    loan.tenure_months,
    loan.start_date,
    loan.due_date,
    loan.emi_amount,
    loan.total_interest,
    loan.total_payment,
    loan.amortization_schedule,
    loan.status,
    loan.is_emi_eligible || false
  ];
  const res = await client.query(query, values);
  return res.rows[0];
}

async function updateLoan(loanId, updates) {
  const setClauses = [];
  const values = [];
  let idx = 1;
  for (const key in updates) {
    setClauses.push(`${key} = $${idx}`);
    values.push(updates[key]);
    idx++;
  }
  values.push(loanId);
  const query = `UPDATE loans SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *;`;
  const res = await client.query(query, values);
  return res.rows[0];
}

module.exports = {
  getLoansByUserId,
  addLoan,
  updateLoan,
};
