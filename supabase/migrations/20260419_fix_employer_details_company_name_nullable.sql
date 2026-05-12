-- Fix: company_name was NOT NULL but the signup trigger doesn't provide it
-- Users fill in company_name later via their dashboard profile
ALTER TABLE employer_details ALTER COLUMN company_name DROP NOT NULL;
