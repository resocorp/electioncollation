-- Migration: Add all 16 registered parties for Anambra Election 2025
-- This migration adds the missing parties to support full/partial result submission

-- Add new parties (will skip if already exists due to ON CONFLICT)
INSERT INTO parties (acronym, full_name, color, display_order, is_active) VALUES
  -- Main Parties (Top 6) - Update display order
  ('ADC', 'African Democratic Congress', '#228B22', 1, true),
  ('APC', 'All Progressives Congress', '#0066CC', 2, true),
  ('APGA', 'All Progressives Grand Alliance', '#006600', 3, true),
  ('LP', 'Labour Party', '#DC143C', 4, true),
  ('PDP', 'Peoples Democratic Party', '#FF0000', 5, true),
  ('YPP', 'Young Progressives Party', '#4169E1', 6, true),
  -- Other Registered Parties (New)
  ('AA', 'Action Alliance', '#800080', 7, true),
  ('ADP', 'Action Democratic Party', '#FFA500', 8, true),
  ('AP', 'Accord Party', '#008080', 9, true),
  ('APM', 'Allied Peoples Movement', '#FF1493', 10, true),
  ('BP', 'Boot Party', '#8B4513', 11, true),
  ('NNPP', 'New Nigeria Peoples Party', '#FF6600', 12, true),
  ('NRM', 'National Rescue Movement', '#00CED1', 13, true),
  ('PRP', 'People''s Redemption Party', '#9370DB', 14, true),
  ('SDP', 'Social Democratic Party', '#FFD700', 15, true),
  ('ZLP', 'Zenith Labour Party', '#20B2AA', 16, true)
ON CONFLICT (acronym) DO UPDATE SET
  display_order = EXCLUDED.display_order,
  color = EXCLUDED.color,
  full_name = EXCLUDED.full_name;

-- Update YPP full name if it exists with old spelling
UPDATE parties 
SET full_name = 'Young Progressives Party' 
WHERE acronym = 'YPP' AND full_name = 'Young Progressive Party';
