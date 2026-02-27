-- Eisla Ops Hub — Seed Data
-- Run this AFTER the 0001_initial_schema.sql migration

-- ═══════════════════════════════════════════════════════════════════
-- SUPPLIERS
-- ═══════════════════════════════════════════════════════════════════
INSERT INTO suppliers (name, type, quality, delivery, price, capability, comms, approved, notes) VALUES
  ('PCBWay', 'Fabricator', 'Good', 'Good', 'Excellent', 'Good', 'Good', 'Yes', 'Primary fab partner. Good for prototype and small-batch runs.'),
  ('JLCPCB', 'Fabricator', 'Good', 'Excellent', 'Excellent', 'Good', 'Average', 'Yes', 'Fast turnaround. Assembly service available.'),
  ('Eurocircuits', 'Fabricator', 'Excellent', 'Good', 'Average', 'Excellent', 'Excellent', 'Yes', 'EU-based. High-reliability and controlled impedance.'),
  ('Aisler', 'Fabricator', 'Good', 'Good', 'Good', 'Average', 'Good', 'Conditional', 'EU-based. Good for simple 2/4 layer boards.'),
  ('Contract Engineer Pool', 'Contract Engineer', 'Varies', 'Varies', 'Varies', 'Varies', 'Varies', 'Yes', 'Pool of vetted contract engineers for T2/T3 reviews.')
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- RISKS
-- ═══════════════════════════════════════════════════════════════════
INSERT INTO risks (id, description, category, likelihood, impact, mitigation, owner, status) VALUES
  ('R01', 'Key supplier failure or quality drop', 'Supply Chain', 2, 4, 'Maintain approved supplier list with min 2 fabs. Regular scorecard reviews.', 'Operations', 'Active'),
  ('R02', 'Data breach or unauthorised access to customer PII', 'Information Security', 2, 5, 'NIST password policy, RLS, audit logging, session timeouts, access logs.', 'IT / Operations', 'Active'),
  ('R03', 'SLA breach on priority/express orders', 'Operational', 3, 3, 'Real-time SLA dashboard, automated alerts at 75% threshold, escalation procedure.', 'Operations', 'Active'),
  ('R04', 'Design error reaching manufacturing (missed in review)', 'Quality', 2, 4, '3-stage review: auto-check, sense check, engineer review. NCR tracking.', 'Engineering', 'Active'),
  ('R05', 'GDPR non-compliance (consent, retention, SAR response)', 'Regulatory', 2, 5, 'Consent tracking with timestamps, lawful basis recorded, data request workflow, access logging.', 'Operations', 'Active'),
  ('R06', 'Loss of key personnel (bus factor)', 'People', 3, 3, 'Document all processes, cross-train team, system designed for role-based handover.', 'Management', 'Active'),
  ('R07', 'Payment processing failure (Stripe outage)', 'Financial', 1, 3, 'Manual payment recording fallback. Stripe status monitoring.', 'Operations', 'Active'),
  ('R08', 'System downtime (Vercel/Supabase outage)', 'Technical', 2, 3, 'Status page monitoring, database backups, incident response procedure.', 'IT', 'Active')
ON CONFLICT DO NOTHING;
