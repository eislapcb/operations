-- Eisla Ops Hub — Initial Schema
-- All tables per migration brief, including field_changes + access_log

-- ═══════════════════════════════════════════════════════════════════
-- EXTENSIONS
-- ═══════════════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════════════════
-- users
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT,
  role            TEXT NOT NULL CHECK (role IN ('admin', 'engineer', 'auditor')),
  active          BOOLEAN DEFAULT true,
  must_change_pw  TEXT DEFAULT 'false',
  password_set_at TIMESTAMPTZ,
  failed_attempts INT DEFAULT 0,
  locked_until    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  last_login      TIMESTAMPTZ,
  invite_sent_at  TIMESTAMPTZ,
  invite_sent_by  UUID REFERENCES users(id)
);

-- ═══════════════════════════════════════════════════════════════════
-- audit_log
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  event           TEXT NOT NULL,
  ip              INET,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════
-- customers
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE customers (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_number          TEXT UNIQUE NOT NULL,
  name                    TEXT,
  email                   TEXT,
  phone                   TEXT,
  company                 TEXT,
  addr1                   TEXT,
  addr2                   TEXT,
  city                    TEXT,
  county                  TEXT,
  postcode                TEXT,
  country                 TEXT,
  status                  TEXT DEFAULT 'Active',
  source                  TEXT,
  -- GDPR fields
  lawful_basis            TEXT DEFAULT 'contract',
  privacy_notice_version  TEXT,
  privacy_accepted        BOOLEAN DEFAULT false,
  privacy_accepted_at     TIMESTAMPTZ,
  data_processing_consent BOOLEAN DEFAULT false,
  mkt_email               BOOLEAN DEFAULT false,
  mkt_sms                 BOOLEAN DEFAULT false,
  mkt_phone               BOOLEAN DEFAULT false,
  mkt_post                BOOLEAN DEFAULT false,
  mkt_third_party         BOOLEAN DEFAULT false,
  mkt_email_date          TIMESTAMPTZ,
  mkt_sms_date            TIMESTAMPTZ,
  mkt_phone_date          TIMESTAMPTZ,
  mkt_post_date           TIMESTAMPTZ,
  mkt_third_party_date    TIMESTAMPTZ,
  retention_period        TEXT DEFAULT '6 years',
  notes                   TEXT,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════
-- consent_log
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE consent_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID REFERENCES customers(id),
  field           TEXT NOT NULL,
  old_value       TEXT,
  new_value       TEXT,
  actor           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════
-- orders
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE orders (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number                  TEXT UNIQUE NOT NULL,
  customer_id             UUID REFERENCES customers(id),
  -- Denormalised customer fields for display (synced on link)
  customer_name           TEXT,
  email                   TEXT,
  phone                   TEXT,
  company                 TEXT,
  -- Delivery address
  del_addr1               TEXT,
  del_addr2               TEXT,
  del_city                TEXT,
  del_county              TEXT,
  del_postcode            TEXT,
  del_country             TEXT,
  del_instructions        TEXT,
  -- Service
  stage                   TEXT NOT NULL DEFAULT 'enquiry',
  tier                    TEXT CHECK (tier IN ('T1', 'T2', 'T3')) DEFAULT 'T1',
  service_level           TEXT CHECK (service_level IN ('standard', 'priority', 'express')) DEFAULT 'standard',
  fee                     INTEGER,
  mfg_estimate            INTEGER,
  description             TEXT,
  -- T&Cs
  tos_version             TEXT,
  tos_accepted            BOOLEAN DEFAULT false,
  tos_accepted_at         TIMESTAMPTZ,
  -- Payment (Stripe)
  payment_status          TEXT DEFAULT 'Unpaid',
  stripe_session_id       TEXT,
  stripe_payment_intent   TEXT,
  stripe_charge_id        TEXT,
  stripe_amount           INTEGER,
  stripe_receipt_url      TEXT,
  payment_date            TIMESTAMPTZ,
  -- Pipeline results
  parse_confidence        REAL,
  erc_result              TEXT,
  drc_result              TEXT,
  -- Quote
  quote_ref               TEXT,
  quote_sent_at           TIMESTAMPTZ,
  -- Manufacturing
  fab                     TEXT,
  fab_ref                 TEXT,
  fab_cost                INTEGER,
  tracking                TEXT,
  carrier                 TEXT,
  shipped_at              TIMESTAMPTZ,
  delivered_at            TIMESTAMPTZ,
  -- Metadata
  notes                   TEXT,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════
-- order_auto_review
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE order_auto_review (
  order_id        UUID PRIMARY KEY REFERENCES orders(id),
  checks          JSONB,
  result          TEXT,
  completed_at    TIMESTAMPTZ
);

-- ═══════════════════════════════════════════════════════════════════
-- order_sense_check
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE order_sense_check (
  order_id        UUID PRIMARY KEY REFERENCES orders(id),
  approved        BOOLEAN,
  by_user_id      UUID REFERENCES users(id),
  notes           TEXT,
  completed_at    TIMESTAMPTZ
);

-- ═══════════════════════════════════════════════════════════════════
-- order_engineer_review
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE order_engineer_review (
  order_id        UUID PRIMARY KEY REFERENCES orders(id),
  engineer_id     UUID REFERENCES users(id),
  sent_at         TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  outcome         TEXT,
  comments        TEXT
);

-- ═══════════════════════════════════════════════════════════════════
-- order_customer_approval
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE order_customer_approval (
  order_id        UUID PRIMARY KEY REFERENCES orders(id),
  approved        BOOLEAN,
  method          TEXT,
  version         TEXT,
  notes           TEXT,
  completed_at    TIMESTAMPTZ
);

-- ═══════════════════════════════════════════════════════════════════
-- order_files
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE order_files (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID REFERENCES orders(id),
  file_key        TEXT NOT NULL,
  label           TEXT,
  url             TEXT,
  version         TEXT DEFAULT '1.0',
  size            TEXT,
  uploaded_at     TIMESTAMPTZ
);

-- ═══════════════════════════════════════════════════════════════════
-- order_comms
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE order_comms (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID REFERENCES orders(id),
  type            TEXT NOT NULL,
  subject         TEXT,
  body            TEXT,
  by_user_id      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════
-- order_timeline
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE order_timeline (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID REFERENCES orders(id),
  event           TEXT NOT NULL,
  actor           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════
-- order_feedback
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE order_feedback (
  order_id        UUID PRIMARY KEY REFERENCES orders(id),
  overall         TEXT,
  quality         TEXT,
  comms           TEXT,
  time            TEXT,
  use_again       TEXT,
  comments        TEXT,
  testimonial     TEXT
);

-- ═══════════════════════════════════════════════════════════════════
-- ncrs
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE ncrs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number          TEXT UNIQUE,
  date            DATE,
  severity        TEXT,
  description     TEXT,
  status          TEXT DEFAULT 'Open',
  raised_by       TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════
-- suppliers
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE suppliers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  type            TEXT,
  quality         TEXT,
  delivery        TEXT,
  price           TEXT,
  capability      TEXT,
  comms           TEXT,
  approved        TEXT,
  notes           TEXT
);

-- ═══════════════════════════════════════════════════════════════════
-- risks
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE risks (
  id              TEXT PRIMARY KEY,
  description     TEXT,
  category        TEXT,
  likelihood      INT,
  impact          INT,
  mitigation      TEXT,
  owner           TEXT,
  status          TEXT DEFAULT 'Active'
);

-- ═══════════════════════════════════════════════════════════════════
-- exceptions
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE exceptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID REFERENCES orders(id),
  type            TEXT,
  description     TEXT,
  resolved        BOOLEAN DEFAULT false,
  resolved_by     TEXT,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════
-- field_changes (audit trail — field-level change tracking)
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE field_changes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name      TEXT NOT NULL,
  record_id       UUID NOT NULL,
  field           TEXT NOT NULL,
  old_value       TEXT,
  new_value       TEXT,
  changed_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════
-- access_log (GDPR Article 30 accountability)
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE access_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  action          TEXT NOT NULL,
  resource_type   TEXT,
  resource_id     UUID,
  ip              INET,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════
CREATE INDEX idx_orders_stage ON orders(stage);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_number ON orders(number);
CREATE INDEX idx_order_timeline_order_id ON order_timeline(order_id);
CREATE INDEX idx_order_timeline_created_at ON order_timeline(created_at DESC);
CREATE INDEX idx_order_comms_order_id ON order_comms(order_id);
CREATE INDEX idx_order_files_order_id ON order_files(order_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_field_changes_record ON field_changes(table_name, record_id);
CREATE INDEX idx_field_changes_created_at ON field_changes(created_at DESC);
CREATE INDEX idx_access_log_user_id ON access_log(user_id);
CREATE INDEX idx_access_log_created_at ON access_log(created_at DESC);
CREATE INDEX idx_consent_log_customer_id ON consent_log(customer_id);
CREATE INDEX idx_exceptions_order_id ON exceptions(order_id);

-- ═══════════════════════════════════════════════════════════════════
-- Full-text search index on orders (for Phase 9)
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE orders ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(number, '') || ' ' ||
      coalesce(customer_name, '') || ' ' ||
      coalesce(email, '') || ' ' ||
      coalesce(company, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(notes, '') || ' ' ||
      coalesce(quote_ref, '')
    )
  ) STORED;

CREATE INDEX idx_orders_search ON orders USING GIN (search_vector);

-- ═══════════════════════════════════════════════════════════════════
-- TRIGGER: auto-write field changes on orders UPDATE
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION track_field_changes()
RETURNS TRIGGER AS $$
DECLARE
  col TEXT;
  old_val TEXT;
  new_val TEXT;
  current_user_id UUID;
BEGIN
  -- Get the current user from Supabase RLS context
  BEGIN
    current_user_id := (current_setting('app.current_user_id', true))::UUID;
  EXCEPTION WHEN OTHERS THEN
    current_user_id := NULL;
  END;

  -- Iterate over columns and log changes
  FOR col IN
    SELECT column_name FROM information_schema.columns
    WHERE table_name = TG_TABLE_NAME
      AND table_schema = TG_TABLE_SCHEMA
      AND column_name NOT IN ('updated_at', 'created_at', 'search_vector')
  LOOP
    EXECUTE format('SELECT ($1).%I::TEXT', col) INTO old_val USING OLD;
    EXECUTE format('SELECT ($1).%I::TEXT', col) INTO new_val USING NEW;

    IF old_val IS DISTINCT FROM new_val THEN
      INSERT INTO field_changes (table_name, record_id, field, old_value, new_value, changed_by)
      VALUES (TG_TABLE_NAME, NEW.id, col, old_val, new_val, current_user_id);
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_field_changes
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION track_field_changes();

CREATE TRIGGER customers_field_changes
  AFTER UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION track_field_changes();

-- ═══════════════════════════════════════════════════════════════════
-- TRIGGER: auto-update updated_at on orders and customers
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
