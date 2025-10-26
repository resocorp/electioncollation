-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Agents/Users Table
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number TEXT UNIQUE NOT NULL,
  email TEXT,
  name TEXT NOT NULL,
  password_hash TEXT,
  polling_unit_code TEXT NOT NULL,
  ward TEXT NOT NULL,
  lga TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Anambra',
  role TEXT NOT NULL CHECK (role IN ('pu_agent', 'ward_agent', 'lga_agent', 'state_agent', 'ccc_supervisor', 'admin')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Election Results Table
CREATE TABLE IF NOT EXISTS election_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_id TEXT UNIQUE NOT NULL,
  agent_id UUID REFERENCES agents(id) NOT NULL,
  polling_unit_code TEXT NOT NULL,
  ward TEXT NOT NULL,
  lga TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Anambra',
  party_votes JSONB NOT NULL,
  total_votes INTEGER NOT NULL,
  validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'validated', 'rejected')),
  validated_by UUID REFERENCES agents(id),
  validated_at TIMESTAMP,
  rejection_reason TEXT,
  submitted_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Incident Reports Table
CREATE TABLE IF NOT EXISTS incident_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_id TEXT UNIQUE NOT NULL,
  agent_id UUID REFERENCES agents(id) NOT NULL,
  polling_unit_code TEXT NOT NULL,
  ward TEXT NOT NULL,
  lga TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Anambra',
  incident_type TEXT NOT NULL CHECK (incident_type IN ('vote_buying', 'violence', 'result_manipulation', 'intimidation', 'general')),
  description TEXT NOT NULL,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'reported' CHECK (status IN ('reported', 'investigating', 'resolved', 'closed')),
  assigned_to UUID REFERENCES agents(id),
  resolution_notes TEXT,
  reported_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- SMS Sessions Table (for conversation state)
CREATE TABLE IF NOT EXISTS sms_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number TEXT NOT NULL,
  current_state TEXT,
  session_data JSONB,
  last_activity TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- SMS Logs Table (audit trail)
CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('received', 'sent', 'failed', 'pending')),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES agents(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Parties Table
CREATE TABLE IF NOT EXISTS parties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  acronym TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  logo_url TEXT,
  color TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- System Configuration Table
CREATE TABLE IF NOT EXISTS system_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES agents(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_agents_phone ON agents(phone_number);
CREATE INDEX IF NOT EXISTS idx_agents_pu ON agents(polling_unit_code);
CREATE INDEX IF NOT EXISTS idx_agents_role ON agents(role);
CREATE INDEX IF NOT EXISTS idx_results_pu ON election_results(polling_unit_code);
CREATE INDEX IF NOT EXISTS idx_results_validation ON election_results(validation_status);
CREATE INDEX IF NOT EXISTS idx_results_submitted ON election_results(submitted_at);
CREATE INDEX IF NOT EXISTS idx_results_lga ON election_results(lga);
CREATE INDEX IF NOT EXISTS idx_results_ward ON election_results(ward);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incident_reports(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incident_reports(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_lga ON incident_reports(lga);
CREATE INDEX IF NOT EXISTS idx_sms_logs_phone ON sms_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created ON sms_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- Insert Default Parties (Anambra Governorship Election 2025)
INSERT INTO parties (acronym, full_name, color, display_order, is_active) VALUES
  ('APC', 'All Progressives Congress', '#0066CC', 1, true),
  ('PDP', 'Peoples Democratic Party', '#FF0000', 2, true),
  ('APGA', 'All Progressives Grand Alliance', '#006600', 3, true),
  ('LP', 'Labour Party', '#DC143C', 4, true),
  ('NNPP', 'New Nigeria Peoples Party', '#FF6600', 5, true),
  ('ADC', 'African Democratic Congress', '#228B22', 6, true),
  ('YPP', 'Young Progressive Party', '#4169E1', 7, true),
  ('SDP', 'Social Democratic Party', '#FFD700', 8, true)
ON CONFLICT (acronym) DO NOTHING;

-- Create default admin user (password: Admin123!)
-- Password hash for "Admin123!" using bcrypt
INSERT INTO agents (phone_number, email, name, password_hash, polling_unit_code, ward, lga, state, role, status) 
VALUES 
  ('2348000000000', 'admin@election.com', 'System Administrator', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5yW.w7vU8JQyW', 'ADMIN', 'Central', 'Central', 'Anambra', 'admin', 'active')
ON CONFLICT (phone_number) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_results_updated_at BEFORE UPDATE ON election_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incident_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE election_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (simplified for now - can be enhanced later)
CREATE POLICY "Allow all for authenticated users" ON agents FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON election_results FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON incident_reports FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON sms_logs FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON audit_logs FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON parties FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON system_config FOR ALL USING (true);
