import { COLORS, CONTRACT_TOPIC_COLOR, displayName } from "./helpers";
import {
  DataFlow,
  Flow,
  GuaranteeBadge,
  KIND_LABEL_STYLE,
  KindLabel,
  Prose,
  Subhead,
  Tagline,
  Toggle,
  renderInline,
} from "./narrative";
import type { ContractDef, ContractTest, TopicDef } from "./types";

const CARD_STYLE: React.CSSProperties = {
  bottom: 16,
  right: 16,
  width: 460,
  maxHeight: "min(820px, calc(100vh - 360px))",
  overflowY: "auto",
  padding: "18px 20px 22px",
};

interface ContractCardProps {
  contract: ContractDef;
}

const CATEGORY_ORDER = ["behaviour", "edge-case", "resilience", "contract", "error"] as const;
type KnownCategory = typeof CATEGORY_ORDER[number];
const CATEGORY_META: Record<string, { label: string; color: string; hint: string }> = {
  behaviour:    { label: "What we test",  color: "#28d97a", hint: "Happy-path guarantees" },
  "edge-case":  { label: "Edge cases",    color: "#f5a623", hint: "Producer-side guards: bad input, repeats, races" },
  resilience:   { label: "Resilience",    color: "#54c1ff", hint: "Consumer-side: retries, idempotency, recovery" },
  contract:     { label: "Contract shape", color: "#9b6bff", hint: "API methods, payloads, paths" },
  error:        { label: "Error paths",   color: "#e63946", hint: "How the system fails safely" },
};
function categoryMeta(cat: string) {
  return CATEGORY_META[cat] ?? { label: cat.charAt(0).toUpperCase() + cat.slice(1), color: "#7a8095", hint: "" };
}

/** Group tests by category, defaulting unlabelled tests to "behaviour" so a
 *  contract without JSDoc still tells the reader "this is the happy-path
 *  story" rather than dumping everything into a meaningless "other" bucket. */
function groupTests(tests: ContractTest[]): [string, ContractTest[]][] {
  const groups = new Map<string, ContractTest[]>();
  for (const t of tests) {
    const key = t.category ?? "behaviour";
    const list = groups.get(key) ?? [];
    list.push(t);
    groups.set(key, list);
  }
  const out: [string, ContractTest[]][] = [];
  for (const k of CATEGORY_ORDER) {
    const list = groups.get(k);
    if (list) out.push([k, list]);
  }
  for (const [k, list] of [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (!CATEGORY_ORDER.includes(k as KnownCategory)) out.push([k, list]);
  }
  return out;
}

/** Architecture properties we can derive from the contract definition.
 *  Each badge represents a concrete, machine-checkable property: mode is
 *  read off the contract test file, idempotent and audit-logged come from
 *  the build script grepping the producer / consumer source for the
 *  patterns that prove them (ON CONFLICT, audit.recordEvent). */
function badgesFor(c: ContractDef): { label: string; color: string; why: string }[] {
  const out: { label: string; color: string; why: string }[] = [];
  if (c.mode === "event-bus") {
    out.push({
      label: "Bus-decoupled",
      color: CONTRACT_TOPIC_COLOR,
      why: "The producer publishes an event and forgets about it. If the consumer is slow, redeploying, or down, the producer's flow still completes — and new subscribers can plug in later without the producer ever knowing about them.",
    });
  } else {
    out.push({
      label: "Direct call",
      color: "#f8d77a",
      why: "The producer calls the consumer in-process and waits for the reply. Simpler to reason about than a bus, but the two share fate: if the consumer is down, the producer's flow fails too.",
    });
  }
  if (c.signals?.idempotent) {
    out.push({
      label: "Idempotent",
      color: "#54c1ff",
      why: "Safe to retry. The persistence layer (ON CONFLICT / dedupe key) absorbs duplicate writes, so bus re-deliveries, network blips, and double-clicks can't double-count.",
    });
  }
  if (c.signals?.auditLogged) {
    out.push({
      label: "Audit-logged",
      color: "#f5a623",
      why: "Every change leaves a row in platform/audit. Required for DPDP/GDPR data-subject exports and gives investigators a complete trail when something looks off in production.",
    });
  }
  return out;
}

export function ContractCard({ contract: c }: ContractCardProps) {
  const producerColor = COLORS[c.producer] ?? "#7a8095";
  const consumerColor = COLORS[c.consumer] ?? "#7a8095";
  const modeLabel = c.mode === "event-bus" ? "Event-bus contract" : "Direct-call contract";
  const grouped = groupTests(c.tests);
  const behaviour = grouped.find(([cat]) => cat === "behaviour");
  const otherCategories = grouped.filter(([cat]) => cat !== "behaviour");
  const detail = c.narrative?.why ?? c.narrative?.summary;

  return (
    <div id="info" className="panel" style={CARD_STYLE} data-testid="info-card-contract">
      <KindLabel>{modeLabel}</KindLabel>
      <h1 style={{ fontSize: 17, lineHeight: 1.25, margin: "2px 0 10px" }}>
        <span style={{ color: producerColor }}>{displayName(c.producer)}</span>
        <span style={{ color: "#8b90a3" }}> → </span>
        <span style={{ color: consumerColor }}>{displayName(c.consumer)}</span>
      </h1>

      <Tagline
        description={c.narrative?.description}
        fallback={`${displayName(c.producer)} hands work off to ${displayName(c.consumer)}.`}
      />

      <div
        style={{
          marginTop: 10,
          fontSize: 11,
          color: "#7a8095",
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "baseline",
        }}
        data-testid="contract-path"
      >
        <code>{c.file}</code>
        {c.narrative?.since && (
          <span data-testid="contract-since">since {c.narrative.since}</span>
        )}
      </div>

      {behaviour && (
        <Toggle
          group={`contract-${c.id}`}
          title={CATEGORY_META.behaviour.label}
          accent={CATEGORY_META.behaviour.color}
          count={behaviour[1].length}
          hint={CATEGORY_META.behaviour.hint}
          defaultOpen
          testId="section-behaviour"
        >
          <TestList tests={behaviour[1]} accent={CATEGORY_META.behaviour.color} />
        </Toggle>
      )}

      {otherCategories.map(([cat, tests]) => {
        const meta = categoryMeta(cat);
        return (
          <Toggle
            key={cat}
            group={`contract-${c.id}`}
            title={meta.label}
            accent={meta.color}
            count={tests.length}
            hint={meta.hint}
            testId={`section-${cat}`}
          >
            <TestList tests={tests} accent={meta.color} />
          </Toggle>
        );
      })}

      {detail && (
        <Toggle group={`contract-${c.id}`} title="Why does this relationship exist?" testId="section-why">
          <Prose text={detail} />
        </Toggle>
      )}

      {c.narrative?.flow && (
        <Toggle group={`contract-${c.id}`} title="How it flows" testId="section-flow">
          <Flow text={c.narrative.flow} />
        </Toggle>
      )}

      <Toggle group={`contract-${c.id}`} title="Architecture & Wiring" testId="section-wiring">
        <Architecture contract={c} />
      </Toggle>
    </div>
  );
}

function TestList({ tests, accent }: { tests: ContractTest[]; accent: string }) {
  return (
    <ul style={{ margin: 0, padding: "0 0 0 4px", listStyle: "none" }}>
      {tests.map((t, i) => (
        <li
          key={i}
          style={{
            marginTop: i === 0 ? 0 : 8,
            fontSize: 12.5,
            color: "#cfd3e2",
            display: "flex",
            gap: 6,
            lineHeight: 1.45,
          }}
        >
          <span style={{ color: accent }}>✓</span>
          <span>{renderInline(t.story ?? sentenceCase(t.name))}</span>
        </li>
      ))}
    </ul>
  );
}

function sentenceCase(name: string): string {
  if (!name) return name;
  const trimmed = name.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/** Filter the imported names down to the runtime entry points the
 *  reader actually cares about. The contract test pulls in `db` and
 *  PascalCase types alongside functions; for an architecture diagram
 *  only the lowercase function-shaped names are signal. */
function entryPointsOf(fns: string[]): string[] {
  return fns.filter((f) => f !== "db" && /^[a-z]/.test(f));
}

function Architecture({ contract: c }: { contract: ContractDef }) {
  const badges = badgesFor(c);
  const isBus = c.mode === "event-bus" && !!c.topic;
  return (
    <div>
      {badges.length > 0 && (
        <>
          <Subhead>Guarantees</Subhead>
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}
            data-testid="contract-badges"
          >
            {badges.map((b) => (
              <GuaranteeBadge key={b.label} label={b.label} color={b.color} why={b.why} />
            ))}
          </div>
        </>
      )}

      <Subhead>Data flow</Subhead>
      <DataFlow
        producers={[c.producer]}
        consumers={[c.consumer]}
        topic={c.topic}
        bus={isBus}
        producerRole={isBus ? "publishes" : "calls"}
        consumerRole={isBus ? "subscribes" : "responds"}
        producerFns={{ [c.producer]: entryPointsOf(c.producerFns) }}
        consumerFns={{ [c.consumer]: entryPointsOf(c.consumerFns) }}
      />
    </div>
  );
}

interface TopicCardProps {
  topic: string;
  contracts: ContractDef[];
  /** File path + JSDoc narrative for the topic itself, parsed from
   *  `new Topic<...>(...)` in backend/events/<stem>.ts. Optional — the
   *  card falls back to a synthetic tagline if missing. */
  topicDef?: TopicDef;
}

export function TopicCard({ topic, contracts, topicDef }: TopicCardProps) {
  const producers = Array.from(new Set(contracts.map((c) => c.producer)));
  const consumers = Array.from(new Set(contracts.map((c) => c.consumer)));
  // A topic's effective signals = the ones every contract sharing it agrees
  // on. Bus-decoupled is intrinsic; the rest are gated on universal
  // agreement so we never misrepresent a partially-safe topic.
  const allIdempotent = contracts.length > 0 && contracts.every((c) => c.signals?.idempotent);
  const allAudit = contracts.length > 0 && contracts.every((c) => c.signals?.auditLogged);
  const detail = topicDef?.narrative?.why ?? topicDef?.narrative?.summary;

  return (
    <div
      id="info"
      className="panel"
      style={CARD_STYLE}
      data-testid="info-card-topic"
    >
      <KindLabel>Event-bus topic</KindLabel>
      <h1 style={{ fontSize: 18, color: CONTRACT_TOPIC_COLOR, margin: "2px 0 10px" }}>{topic}</h1>

      <Tagline
        description={topicDef?.narrative?.description}
        fallback={`Event fired by ${producers.map(displayName).join(", ") || "a producer"} so downstream services can react without being directly called.`}
      />

      <div
        style={{
          marginTop: 10,
          fontSize: 11,
          color: "#7a8095",
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "baseline",
        }}
      >
        {topicDef?.file && <code>{topicDef.file}</code>}
        {topicDef?.narrative?.since && <span>since {topicDef.narrative.since}</span>}
        <span>
          {producers.length} publisher{producers.length === 1 ? "" : "s"} ·{" "}
          {consumers.length} subscriber{consumers.length === 1 ? "" : "s"} ·{" "}
          {contracts.length} contract{contracts.length === 1 ? "" : "s"}
        </span>
      </div>

      <Toggle
        group={`topic-${topic}`}
        title="Who reacts when this fires"
        hint={`${consumers.length} subscriber${consumers.length === 1 ? "" : "s"}`}
        count={contracts.length}
        defaultOpen
        testId="topic-section-subscribers"
      >
        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {contracts.map((c) => {
            const tagline =
              c.narrative?.description?.split(/\n\s*\n/)[0]?.replace(/\s+/g, " ").trim();
            return (
              <li
                key={c.id}
                style={{
                  padding: "8px 0",
                  borderTop: "1px dashed #232838",
                  fontSize: 12.5,
                  color: "#cfd3e2",
                }}
              >
                <div>
                  <span style={{ color: COLORS[c.producer] ?? "#7a8095" }}>
                    {displayName(c.producer)}
                  </span>
                  <span style={{ color: "#8b90a3" }}> → </span>
                  <span style={{ color: COLORS[c.consumer] ?? "#7a8095" }}>
                    {displayName(c.consumer)}
                  </span>
                  <span style={{ color: "#7a8095" }}>
                    {" · "}
                    {c.tests.length} test{c.tests.length === 1 ? "" : "s"}
                  </span>
                </div>
                {tagline && (
                  <div style={{ marginTop: 2, color: "#a8aec1", fontSize: 12 }}>
                    {renderInline(tagline)}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Toggle>

      {detail && (
        <Toggle group={`topic-${topic}`} title="Why this topic exists" testId="topic-section-why">
          <Prose text={detail} />
        </Toggle>
      )}

      {topicDef?.narrative?.flow && (
        <Toggle group={`topic-${topic}`} title="How it flows" testId="topic-section-flow">
          <Flow text={topicDef.narrative.flow} />
        </Toggle>
      )}

      <Toggle group={`topic-${topic}`} title="Architecture & Wiring" testId="topic-section-wiring">
        <div>
          <Subhead>Guarantees</Subhead>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
            <GuaranteeBadge
              label="Bus-decoupled"
              color={CONTRACT_TOPIC_COLOR}
              why="Publishers fire and forget. Subscribers can be added or redeployed without the publisher knowing."
            />
            {allIdempotent && (
              <GuaranteeBadge
                label="Idempotent"
                color="#54c1ff"
                why="Every subscriber on this topic absorbs duplicate deliveries safely (ON CONFLICT or dedupe key in their persistence layer)."
              />
            )}
            {allAudit && (
              <GuaranteeBadge
                label="Audit-logged"
                color="#f5a623"
                why="Every contract sharing this topic writes to platform/audit, so every fan-out has a permanent trail."
              />
            )}
          </div>
          <Subhead>Data flow</Subhead>
          <DataFlow
            producers={producers}
            consumers={consumers}
            topic={topic}
            bus
            producerRole="publishes"
            consumerRole="subscribes"
          />
        </div>
      </Toggle>
    </div>
  );
}

export { KIND_LABEL_STYLE };
