/**
 * Seed script — populates suppliers and risks from prototype SEED_SUP / SEED_RISKS data.
 *
 * Run: npx tsx scripts/seed.ts
 * Requires DATABASE_URL in .env.local
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { suppliers, risks } from "../src/db/schema";

const connectionString = process.env.DATABASE_URL!;
if (!connectionString) {
  console.error("DATABASE_URL is required. Set it in .env.local");
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

const SEED_SUPPLIERS = [
  {
    name: "PCBWay",
    type: "Fabricator",
    quality: "Good",
    delivery: "Good",
    price: "Excellent",
    capability: "Good",
    comms: "Good",
    approved: "Yes",
    notes: "Primary fab partner. Good for prototype and small-batch runs.",
  },
  {
    name: "JLCPCB",
    type: "Fabricator",
    quality: "Good",
    delivery: "Excellent",
    price: "Excellent",
    capability: "Good",
    comms: "Average",
    approved: "Yes",
    notes: "Fast turnaround. Assembly service available.",
  },
  {
    name: "Eurocircuits",
    type: "Fabricator",
    quality: "Excellent",
    delivery: "Good",
    price: "Average",
    capability: "Excellent",
    comms: "Excellent",
    approved: "Yes",
    notes: "EU-based. High-reliability and controlled impedance.",
  },
  {
    name: "Aisler",
    type: "Fabricator",
    quality: "Good",
    delivery: "Good",
    price: "Good",
    capability: "Average",
    comms: "Good",
    approved: "Conditional",
    notes: "EU-based. Good for simple 2/4 layer boards.",
  },
  {
    name: "Contract Engineer Pool",
    type: "Contract Engineer",
    quality: "Varies",
    delivery: "Varies",
    price: "Varies",
    capability: "Varies",
    comms: "Varies",
    approved: "Yes",
    notes: "Pool of vetted contract engineers for T2/T3 reviews.",
  },
];

const SEED_RISKS = [
  {
    id: "R01",
    description: "Key supplier failure or quality drop",
    category: "Supply Chain",
    likelihood: 2,
    impact: 4,
    mitigation: "Maintain approved supplier list with min 2 fabs. Regular scorecard reviews.",
    owner: "Operations",
    status: "Active" as const,
  },
  {
    id: "R02",
    description: "Data breach or unauthorised access to customer PII",
    category: "Information Security",
    likelihood: 2,
    impact: 5,
    mitigation: "NIST password policy, RLS, audit logging, session timeouts, access logs.",
    owner: "IT / Operations",
    status: "Active" as const,
  },
  {
    id: "R03",
    description: "SLA breach on priority/express orders",
    category: "Operational",
    likelihood: 3,
    impact: 3,
    mitigation: "Real-time SLA dashboard, automated alerts at 75% threshold, escalation procedure.",
    owner: "Operations",
    status: "Active" as const,
  },
  {
    id: "R04",
    description: "Design error reaching manufacturing (missed in review)",
    category: "Quality",
    likelihood: 2,
    impact: 4,
    mitigation: "3-stage review: auto-check, sense check, engineer review. NCR tracking.",
    owner: "Engineering",
    status: "Active" as const,
  },
  {
    id: "R05",
    description: "GDPR non-compliance (consent, retention, SAR response)",
    category: "Regulatory",
    likelihood: 2,
    impact: 5,
    mitigation: "Consent tracking with timestamps, lawful basis recorded, data request workflow, access logging.",
    owner: "Operations",
    status: "Active" as const,
  },
  {
    id: "R06",
    description: "Loss of key personnel (bus factor)",
    category: "People",
    likelihood: 3,
    impact: 3,
    mitigation: "Document all processes, cross-train team, system designed for role-based handover.",
    owner: "Management",
    status: "Active" as const,
  },
  {
    id: "R07",
    description: "Payment processing failure (Stripe outage)",
    category: "Financial",
    likelihood: 1,
    impact: 3,
    mitigation: "Manual payment recording fallback. Stripe status monitoring.",
    owner: "Operations",
    status: "Active" as const,
  },
  {
    id: "R08",
    description: "System downtime (Vercel/Supabase outage)",
    category: "Technical",
    likelihood: 2,
    impact: 3,
    mitigation: "Status page monitoring, database backups, incident response procedure.",
    owner: "IT",
    status: "Active" as const,
  },
];

async function seed() {
  console.log("Seeding suppliers...");
  for (const sup of SEED_SUPPLIERS) {
    await db
      .insert(suppliers)
      .values(sup)
      .onConflictDoNothing();
  }
  console.log(`  ${SEED_SUPPLIERS.length} suppliers seeded.`);

  console.log("Seeding risks...");
  for (const risk of SEED_RISKS) {
    await db
      .insert(risks)
      .values(risk)
      .onConflictDoNothing();
  }
  console.log(`  ${SEED_RISKS.length} risks seeded.`);

  console.log("Seed complete.");
  await client.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
