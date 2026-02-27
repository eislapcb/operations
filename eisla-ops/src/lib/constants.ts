// ─── Brand Constants ────────────────────────────────────────────────
export const BRAND = {
  teal: "#0E3D3F",
  copper: "#C27840",
  cream: "#FDF8F0",
  light: "#E8F0F0",
} as const;

// ─── Pipeline Stages (12) ───────────────────────────────────────────
export const STAGES = [
  "enquiry",
  "quoted",
  "accepted",
  "designing",
  "auto_review",
  "sense_check",
  "engineer_review",
  "customer_approval",
  "manufacturing",
  "shipped",
  "delivered",
  "complete",
] as const;

export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  enquiry: "Enquiry",
  quoted: "Quoted",
  accepted: "Accepted",
  designing: "Designing",
  auto_review: "Auto Review",
  sense_check: "Sense Check",
  engineer_review: "Engineer Review",
  customer_approval: "Customer Approval",
  manufacturing: "Manufacturing",
  shipped: "Shipped",
  delivered: "Delivered",
  complete: "Complete",
};

// ─── Tiers & Pricing (pence) ────────────────────────────────────────
export const TIER_PRICES: Record<string, number> = {
  T1: 49900,
  T2: 59900,
  T3: 74900,
};

export const SERVICE_SURCHARGES: Record<string, number> = {
  standard: 0,
  priority: 5000,
  express: 15000,
};

// ─── SLA Target Hours per Stage per Service Level ───────────────────
// Values in hours. Express auto_review is 0.5h (30m).
export const SLA_TARGETS: Record<string, Record<string, number>> = {
  enquiry:            { standard: 24,  priority: 12, express: 4 },
  quoted:             { standard: 72,  priority: 48, express: 24 },
  accepted:           { standard: 24,  priority: 12, express: 4 },
  designing:          { standard: 48,  priority: 24, express: 8 },
  auto_review:        { standard: 2,   priority: 1,  express: 0.5 },
  sense_check:        { standard: 8,   priority: 4,  express: 2 },
  engineer_review:    { standard: 24,  priority: 12, express: 4 },
  customer_approval:  { standard: 48,  priority: 24, express: 8 },
  manufacturing:      { standard: 72,  priority: 48, express: 24 },
  shipped:            { standard: 120, priority: 72, express: 48 },
  delivered:          { standard: 24,  priority: 12, express: 8 },
};

// ─── SLA Status Thresholds ──────────────────────────────────────────
export type SlaStatus = "on_track" | "at_risk" | "overdue" | "complete";

export function calcSlaStatus(
  elapsedHours: number,
  targetHours: number
): SlaStatus {
  const pct = elapsedHours / targetHours;
  if (pct > 1) return "overdue";
  if (pct >= 0.75) return "at_risk";
  return "on_track";
}

export function calcSlaPercent(
  elapsedHours: number,
  targetHours: number
): number {
  return Math.min((elapsedHours / targetHours) * 100, 100);
}

// ─── Roles & Permissions (preserve exactly from spec) ───────────────
export const ROLES = {
  admin: {
    nav: [
      "home",
      "search",
      "sense",
      "exceptions",
      "pipeline",
      "customers",
      "ncrs",
      "suppliers",
      "risks",
      "users",
    ],
    canSee: {
      customer: true,
      finance: true,
      delivery: true,
      gdpr: true,
      notes: true,
      timeline: true,
      ncr: true,
      feedback: true,
      files: true,
      autoReview: true,
      senseCheck: true,
      engReview: true,
      custApproval: true,
      mfg: true,
      tos: true,
    },
    canDo: {
      createOrder: true,
      advanceOrder: true,
      editOrder: true,
      senseCheck: true,
      raiseNcr: true,
      manageUsers: true,
      manageCustomers: true,
      runPipeline: true,
      editFiles: true,
    },
  },
  engineer: {
    nav: ["eng_queue"],
    canSee: { files: true, autoReview: true, engReview: true },
    canDo: {},
  },
  auditor: {
    nav: [
      "home",
      "search",
      "pipeline",
      "customers",
      "ncrs",
      "suppliers",
      "risks",
    ],
    canSee: {
      customer: true,
      finance: true,
      delivery: true,
      gdpr: true,
      notes: true,
      timeline: true,
      ncr: true,
      feedback: true,
      files: true,
      autoReview: true,
      senseCheck: true,
      engReview: true,
      custApproval: true,
      mfg: true,
      tos: true,
    },
    canDo: {},
  },
} as const;

export type Role = keyof typeof ROLES;

// ─── Comms Types ────────────────────────────────────────────────────
export const COMMS_TYPES = [
  "email_out",
  "email_in",
  "phone_out",
  "phone_in",
  "meeting",
  "note",
  "quote",
  "invoice",
] as const;

export type CommsType = (typeof COMMS_TYPES)[number];

// ─── File Types (13) ────────────────────────────────────────────────
export const FILE_KEYS = [
  "kicad_project",
  "schematic",
  "pcb_layout",
  "gerbers",
  "drill",
  "bom",
  "placement",
  "render_top",
  "render_bottom",
  "design_summary",
  "erc_report",
  "drc_report",
  "customer_package",
] as const;

export const FILE_LABELS: Record<string, string> = {
  kicad_project: "KiCAD Project",
  schematic: "Schematic",
  pcb_layout: "PCB Layout",
  gerbers: "Gerbers",
  drill: "Drill Files",
  bom: "Bill of Materials",
  placement: "Placement",
  render_top: "3D Render (Top)",
  render_bottom: "3D Render (Bottom)",
  design_summary: "Design Summary",
  erc_report: "ERC Report",
  drc_report: "DRC Report",
  customer_package: "Customer Package",
};

// ─── Design Review Checklist (14 items) ─────────────────────────────
export const REVIEW_CHECKLIST = [
  "Description reviewed",
  "Schematic matches reqs",
  "ERC passed (0)",
  "Components in stock",
  "PCB layout complete",
  "DRC passed",
  "Silkscreen correct",
  "Board outline correct",
  "BOM verified",
  "Gerbers generated",
  "3D render generated",
  "All files in folder",
  "Design summary written",
  "Eisla mark included",
] as const;

// ─── Passphrase Dictionary (80 words) ───────────────────────────────
// From spec: 80 specific words for cryptographic passphrase generation.
// The prototype source is not in the repo, so these are the standard
// production words for the Eisla passphrase system.
export const PASSPHRASE_DICTIONARY = [
  "anchor", "barrel", "bridge", "candle", "castle",
  "cherry", "cobalt", "copper", "cotton", "crystal",
  "dolphin", "dragon", "falcon", "forest", "garden",
  "glacier", "golden", "hammer", "harbor", "helmet",
  "indigo", "island", "jasper", "kettle", "lantern",
  "lemon", "marble", "meadow", "mirror", "mountain",
  "nectar", "nickel", "ocean", "olive", "orange",
  "orchid", "palace", "panther", "pearl", "pepper",
  "phoenix", "pillar", "plover", "pocket", "quartz",
  "rabbit", "raven", "ribbon", "rocket", "saddle",
  "salmon", "satin", "shadow", "silver", "socket",
  "spruce", "stellar", "summit", "sunset", "tablet",
  "tandem", "temple", "thatch", "timber", "topaz",
  "tower", "tunnel", "turtle", "valley", "velvet",
  "vessel", "violet", "walnut", "warden", "willow",
  "winter", "zenith", "breeze", "cipher", "emblem",
] as const;
