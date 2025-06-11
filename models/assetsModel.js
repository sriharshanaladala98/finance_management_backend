const client = require('../config/postgres');

async function getAssetsByUserId(userId) {
  const query = 'SELECT * FROM assets WHERE user_id = $1';
  const values = [userId];
  const res = await client.query(query, values);
  return res.rows;
}

async function addAsset(asset) {
  const query = `
    INSERT INTO assets (user_id, asset_name, description, purchase_value, payment_method, acquired_date, audit_frequency, next_audit_date, last_audited_date)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *;
  `;
  const values = [
    asset.user_id,
    asset.asset_name,
    asset.description,
    asset.purchase_value,
    asset.payment_method,
    asset.acquired_date,
    asset.audit_frequency,
    asset.next_audit_date,
    asset.last_audited_date
  ];
  const res = await client.query(query, values);
  return res.rows[0];
}

async function updateAsset(assetId, updates) {
  const setClauses = [];
  const values = [];
  let idx = 1;
  for (const key in updates) {
    setClauses.push(`${key} = $${idx}`);
    values.push(updates[key]);
    idx++;
  }
  values.push(assetId);
  const query = `UPDATE assets SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *;`;
  const res = await client.query(query, values);
  return res.rows[0];
}

module.exports = {
  getAssetsByUserId,
  addAsset,
  updateAsset,
};
