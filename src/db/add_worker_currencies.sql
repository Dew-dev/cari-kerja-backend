-- Add currency fields to workers table
ALTER TABLE workers 
ADD COLUMN current_salary_currency_id INT REFERENCES currencies(id),
ADD COLUMN expected_salary_currency_id INT REFERENCES currencies(id);

-- Set default currency (ID 1, assuming it's USD) for existing records
UPDATE workers 
SET current_salary_currency_id = 1, expected_salary_currency_id = 1 
WHERE current_salary IS NOT NULL OR expected_salary IS NOT NULL;
