import { mutColor, mutLabel, displayName, COLORS } from "./helpers";
import StatBreakdown from "./StatBreakdown";
import StatusGuide from "./StatusGuide";
import TestList from "./TestList";
import MissedMutations from "./MissedMutations";
import EndpointBreakdown from "./EndpointBreakdown";
import ServiceSurvivors from "./ServiceSurvivors";
import CoversList from "./CoversList";
import { DeepDiveContent } from "./DeepDive";
import { ContractCard, TopicCard } from "./ContractInfo";
import {
  DataFlow,
  Flow,
  KindLabel,
  MetaRow,
  Prose,
  ScoreBadge,
  Tagline,
  Toggle,
} from "./narrative";
import { CONTRACTS, ENDPOINTS, TESTS } from "./data";
import { MUTATION } from "./mutation-data";
import type { ContractDef, EndpointDef, GraphNode, TestDef } from "./types";

export type Selection =
  | { kind: "node"; node: GraphNode }
  | { kind: "contract"; contract: ContractDef }
  | null;

interface Props {
  selection: Selection;
}

const CARD_STYLE: React.CSSProperties = {
  bottom: 16,
  right: 16,
  width: 460,
  maxHeight: "min(820px, calc(100vh - 360px))",
  overflowY: "auto",
  padding: "18px 20px 22px",
};

const ACCENT_DOT_STYLE: React.CSSProperties = {
  display: "inline-block",
  width: 9,
  height: 9,
  borderRadius: "50%",
  flex: "0 0 auto",
};

const TITLE_ROW_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: 10,
  marginTop: 4,
  marginBottom: 10,
};

const TITLE_STYLE: React.CSSProperties = {
  fontSize: 18,
  margin: 0,
  fontWeight: 600,
  letterSpacing: 0.1,
  lineHeight: 1.2,
};

export default function InfoCard({ selection }: Props) {
  if (!selection) return null;

  if (selection.kind === "contract") {
    return <ContractCard contract={selection.contract} />;
  }

  const node = selection.node;
  if (node.kind === "service") return <ServiceCard node={node} />;
  if (node.kind === "endpoint") return <EndpointCard node={node} />;
  if (node.kind === "topic") {
    return (
      <TopicCard
        topic={node.topic ?? node.name}
        contracts={node.contracts ?? []}
        topicDef={node.topicDef}
      />
    );
  }
  if (node.kind === "bond" && node.contract) {
    return <ContractCard contract={node.contract} />;
  }
  return <TestCard node={node} />;
}

// ---------- Service card ----------

function ServiceCard({ node }: { node: GraphNode }) {
  const m = node.mutation;
  const c = mutColor(m?.score);
  const svc = node.svc;
  const group = `card-svc-${node.id}`;
  const label = mutLabel(m?.score);

  const endpoints = ENDPOINTS.filter((e) => e.svc === svc);
  const downstream = CONTRACTS.filter((ct) => ct.producer === svc);
  const upstream = CONTRACTS.filter((ct) => ct.consumer === svc);

  // Derive a concrete fallback from the actual endpoint nouns rather than
  // a generic "handles X capabilities" sentence — gives the reader a real
  // sketch of what the service does even before any JSDoc lands.
  const capabilityStrip = endpoints
    .slice(0, 3)
    .map((e) => e.noun)
    .join(" · ");
  const fallbackTagline = capabilityStrip
    ? `${capabilityStrip}${endpoints.length > 3 ? " · …" : ""}`
    : undefined;

  const since = node.narrative?.since;
  const why = node.narrative?.why;
  const flow = node.narrative?.flow;

  return (
    <div
      id="info"
      className="panel"
      style={CARD_STYLE}
      data-testid="info-card-service"
    >
      <KindLabel>Service</KindLabel>
      <div style={TITLE_ROW_STYLE}>
        <span
          aria-hidden
          style={{
            ...ACCENT_DOT_STYLE,
            background: c,
            boxShadow: `0 0 8px ${c}aa`,
          }}
        />
        <h1 style={TITLE_STYLE}>{displayName(svc)}</h1>
      </div>
      <Tagline description={node.narrative?.description} fallback={fallbackTagline} />
      <MetaRow>
        <code>{node.file}</code>
        <span>·</span>
        <span>
          {endpoints.length} endpoint{endpoints.length === 1 ? "" : "s"}
        </span>
        {downstream.length > 0 && (
          <>
            <span>·</span>
            <span>
              {downstream.length} downstream contract
              {downstream.length === 1 ? "" : "s"}
            </span>
          </>
        )}
        {upstream.length > 0 && (
          <>
            <span>·</span>
            <span>
              {upstream.length} upstream contract
              {upstream.length === 1 ? "" : "s"}
            </span>
          </>
        )}
        {since && (
          <>
            <span>·</span>
            <span>since {since}</span>
          </>
        )}
      </MetaRow>

      <Toggle
        group={group}
        title="What it does"
        hint="capabilities"
        count={endpoints.length}
        accent={c}
        defaultOpen
        testId="svc-capabilities"
      >
        <CapabilityList endpoints={endpoints} />
      </Toggle>

      {downstream.length > 0 && (
        <Toggle
          group={group}
          title="Who it talks to"
          hint="downstream"
          count={downstream.length}
          accent="#54c1ff"
          testId="svc-downstream"
        >
          <RelationshipList contracts={downstream} side="downstream" />
        </Toggle>
      )}

      {upstream.length > 0 && (
        <Toggle
          group={group}
          title="Who calls it"
          hint="upstream"
          count={upstream.length}
          accent="#9b6bff"
          testId="svc-upstream"
        >
          <RelationshipList contracts={upstream} side="upstream" />
        </Toggle>
      )}

      {why && (
        <Toggle group={group} title="Why this service exists" testId="svc-why">
          <Prose text={why} />
        </Toggle>
      )}

      {flow && (
        <Toggle group={group} title="How it works" hint="step-by-step" testId="svc-flow">
          <Flow text={flow} />
        </Toggle>
      )}

      <Toggle
        group={group}
        title="Quality"
        hint="how well-tested is this?"
        accent={c}
        testId="svc-quality"
        rightSlot={
          m ? <ScoreBadge score={m.score} color={c} /> : <ScoreBadge score={null} color={c} />
        }
      >
        <QualityBlock m={m} c={c} label={label} />
        <StatBreakdown mutation={m} />
        <StatusGuide />
        <EndpointBreakdown svc={svc} />
        <ServiceSurvivors svc={svc} />
      </Toggle>

      <Toggle group={group} title="What does the score actually mean?" testId="svc-deepdive">
        <DeepDiveContent />
      </Toggle>
    </div>
  );
}

// ---------- Endpoint card ----------

function EndpointCard({ node }: { node: GraphNode }) {
  const m = node.mutation;
  const c = mutColor(m?.score);
  const group = `card-ep-${node.id}`;
  const label = mutLabel(m?.score);

  const fnName = node.fnName ?? "";
  // No synthetic fallback — the meta row already shows method + path. When
  // no JSDoc description exists we'd rather render nothing than repeat data.
  const fallbackTagline: string | undefined = undefined;

  const callers = CONTRACTS.filter(
    (ct) => ct.consumer === node.svc && ct.consumerFns.includes(fnName)
  );
  const triggers = CONTRACTS.filter(
    (ct) => ct.producer === node.svc && ct.producerFns.includes(fnName)
  );

  const since = node.narrative?.since;
  const why = node.narrative?.why;
  const flow = node.narrative?.flow;

  return (
    <div
      id="info"
      className="panel"
      style={CARD_STYLE}
      data-testid="info-card-endpoint"
    >
      <KindLabel chip={<span style={{ color: COLORS[node.svc] }}>{displayName(node.svc)}</span>}>
        Endpoint
      </KindLabel>
      <div style={TITLE_ROW_STYLE}>
        <span
          aria-hidden
          style={{
            ...ACCENT_DOT_STYLE,
            background: c,
            boxShadow: `0 0 8px ${c}aa`,
          }}
        />
        <h1 style={TITLE_STYLE}>{node.name}</h1>
      </div>
      <Tagline description={node.narrative?.description} fallback={fallbackTagline} />
      <MetaRow>
        <code>{fnName}</code>
        <span>·</span>
        <span>{node.method}</span>
        <code>{node.path}</code>
        {node.internal && (
          <>
            <span>·</span>
            <span>internal</span>
          </>
        )}
        {since && (
          <>
            <span>·</span>
            <span>since {since}</span>
          </>
        )}
      </MetaRow>

      <Toggle
        group={group}
        title="How it's tested"
        hint={`${node.tests?.length ?? 0} test${(node.tests?.length ?? 0) === 1 ? "" : "s"} cover this`}
        count={node.tests?.length ?? 0}
        accent={c}
        defaultOpen
        testId="ep-tests"
      >
        <TestList tests={node.tests ?? []} />
      </Toggle>

      {flow && (
        <Toggle
          group={group}
          title="What happens when this is called"
          hint="step-by-step"
          testId="ep-flow"
        >
          <Flow text={flow} />
        </Toggle>
      )}

      {(callers.length > 0 || triggers.length > 0) && (
        <Toggle
          group={group}
          title="Who calls this and what happens next"
          count={callers.length + triggers.length}
          accent="#54c1ff"
          testId="ep-relationships"
        >
          <EndpointRelationships callers={callers} triggers={triggers} />
        </Toggle>
      )}

      {why && (
        <Toggle group={group} title="Why this endpoint exists" testId="ep-why">
          <Prose text={why} />
        </Toggle>
      )}

      <Toggle
        group={group}
        title="Quality"
        hint="how well-tested is this endpoint?"
        accent={c}
        testId="ep-quality"
        rightSlot={
          m ? <ScoreBadge score={m.score} color={c} /> : <ScoreBadge score={null} color={c} />
        }
      >
        <QualityBlock m={m} c={c} label={label} />
        <StatBreakdown mutation={m} />
        <StatusGuide />
        <MissedMutations mutation={m} />
      </Toggle>

      <div className="muted" style={{ marginTop: 12, fontSize: 11 }}>
        service: <span style={{ color: COLORS[node.svc] }}>{displayName(node.svc)}</span>
      </div>
      <Toggle group={group} title="What does the score actually mean?" testId="ep-deepdive">
        <DeepDiveContent />
      </Toggle>
    </div>
  );
}

// ---------- Test card ----------

function TestCard({ node }: { node: GraphNode }) {
  const tdef = useTestDef(node.id);
  const story = tdef?.story;
  const category = tdef?.category;
  const meta = category ? categoryMeta(category) : null;
  const group = `card-test-${node.id}`;

  const kindLabel = node.http ? "HTTP contract test" : "Unit test";

  return (
    <div id="info" className="panel" style={CARD_STYLE} data-testid="info-card-test">
      <KindLabel chip={<span style={{ color: COLORS[node.svc] }}>{displayName(node.svc)}</span>}>
        {kindLabel}
      </KindLabel>
      <div style={TITLE_ROW_STYLE}>
        <span
          aria-hidden
          style={{
            ...ACCENT_DOT_STYLE,
            background: meta?.color ?? "#28d97a",
          }}
        />
        <h1 style={{ ...TITLE_STYLE, fontSize: 17, lineHeight: 1.25 }}>{node.name}</h1>
      </div>
      {story && (
        <Tagline description={story} fallback={node.name} />
      )}
      <MetaRow>
        {meta && (
          <span
            style={{
              fontSize: 10,
              letterSpacing: 0.4,
              textTransform: "uppercase",
              color: meta.color,
              background: meta.color + "1a",
              border: `1px solid ${meta.color}55`,
              borderRadius: 3,
              padding: "1px 6px",
              fontWeight: 600,
            }}
            data-testid="test-category-chip"
          >
            {meta.label}
          </span>
        )}
        <span>
          service:{" "}
          <span style={{ color: COLORS[node.svc] }}>{displayName(node.svc)}</span>
        </span>
      </MetaRow>

      <Toggle group={group} title="What this test covers" defaultOpen testId="test-covers">
        <CoversList testId={node.id} />
      </Toggle>

      {meta && (
        <Toggle
          group={group}
          title="What kind of guarantee"
          hint={meta.label.toLowerCase()}
          accent={meta.color}
          testId="test-category"
        >
          <Prose text={meta.hint} />
        </Toggle>
      )}
    </div>
  );
}

// ---------- Helpers ----------

function CapabilityList({ endpoints }: { endpoints: EndpointDef[] }) {
  if (endpoints.length === 0) {
    return (
      <div style={{ fontSize: 13, color: "#7a8095" }}>
        No endpoints declared on this service yet.
      </div>
    );
  }
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {endpoints.map((ep) => {
        const epKey = ep.id.replace("ep:", "");
        const m = MUTATION.endpoints[epKey];
        const c = mutColor(m?.score);
        const tagline = ep.narrative?.description?.split(/\n\s*\n/)[0]?.trim();
        return (
          <li
            key={ep.id}
            style={{
              padding: "6px 0",
              borderBottom: "1px dashed #1c2030",
              fontSize: 13,
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ ...ACCENT_DOT_STYLE, width: 6, height: 6, background: c }} />
              <span style={{ color: "#cfd3e2", fontWeight: 500 }}>{ep.noun}</span>
              <span style={{ marginLeft: "auto", fontSize: 10.5, color: "#7a8095" }}>
                <code style={{ color: "#7a8095" }}>{ep.fnName}</code> · {ep.method}
              </span>
            </div>
            {tagline && (
              <div style={{ marginTop: 2, fontSize: 12, color: "#a8aec1", paddingLeft: 14 }}>
                {tagline}
              </div>
            )}
            <div style={{ marginTop: 2, fontSize: 10.5, color: "#5c6370", paddingLeft: 14 }}>
              <code>{ep.path}</code>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function RelationshipList({
  contracts,
  side,
}: {
  contracts: ContractDef[];
  side: "downstream" | "upstream";
}) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {contracts.map((ct) => {
        const otherSvc = side === "downstream" ? ct.consumer : ct.producer;
        const arrow = side === "downstream" ? "→" : "←";
        const tagline = ct.narrative?.description?.split(/\n\s*\n/)[0]?.trim() ?? ct.describe;
        return (
          <li
            key={ct.id}
            style={{
              padding: "6px 0",
              borderBottom: "1px dashed #1c2030",
              fontSize: 13,
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ color: "#7a8095", fontSize: 12 }}>{arrow}</span>
              <span style={{ color: COLORS[otherSvc], fontWeight: 500 }}>
                {displayName(otherSvc)}
              </span>
              <span style={{ marginLeft: "auto", fontSize: 10.5, color: "#7a8095" }}>
                {ct.mode === "event-bus" ? `event-bus · ${ct.topic ?? ""}` : "direct call"}
              </span>
            </div>
            <div style={{ marginTop: 2, fontSize: 12, color: "#a8aec1", paddingLeft: 18 }}>
              {tagline}
            </div>
            <div style={{ marginTop: 2, fontSize: 10.5, color: "#5c6370", paddingLeft: 18 }}>
              {ct.tests.length} test{ct.tests.length === 1 ? "" : "s"}
              {ct.signals?.idempotent ? " · idempotent" : ""}
              {ct.signals?.auditLogged ? " · audit-logged" : ""}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function EndpointRelationships({
  callers,
  triggers,
}: {
  callers: ContractDef[];
  triggers: ContractDef[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {callers.length > 0 && (
        <div>
          <div style={{ fontSize: 10.5, color: "#7a8095", letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 4 }}>
            Called by
          </div>
          <RelationshipList contracts={callers} side="upstream" />
        </div>
      )}
      {triggers.length > 0 && (
        <div>
          <div style={{ fontSize: 10.5, color: "#7a8095", letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 4 }}>
            Fans out to
          </div>
          <RelationshipList contracts={triggers} side="downstream" />
        </div>
      )}
      {triggers.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <DataFlow
            producers={[triggers[0].producer]}
            consumers={triggers.map((c) => c.consumer)}
            topic={triggers[0].topic}
            bus={triggers[0].mode === "event-bus"}
            producerRole="emits"
            consumerRole="reacts"
            emphasiseSvc={triggers[0].producer}
          />
        </div>
      )}
    </div>
  );
}

function QualityBlock({
  m,
  c,
  label,
}: {
  m: GraphNode["mutation"];
  c: string;
  label: string;
}) {
  if (!m) {
    return (
      <div style={{ fontSize: 13, color: "#7a8095" }}>
        Mutation testing hasn't been run for this yet.
      </div>
    );
  }
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 10,
      }}
    >
      <div className="big" data-testid="big-score" style={{ color: c, margin: 0 }}>
        {Math.round(m.score)}
        <span className="pct">%</span>
      </div>
      <span
        className="status-pill"
        style={{ color: c, background: c + "22", border: `1px solid ${c}` }}
      >
        {label}
      </span>
    </div>
  );
}

// Lookup helpers — TestDef lives in `./data` and carries the @story / @category
// metadata parsed from the test file's JSDoc.
function useTestDef(testId: string): TestDef | undefined {
  return TESTS.find((t) => t.id === testId);
}

const TEST_CATEGORY_META: Record<string, { label: string; color: string; hint: string }> = {
  behaviour: {
    label: "Behaviour",
    color: "#28d97a",
    hint: "A happy-path guarantee — proves the success route works end to end.",
  },
  "edge-case": {
    label: "Edge case",
    color: "#f5a623",
    hint: "A producer-side guard — bad input, repeats, races, and other awkward shapes.",
  },
  resilience: {
    label: "Resilience",
    color: "#54c1ff",
    hint: "A consumer-side promise — retries, idempotency, recovery from a wobble.",
  },
  contract: {
    label: "Contract shape",
    color: "#9b6bff",
    hint: "Pins down the public shape — methods, payloads, paths.",
  },
  error: {
    label: "Error path",
    color: "#e63946",
    hint: "How the system fails safely when something has gone wrong.",
  },
};

function categoryMeta(cat: string) {
  return (
    TEST_CATEGORY_META[cat] ?? {
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      color: "#7a8095",
      hint: "",
    }
  );
}
