-- Update existing loans to set is_emi_eligible based on tenure_months > 0 (example criteria)
UPDATE loans
SET is_emi_eligible = TRUE
WHERE tenure_months > 0;

-- Set is_emi_eligible to FALSE for loans with tenure_months = 0 or NULL
UPDATE loans
SET is_emi_eligible = FALSE
WHERE tenure_months IS NULL OR tenure_months = 0;
