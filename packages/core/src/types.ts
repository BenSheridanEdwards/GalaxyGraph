export type ServiceKey = string;

export interface Survivor {
  mutator: string;
  line: number;
  replacement: string;
}

export interface MutationStats {
  killed: number;
  survived: number;
  ignored?: number;
  total: number;
  score: number;
  survivors?: Survivor[];
}

export interface MutationData {
  aggregate: { killed: number; survived: number; total: number; score: number };
  services: Record<ServiceKey, MutationStats>;
  endpoints: Record<string, MutationStats & { svc: ServiceKey; fnName?: string }>;
}

/** Plain-English narrative parsed from JSDoc on the backend source. The
 *  same shape is used for services, endpoints, and topics so cards can
 *  render them uniformly. Every field optional — cards fall back to
 *  synthetic copy when an annotation is missing. */
export interface NodeNarrative {
  description?: string;
  summary?: string;
  why?: string;
  flow?: string;
  since?: string;
}

export interface ServiceDef {
  id: string;
  svc: ServiceKey;
  file: string;
  narrative?: NodeNarrative;
}

export interface EndpointDef {
  id: string;
  fnName: string;
  noun: string;
  svc: ServiceKey;
  method: string;
  path: string;
  internal?: boolean;
  narrative?: NodeNarrative;
}

export interface TestDef {
  id: string;
  svc: ServiceKey;
  name: string;
  http?: boolean;
  endpoints: string[];
  story?: string;
  category?: string;
}

/** A bus topic declared via `new Topic<...>("name", ...)` in
 *  backend/events/<stem>.ts. Aggregates over every contract that uses it,
 *  so the topic card can render the full fan-out picture. */
export interface TopicDef {
  topic: string;
  file: string;
  narrative?: NodeNarrative;
}

export interface ContractTest {
  name: string;
  /** Bucket the test fits into. Common values: "behaviour", "edge-case",
   *  "resilience", "contract", "error". Free-form so contract authors can
   *  introduce buckets without a code change. */
  category?: string;
  /** Plain-English explanation of what the test is verifying — written for
   *  a non-backend reader. Sourced from the @story JSDoc tag (or, when
   *  absent, the JSDoc body above the test). */
  story?: string;
}

/** Backwards-compatible alias for the contract narrative — same shape as
 *  NodeNarrative, kept as a named export so existing imports keep working. */
export type ContractNarrative = NodeNarrative;

export interface ContractSignals {
  /** ON CONFLICT / eventId-dedupe present in producer or consumer source —
   *  duplicate writes can't double-count. */
  idempotent?: boolean;
  /** Producer or consumer reaches into platform/audit, so this contract's
   *  effects show up in the DPDP/GDPR data-subject export. */
  auditLogged?: boolean;
}

export interface ContractDef {
  id: string;
  file: string;
  describe: string;
  producer: ServiceKey;
  consumer: ServiceKey;
  mode: "direct-call" | "event-bus";
  topic?: string;
  narrative?: ContractNarrative;
  producerFns: string[];
  consumerFns: string[];
  tests: ContractTest[];
  signals?: ContractSignals;
}

export type NodeKind = "service" | "endpoint" | "test" | "topic" | "bond";

export interface TestRef {
  id: string;
  name: string;
  http: boolean;
  svc: ServiceKey;
}

export interface GraphNode {
  id: string;
  name: string;
  kind: NodeKind;
  svc: ServiceKey;
  val: number;
  color: string;
  // service
  file?: string;
  // endpoint
  fnName?: string;
  method?: string;
  path?: string;
  internal?: boolean;
  tests?: TestRef[];
  coverage?: number;
  coverageRatio?: number;
  // test
  http?: boolean;
  // topic / contract bond
  topic?: string;
  topicDef?: TopicDef;
  contract?: ContractDef;
  contracts?: ContractDef[]; // topic node: every contract that uses this topic
  // shared
  narrative?: NodeNarrative;
  mutation?: MutationStats;
  // populated by force layout
  x?: number;
  y?: number;
  z?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  kind: "contains" | "tests" | "depends" | "publishes" | "consumes";
  cross?: boolean;
  reason?: string;
  contractId?: string;
  mode?: "direct-call" | "event-bus";
}

/** Normalized backend architecture payload consumed by @galaxy-graph/core.
 * Adapters for Encore, Express, Nest, FastAPI, OpenAPI, Stryker, etc. should
 * emit this shape so the renderer stays backend-agnostic. */
export interface GalaxyGraphDataset {
  services: ServiceDef[];
  endpoints: EndpointDef[];
  tests: TestDef[];
  contracts: ContractDef[];
  topics: TopicDef[];
  mutation: MutationData;
  colors?: Record<ServiceKey, string>;
}
