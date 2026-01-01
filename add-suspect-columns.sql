-- Add suspect information columns to blotter_reports table
-- These columns are optional (nullable) for cases where suspect info is not available

ALTER TABLE blotter_reports
ADD COLUMN IF NOT EXISTS suspect_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS suspect_alias VARCHAR(200),
ADD COLUMN IF NOT EXISTS relation_to_suspect VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_seen_suspect_address TEXT,
ADD COLUMN IF NOT EXISTS suspect_contact VARCHAR(50),
ADD COLUMN IF NOT EXISTS suspect_offense VARCHAR(200);

-- Add comment to document these columns
COMMENT ON COLUMN blotter_reports.suspect_name IS 'Name of the suspect/accused (optional)';
COMMENT ON COLUMN blotter_reports.suspect_alias IS 'Alias or nickname of suspect (optional)';
COMMENT ON COLUMN blotter_reports.relation_to_suspect IS 'Relationship between complainant and suspect (optional)';
COMMENT ON COLUMN blotter_reports.last_seen_suspect_address IS 'Last known address where suspect was seen (optional)';
COMMENT ON COLUMN blotter_reports.suspect_contact IS 'Contact number of suspect (optional)';
COMMENT ON COLUMN blotter_reports.suspect_offense IS 'Type of offense committed by suspect (optional)';
