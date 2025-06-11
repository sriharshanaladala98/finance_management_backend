const { Client } = require('pg');

async function syncAmortizationSchedules() {
  const client = new Client({
    // Use your existing DB config here or import from config file
    connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/yourdb',
  });

  try {
    await client.connect();

    // Fetch all loans with amortization_schedule JSON data
    const loansRes = await client.query('SELECT id, amortization_schedule FROM loans WHERE amortization_schedule IS NOT NULL');
    const loans = loansRes.rows;

    for (const loan of loans) {
      const loanId = loan.id;
      let schedules;
      try {
        schedules = JSON.parse(loan.amortization_schedule);
      } catch (err) {
        console.error(`Failed to parse amortization_schedule JSON for loan ${loanId}:`, err);
        continue;
      }

      for (const schedule of schedules) {
        // Check if schedule already exists in amortization_schedules table
        const existsRes = await client.query(
          'SELECT 1 FROM amortization_schedules WHERE id = $1',
          [schedule._id]
        );
        if (existsRes.rowCount > 0) {
          // Already exists, skip
          continue;
        }

        // Insert schedule into amortization_schedules table
        await client.query(
          `INSERT INTO amortization_schedules (
            id, loan_id, month, emi_amount, principal_paid, interest_paid,
            remaining_balance, due_date, is_paid, payment_date, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, NOW(), NOW()
          )`,
          [
            schedule._id,
            loanId,
            schedule.month,
            schedule.emiAmount,
            schedule.principalPaid,
            schedule.interestPaid,
            schedule.remainingBalance,
            schedule.dueDate,
            schedule.isPaid,
            schedule.paymentDate || null,
          ]
        );
        console.log(`Inserted schedule ${schedule._id} for loan ${loanId}`);
      }
    }

    console.log('Amortization schedules sync completed.');
  } catch (error) {
    console.error('Error syncing amortization schedules:', error);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  syncAmortizationSchedules();
}

module.exports = syncAmortizationSchedules;
