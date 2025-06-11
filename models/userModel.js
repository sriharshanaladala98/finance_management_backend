const client = require('../config/postgres');

const usersTable = 'users';

async function getUserById(userId) {
  const query = `SELECT * FROM ${usersTable} WHERE id = $1`;
  const values = [userId];
  const res = await client.query(query, values);
  if (res.rows.length === 0) return null;
  const user = res.rows[0];
  // Map bankaccounts JSONB field to bankAccounts array
  if (user.bankaccounts !== undefined && user.bankaccounts !== null) {
    try {
      if (typeof user.bankaccounts === 'string') {
        user.bankAccounts = JSON.parse(user.bankaccounts);
      } else {
        user.bankAccounts = user.bankaccounts;
      }
    } catch (e) {
      user.bankAccounts = [];
    }
  } else {
    user.bankAccounts = [];
  }
  // Map creditcards JSONB field to creditCards array
  if (user.creditcards !== undefined && user.creditcards !== null) {
    try {
      if (typeof user.creditcards === 'string') {
        user.creditCards = JSON.parse(user.creditcards);
      } else {
        user.creditCards = user.creditcards;
      }
    } catch (e) {
      user.creditCards = [];
    }
  } else {
    user.creditCards = [];
  }
  // Map upiaccounts JSONB field to upiAccounts array
  if (user.upiaccounts !== undefined && user.upiaccounts !== null) {
    try {
      if (typeof user.upiaccounts === 'string') {
        user.upiAccounts = JSON.parse(user.upiaccounts);
      } else {
        user.upiAccounts = user.upiaccounts;
      }
    } catch (e) {
      user.upiAccounts = [];
    }
  } else {
    user.upiAccounts = [];
  }
  // Convert cashbalance to number explicitly here
  if (user.cashbalance !== undefined && user.cashbalance !== null) {
    const numCashBalance = Number(user.cashbalance);
    user.cashBalance = isNaN(numCashBalance) ? 0 : numCashBalance;
  } else {
    user.cashBalance = 0;
  }
  // Remove cashbalance field from user object before returning
  delete user.cashbalance;
  return user;
}

async function getUserByEmail(email) {
  const query = `SELECT * FROM ${usersTable} WHERE email = $1`;
  const values = [email];
  const res = await client.query(query, values);
  if (res.rows.length === 0) return null;
  const user = res.rows[0];
  // Map bankaccounts JSONB field to bankAccounts array
  if (user.bankaccounts !== undefined && user.bankaccounts !== null) {
    try {
      if (typeof user.bankaccounts === 'string') {
        user.bankAccounts = JSON.parse(user.bankaccounts);
      } else {
        user.bankAccounts = user.bankaccounts;
      }
    } catch (e) {
      user.bankAccounts = [];
    }
  } else {
    user.bankAccounts = [];
  }
  // Map creditcards JSONB field to creditCards array
  if (user.creditcards !== undefined && user.creditcards !== null) {
    try {
      if (typeof user.creditcards === 'string') {
        user.creditCards = JSON.parse(user.creditcards);
      } else {
        user.creditCards = user.creditcards;
      }
    } catch (e) {
      user.creditCards = [];
    }
  } else {
    user.creditCards = [];
  }
  // Map upiaccounts JSONB field to upiAccounts array
  if (user.upiaccounts !== undefined && user.upiaccounts !== null) {
    try {
      if (typeof user.upiaccounts === 'string') {
        user.upiAccounts = JSON.parse(user.upiaccounts);
      } else {
        user.upiAccounts = user.upiaccounts;
      }
    } catch (e) {
      user.upiAccounts = [];
    }
  } else {
    user.upiAccounts = [];
  }
  // Convert cashbalance to number explicitly here
  if (user.cashbalance !== undefined && user.cashbalance !== null) {
    const numCashBalance = Number(user.cashbalance);
    user.cashBalance = isNaN(numCashBalance) ? 0 : numCashBalance;
  } else {
    user.cashBalance = 0;
  }
  return user;
}

async function addUser(user) {
  const query = `
    INSERT INTO ${usersTable} (username, email, password_hash)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const values = [user.username, user.email, user.password];
  const res = await client.query(query, values);
  return res.rows[0];
}

async function updateUser(userId, updates) {
  const setClauses = [];
  const values = [];
  let idx = 1;
  for (const key in updates) {
    setClauses.push(`${key} = $${idx}`);
    // Stringify objects/arrays for JSONB columns
    if (typeof updates[key] === 'object' && updates[key] !== null) {
      values.push(JSON.stringify(updates[key]));
    } else {
      values.push(updates[key]);
    }
    idx++;
  }
  values.push(userId);
  const query = `UPDATE ${usersTable} SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *;`;
  const res = await client.query(query, values);
  return res.rows[0];
}

module.exports = {
  getUserById,
  getUserByEmail,
  addUser,
  updateUser,
};
