import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  integer,
  real,
  date,
  inet,
  jsonb,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ─── users ──────────────────────────────────────────────────────────
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").unique().notNull(),
    passwordHash: text("password_hash"),
    role: text("role").notNull(),
    active: boolean("active").default(true),
    mustChangePw: text("must_change_pw").default("false"),
    passwordSetAt: timestamp("password_set_at", { withTimezone: true }),
    failedAttempts: integer("failed_attempts").default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    lastLogin: timestamp("last_login", { withTimezone: true }),
    inviteSentAt: timestamp("invite_sent_at", { withTimezone: true }),
    inviteSentBy: uuid("invite_sent_by"),
  },
  (table) => [
    check(
      "users_role_check",
      sql`${table.role} IN ('admin', 'engineer', 'auditor')`
    ),
  ]
);

// ─── audit_log ──────────────────────────────────────────────────────
export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  event: text("event").notNull(),
  ip: inet("ip"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── customers ──────────────────────────────────────────────────────
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountNumber: text("account_number").unique().notNull(),
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  addr1: text("addr1"),
  addr2: text("addr2"),
  city: text("city"),
  county: text("county"),
  postcode: text("postcode"),
  country: text("country"),
  status: text("status").default("Active"),
  source: text("source"),
  // GDPR fields
  lawfulBasis: text("lawful_basis").default("contract"),
  privacyNoticeVersion: text("privacy_notice_version"),
  privacyAccepted: boolean("privacy_accepted").default(false),
  privacyAcceptedAt: timestamp("privacy_accepted_at", { withTimezone: true }),
  dataProcessingConsent: boolean("data_processing_consent").default(false),
  mktEmail: boolean("mkt_email").default(false),
  mktSms: boolean("mkt_sms").default(false),
  mktPhone: boolean("mkt_phone").default(false),
  mktPost: boolean("mkt_post").default(false),
  mktThirdParty: boolean("mkt_third_party").default(false),
  mktEmailDate: timestamp("mkt_email_date", { withTimezone: true }),
  mktSmsDate: timestamp("mkt_sms_date", { withTimezone: true }),
  mktPhoneDate: timestamp("mkt_phone_date", { withTimezone: true }),
  mktPostDate: timestamp("mkt_post_date", { withTimezone: true }),
  mktThirdPartyDate: timestamp("mkt_third_party_date", { withTimezone: true }),
  retentionPeriod: text("retention_period").default("6 years"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── consent_log ────────────────────────────────────────────────────
export const consentLog = pgTable("consent_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").references(() => customers.id),
  field: text("field").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  actor: text("actor"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── orders ─────────────────────────────────────────────────────────
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    number: text("number").unique().notNull(),
    customerId: uuid("customer_id").references(() => customers.id),
    // Denormalised customer fields
    customerName: text("customer_name"),
    email: text("email"),
    phone: text("phone"),
    company: text("company"),
    // Delivery address
    delAddr1: text("del_addr1"),
    delAddr2: text("del_addr2"),
    delCity: text("del_city"),
    delCounty: text("del_county"),
    delPostcode: text("del_postcode"),
    delCountry: text("del_country"),
    delInstructions: text("del_instructions"),
    // Service
    stage: text("stage").notNull().default("enquiry"),
    tier: text("tier").default("T1"),
    serviceLevel: text("service_level").default("standard"),
    fee: integer("fee"),
    mfgEstimate: integer("mfg_estimate"),
    description: text("description"),
    // T&Cs
    tosVersion: text("tos_version"),
    tosAccepted: boolean("tos_accepted").default(false),
    tosAcceptedAt: timestamp("tos_accepted_at", { withTimezone: true }),
    // Payment (Stripe)
    paymentStatus: text("payment_status").default("Unpaid"),
    stripeSessionId: text("stripe_session_id"),
    stripePaymentIntent: text("stripe_payment_intent"),
    stripeChargeId: text("stripe_charge_id"),
    stripeAmount: integer("stripe_amount"),
    stripeReceiptUrl: text("stripe_receipt_url"),
    paymentDate: timestamp("payment_date", { withTimezone: true }),
    // Pipeline results
    parseConfidence: real("parse_confidence"),
    ercResult: text("erc_result"),
    drcResult: text("drc_result"),
    // Quote
    quoteRef: text("quote_ref"),
    quoteSentAt: timestamp("quote_sent_at", { withTimezone: true }),
    // Manufacturing
    fab: text("fab"),
    fabRef: text("fab_ref"),
    fabCost: integer("fab_cost"),
    tracking: text("tracking"),
    carrier: text("carrier"),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    // Metadata
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    check(
      "orders_tier_check",
      sql`${table.tier} IN ('T1', 'T2', 'T3')`
    ),
    check(
      "orders_service_level_check",
      sql`${table.serviceLevel} IN ('standard', 'priority', 'express')`
    ),
  ]
);

// ─── order_auto_review ──────────────────────────────────────────────
export const orderAutoReview = pgTable("order_auto_review", {
  orderId: uuid("order_id")
    .primaryKey()
    .references(() => orders.id),
  checks: jsonb("checks"),
  result: text("result"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

// ─── order_sense_check ──────────────────────────────────────────────
export const orderSenseCheck = pgTable("order_sense_check", {
  orderId: uuid("order_id")
    .primaryKey()
    .references(() => orders.id),
  approved: boolean("approved"),
  byUserId: uuid("by_user_id").references(() => users.id),
  notes: text("notes"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

// ─── order_engineer_review ──────────────────────────────────────────
export const orderEngineerReview = pgTable("order_engineer_review", {
  orderId: uuid("order_id")
    .primaryKey()
    .references(() => orders.id),
  engineerId: uuid("engineer_id").references(() => users.id),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  outcome: text("outcome"),
  comments: text("comments"),
});

// ─── order_customer_approval ────────────────────────────────────────
export const orderCustomerApproval = pgTable("order_customer_approval", {
  orderId: uuid("order_id")
    .primaryKey()
    .references(() => orders.id),
  approved: boolean("approved"),
  method: text("method"),
  version: text("version"),
  notes: text("notes"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

// ─── order_files ────────────────────────────────────────────────────
export const orderFiles = pgTable("order_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").references(() => orders.id),
  fileKey: text("file_key").notNull(),
  label: text("label"),
  url: text("url"),
  version: text("version").default("1.0"),
  size: text("size"),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }),
});

// ─── order_comms ────────────────────────────────────────────────────
export const orderComms = pgTable("order_comms", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").references(() => orders.id),
  type: text("type").notNull(),
  subject: text("subject"),
  body: text("body"),
  byUserId: uuid("by_user_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── order_timeline ─────────────────────────────────────────────────
export const orderTimeline = pgTable("order_timeline", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").references(() => orders.id),
  event: text("event").notNull(),
  actor: text("actor"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── order_feedback ─────────────────────────────────────────────────
export const orderFeedback = pgTable("order_feedback", {
  orderId: uuid("order_id")
    .primaryKey()
    .references(() => orders.id),
  overall: text("overall"),
  quality: text("quality"),
  comms: text("comms"),
  time: text("time"),
  useAgain: text("use_again"),
  comments: text("comments"),
  testimonial: text("testimonial"),
});

// ─── ncrs ───────────────────────────────────────────────────────────
export const ncrs = pgTable("ncrs", {
  id: uuid("id").primaryKey().defaultRandom(),
  number: text("number").unique(),
  date: date("date"),
  severity: text("severity"),
  description: text("description"),
  status: text("status").default("Open"),
  raisedBy: text("raised_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── suppliers ──────────────────────────────────────────────────────
export const suppliers = pgTable("suppliers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: text("type"),
  quality: text("quality"),
  delivery: text("delivery"),
  price: text("price"),
  capability: text("capability"),
  comms: text("comms"),
  approved: text("approved"),
  notes: text("notes"),
});

// ─── risks ──────────────────────────────────────────────────────────
export const risks = pgTable("risks", {
  id: text("id").primaryKey(),
  description: text("description"),
  category: text("category"),
  likelihood: integer("likelihood"),
  impact: integer("impact"),
  mitigation: text("mitigation"),
  owner: text("owner"),
  status: text("status").default("Active"),
});

// ─── exceptions ─────────────────────────────────────────────────────
export const exceptions = pgTable("exceptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").references(() => orders.id),
  type: text("type"),
  description: text("description"),
  resolved: boolean("resolved").default(false),
  resolvedBy: text("resolved_by"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── field_changes (audit trail) ────────────────────────────────────
export const fieldChanges = pgTable("field_changes", {
  id: uuid("id").primaryKey().defaultRandom(),
  tableName: text("table_name").notNull(),
  recordId: uuid("record_id").notNull(),
  field: text("field").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  changedBy: uuid("changed_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── access_log (GDPR Article 30) ──────────────────────────────────
export const accessLog = pgTable("access_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  action: text("action").notNull(),
  resourceType: text("resource_type"),
  resourceId: uuid("resource_id"),
  ip: inet("ip"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
