import { SERVICE_COLORS as DATA_SERVICE_COLORS } from "./data";
import type { GraphLink, ServiceKey } from "./types";

/** Three-bucket taxonomy for service nodes. The graph used to give every
 *  service its own arbitrary hue, which made 18 colours that didn't read as
 *  any kind of grouping. Categories collapse the palette to three roles:
 *  foundational platform, user-facing feature, and external boundary. */
export type ServiceCategory = "core" | "feature" | "adapter";

export const CATEGORY_META: Record<
  ServiceCategory,
  { label: string; color: string; hint: string }
> = {
  core:    { label: "Core platform",    color: "#a78bfa", hint: "Foundational identity & ledger" },
  feature: { label: "Feature services", color: "#22d3ee", hint: "User-facing capabilities" },
  adapter: { label: "Adapters",         color: "#fb923c", hint: "External integrations" },
};

const SERVICE_CATEGORY: Record<string, ServiceCategory> = {
  // foundational platform — everyone else depends on these
  "identity-core": "core",
  "ledger":        "core",
  // boundaries to external systems
  "zoho-sync":           "adapter",
  "ai-gateway":          "adapter",
  "quickbooks-adapter":  "adapter",
  "tally-adapter":       "adapter",
  "zoho-books-adapter":  "adapter",
  // user-facing capabilities
  "connecting-circle": "feature",
  "gamification":      "feature",
  "membership-miles":  "feature",
  "volunteering":      "feature",
  "communities":       "feature",
  "live-tv":           "feature",
  "lms":               "feature",
  "sales":             "feature",
  "affiliate":         "feature",
  "marketing":         "feature",
  "social-media":      "feature",
};

export function serviceCategory(svc: string): ServiceCategory {
  return SERVICE_CATEGORY[svc] ?? "feature";
}

/** Per-service hue *within* its category family — same role-colour, varied
 *  lightness/saturation so 11 cyan suns don't smear into one cyan blob in
 *  3D. Each row stays inside its category's hue range; the CATEGORY_META
 *  swatch picks a mid-family tone that represents the group in legends. */
const DEFAULT_SERVICE_COLORS: Record<string, string> = {
  // core — violet family (260–270°)
  "identity-core": "#c4b5fd",
  "ledger":        "#8b5cf6",
  // adapter — amber/orange family (20–35°)
  "zoho-sync":          "#fed7aa",
  "ai-gateway":         "#fdba74",
  "quickbooks-adapter": "#fb923c",
  "tally-adapter":      "#f97316",
  "zoho-books-adapter": "#ea580c",
  // feature — cyan/teal/blue-cyan family (170–200°)
  "connecting-circle": "#67e8f9",
  "gamification":      "#22d3ee",
  "membership-miles":  "#38bdf8",
  "volunteering":      "#5eead4",
  "communities":       "#2dd4bf",
  "live-tv":           "#06b6d4",
  "lms":               "#14b8a6",
  "sales":             "#0ea5e9",
  "affiliate":         "#0891b2",
  "marketing":         "#0d9488",
  "social-media":      "#0284c7",
};

/** Service-name → hex colour. Resolves to the per-service tone if defined,
 *  otherwise falls back to the category colour, then to a neutral grey for
 *  truly unknown services. */
export const COLORS = new Proxy({} as Record<ServiceKey, string>, {
  get(_t, prop: string) {
    return DATA_SERVICE_COLORS[prop] ?? DEFAULT_SERVICE_COLORS[prop] ?? CATEGORY_META[serviceCategory(prop)].color;
  },
}) as Record<ServiceKey, string>;

export function mutColor(score: number | null | undefined): string {
  if (score == null) return "#5c6370";
  if (score >= 80) return "#28d97a";
  if (score >= 60) return "#f5a623";
  if (score >= 40) return "#ff7043";
  return "#e63946";
}

export function mutLabel(score: number | null | undefined): string {
  if (score == null) return "no data";
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Weak";
  return "Poor";
}

// Words that need bespoke casing or expansion — kebab→TitleCase butchers
// acronyms ("Tv") and would never expand short forms on its own ("Lms").
const NAME_OVERRIDES: Record<string, string> = {
  lms: "Learning Management System",
  tv: "TV",
  ai: "AI",
};

export function displayName(svc: string): string {
  const whole = NAME_OVERRIDES[svc];
  if (whole) return whole;
  return svc
    .split("-")
    .map((w) => NAME_OVERRIDES[w] ?? w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Short uppercase symbol shown on the service "sun" — the initials of
 *  each word in the displayName, capped at 3 chars. "identity-core" → "IC",
 *  "lms" → "LMS", "communities" → "C". */
export function serviceSymbol(svc: string): string {
  const name = displayName(svc);
  return name
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

/** Emoji glyph rendered as the central icon on a service sphere. Chosen so
 *  each domain reads at a glance: deepen=spiritual practice, programme=
 *  content delivery, reach=growth, operate=back-office, identity=people,
 *  platform=infra. Falls back to a generic gear if a new service ships
 *  before this map is updated. */
const SERVICE_ICONS: Record<string, string> = {
  // deepen
  "connecting-circle": "🕉️",
  "gamification": "🎮",
  "membership-miles": "🎟️",
  "volunteering": "🤝",
  // identity / platform
  "identity-core": "🪪",
  "zoho-sync": "🔄",
  "ai-gateway": "🤖",
  // operate
  "ledger": "📒",
  "quickbooks-adapter": "📘",
  "tally-adapter": "🧾",
  "zoho-books-adapter": "📕",
  // programme
  "communities": "🏘️",
  "live-tv": "📺",
  "lms": "📚",
  "sales": "💼",
  // reach
  "affiliate": "🔗",
  "marketing": "📣",
  "social-media": "📱",
};

export function serviceIcon(svc: string): string {
  return SERVICE_ICONS[svc] ?? "⚙️";
}

export function escapeHtml(s: unknown): string {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!
  );
}

/** Plain-English bucket + accent color for a Stryker mutator name.
 *  Helps readers grok "what kind of bug did Stryker inject" without
 *  having to recognize every mutator. */
export interface MutatorCategory {
  label: string;
  color: string;
  hint: string;
}

const CATEGORIES: Record<string, MutatorCategory> = {
  StringLiteral:        { label: "edge case",     color: "#f5a623", hint: "string boundary — empty or swapped value" },
  ObjectLiteral:        { label: "edge case",     color: "#f5a623", hint: "object emptied — missing fields not asserted" },
  ArrayDeclaration:     { label: "edge case",     color: "#f5a623", hint: "array emptied — collection contents not asserted" },
  ConditionalExpression:{ label: "branch",        color: "#9b6bff", hint: "branch forced true/false — path coverage" },
  BooleanLiteral:       { label: "branch",        color: "#9b6bff", hint: "boolean flipped — branch coverage" },
  LogicalOperator:      { label: "logic",         color: "#9b6bff", hint: "&& ↔ || — combined-condition logic" },
  EqualityOperator:     { label: "comparison",    color: "#54c1ff", hint: "===, <=, > … — boundary comparison" },
  ArithmeticOperator:   { label: "arithmetic",    color: "#54c1ff", hint: "+ ↔ - etc. — numeric calculation" },
  UpdateOperator:       { label: "arithmetic",    color: "#54c1ff", hint: "++ ↔ -- — increment/decrement" },
  AssignmentOperator:   { label: "arithmetic",    color: "#54c1ff", hint: "+= ↔ -= etc. — compound assignment" },
  UnaryOperator:        { label: "negation",      color: "#ff7043", hint: "!x or unary swapped — negation/sign" },
  OptionalChaining:     { label: "null handling", color: "#ff7043", hint: "?. removed — null/undefined safety" },
  MethodExpression:     { label: "method swap",   color: "#7a8095", hint: "method call swapped — wrong API used" },
  BlockStatement:       { label: "control flow",  color: "#7a8095", hint: "block emptied — statements skipped" },
  Regex:                { label: "pattern",       color: "#28d97a", hint: "regex altered — pattern matching" },
};

export function mutatorCategory(mutator: string): MutatorCategory {
  return CATEGORIES[mutator] ?? { label: "other", color: "#7a8095", hint: mutator };
}

/** Visual language for graph links. Direct-call contract bonds render as
 *  solid amber, event-bus segments as dashed cyan; other links keep their
 *  pre-existing styling. Exported as helpers so GalaxyGraph and any future
 *  link-style consumer share one source of truth. */
export const CONTRACT_DEPENDS_COLOR = "#f8d77a";
export const CONTRACT_TOPIC_COLOR   = "#54c1ff";

export function linkColor(l: GraphLink, fallbackBySource: string | undefined): string {
  if (l.kind === "depends")   return CONTRACT_DEPENDS_COLOR + "dd";
  if (l.kind === "publishes") return CONTRACT_TOPIC_COLOR + "dd";
  if (l.kind === "consumes")  return CONTRACT_TOPIC_COLOR + "dd";
  if (l.kind === "contains" && fallbackBySource) return fallbackBySource + "cc";
  return l.cross ? "#f8d77acc" : "#ffffff44";
}

export function linkDashed(l: GraphLink): boolean {
  return l.kind === "publishes" || l.kind === "consumes";
}

export function isContractLink(l: GraphLink): boolean {
  return l.kind === "depends" || l.kind === "publishes" || l.kind === "consumes";
}
