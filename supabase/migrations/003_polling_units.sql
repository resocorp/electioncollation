-- Polling Units Table (Master data from Google Sheets)
CREATE TABLE IF NOT EXISTS polling_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  polling_unit_code TEXT UNIQUE NOT NULL,
  polling_unit_name TEXT NOT NULL,
  ward TEXT NOT NULL,
  lga TEXT NOT NULL,
  state TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  registered_voters INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX idx_polling_units_state ON polling_units(state);
CREATE INDEX idx_polling_units_lga ON polling_units(state, lga);
CREATE INDEX idx_polling_units_ward ON polling_units(state, lga, ward);
CREATE INDEX idx_polling_units_code ON polling_units(polling_unit_code);

-- Add GPS coordinates to agents table
ALTER TABLE agents ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add GPS coordinates to election_results table
ALTER TABLE election_results ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE election_results ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add GPS coordinates to incident_reports table
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

COMMENT ON TABLE polling_units IS 'Master list of all polling units with GPS coordinates';
COMMENT ON COLUMN polling_units.latitude IS 'GPS latitude coordinate';
COMMENT ON COLUMN polling_units.longitude IS 'GPS longitude coordinate';

-- Enable RLS for polling_units
ALTER TABLE polling_units ENABLE ROW LEVEL SECURITY;

-- RLS Policy for polling_units
CREATE POLICY "Allow all for authenticated users" ON polling_units FOR ALL USING (true);
