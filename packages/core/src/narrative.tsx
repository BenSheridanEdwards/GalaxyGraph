/**
 *  Shared rendering primitives for every InfoCard (service / endpoint /
 *  test / topic / contract). Keeps the visual language identical across
 *  cards: tagline-first reading order, exclusive-accordion stack of
 *  toggles, JSDoc-style inline markdown, numbered flow lists.
 *
 *  Originally lived inside ContractInfo.tsx (commit 466e304); extracted
 *  here so non-contract cards can adopt the same shape without a copy-
 *  paste regression risk.
 */
import { COLORS, CONTRACT_TOPIC_COLOR, displayName } from "./helpers";

export const KIND_LABEL_STYLE: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: 1,
  textTransform: "uppercase",
  color: "#8b90a3",
};

export const PROSE_STYLE: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.55,
  color: "#cfd3e2",
};

const SUBHEAD_STYLE: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: 0.8,
  textTransform: "uppercase",
  color: "#7a8095",
  fontWeight: 600,
  marginBottom: 6,
};

/** "SERVICE", "ENDPOINT", etc. — small uppercase tag above the title.
 *  Optional `chip` renders an inline context pill ("· in Volunteering"). */
export function KindLabel({ children, chip }: { children: React.ReactNode; chip?: React.ReactNode }) {
  return (
    <div style={KIND_LABEL_STYLE}>
      {children}
      {chip && (
        <>
          <span style={{ color: "#3a4055" }}>  ·  </span>
          {chip}
        </>
      )}
    </div>
  );
}

/** The first-read tagline that answers "what is this?" in plain English,
 *  followed by an optional muted elaborator paragraph. Splits a JSDoc
 *  description on blank lines: para 1 → tagline, para 2 → elaborator.
 *
 *  `fallback` is optional. When neither a JSDoc description nor a fallback
 *  is available the tagline simply doesn't render — better than synthetic
 *  boilerplate ("X handles X capabilities for the platform"). */
export function Tagline({ description, fallback }: { description?: string; fallback?: string }) {
  const paras = (description ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const tagline = paras[0] ?? fallback;
  const elaborator = paras[1];
  if (!tagline) return null;
  return (
    <>
      <div
        style={{ fontSize: 14, lineHeight: 1.4, color: "#e6e9f2", fontWeight: 500 }}
        data-testid="card-tagline"
      >
        {renderInline(tagline)}
      </div>
      {elaborator && (
        <div
          style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5, color: "#a8aec1" }}
          data-testid="card-elaborator"
        >
          {renderInline(elaborator)}
        </div>
      )}
    </>
  );
}

/** Path / since / extra-bits row beneath the tagline. */
export function MetaRow({ children }: { children: React.ReactNode }) {
  return (
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
      data-testid="card-meta"
    >
      {children}
    </div>
  );
}

/** Single uniform collapsible row. Sharing a `group` name makes the
 *  browser enforce exclusive open behaviour natively (HTML5 details
 *  name attribute) — open one, the others close. */
export function Toggle({
  group,
  title,
  accent,
  count,
  hint,
  defaultOpen,
  testId,
  rightSlot,
  children,
}: {
  group?: string;
  title: string;
  accent?: string;
  count?: number;
  hint?: string;
  defaultOpen?: boolean;
  testId?: string;
  /** Renders aligned to the far right of the summary row (e.g. a score badge). */
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <details
      name={group}
      open={defaultOpen}
      data-testid={testId}
      style={{ marginTop: 10, borderTop: "1px solid #1f2330", paddingTop: 10 }}
    >
      <summary
        style={{
          listStyle: "none",
          cursor: "pointer",
          userSelect: "none",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "2px 0",
          color: "#cfd3e2",
        }}
      >
        <span aria-hidden style={{ fontSize: 9, color: "#7a8095", width: 8 }}>▸</span>
        <span style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: 0.1 }}>{title}</span>
        {hint && (
          <span style={{ fontSize: 11, color: "#7a8095", fontWeight: 400 }}>· {hint}</span>
        )}
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          {rightSlot}
          {typeof count === "number" && (
            <span style={{ fontSize: 11, color: "#7a8095" }}>{count}</span>
          )}
          {accent && (
            <span
              aria-hidden
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: accent,
                boxShadow: `0 0 6px ${accent}88`,
              }}
            />
          )}
        </span>
      </summary>
      <div style={{ marginTop: 8 }}>{children}</div>
    </details>
  );
}

/** Reflow JSDoc-wrapped prose. Authors write at ~72 cols; the card is
 *  narrower so we rewrap. Splits on blank lines for paragraphs, collapses
 *  internal whitespace, supports inline markdown (italic / bold / code). */
export function Prose({ text }: { text: string }) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  return (
    <>
      {paragraphs.map((p, i) => (
        <p
          key={i}
          style={{
            ...PROSE_STYLE,
            color: "#a8aec1",
            margin: i === 0 ? "0 0 0" : "8px 0 0",
          }}
        >
          {renderInline(p)}
        </p>
      ))}
    </>
  );
}

/** @flow is conventionally a numbered list. Render it as one — keeps the
 *  step structure visible. Lines that don't match the list pattern fall
 *  through to plain prose so we don't lose unstructured content. */
export function Flow({ text }: { text: string }) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const items: string[] = [];
  let current = "";
  for (const line of lines) {
    if (/^\d+\.\s+/.test(line)) {
      if (current) items.push(current);
      current = line.replace(/^\d+\.\s+/, "");
    } else {
      current = current ? `${current} ${line}` : line;
    }
  }
  if (current) items.push(current);
  if (items.length <= 1) return <Prose text={text} />;
  return (
    <ol style={{ ...PROSE_STYLE, color: "#a8aec1", margin: 0, paddingLeft: 20 }}>
      {items.map((step, i) => (
        <li key={i} style={{ marginTop: i === 0 ? 0 : 6 }}>
          {renderInline(step)}
        </li>
      ))}
    </ol>
  );
}

/** Tiny inline-markdown renderer: `code`, **bold**, *italic*. Anything
 *  else passes through untouched. */
export function renderInline(text: string): React.ReactNode[] {
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const match of text.matchAll(re)) {
    const idx = match.index ?? 0;
    if (idx > last) parts.push(text.slice(last, idx));
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(
        <strong key={key++} style={{ color: "#cfd3e2" }}>
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("`")) {
      parts.push(
        <code key={key++} style={{ color: "#cfd3e2" }}>
          {token.slice(1, -1)}
        </code>
      );
    } else {
      parts.push(<em key={key++}>{token.slice(1, -1)}</em>);
    }
    last = idx + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function Subhead({ children }: { children: React.ReactNode }) {
  return <div style={SUBHEAD_STYLE}>{children}</div>;
}

/** Architectural-property pill with a hover tooltip that explains the
 *  guarantee in plain English. Reused across cards (contract + topic). */
export function GuaranteeBadge({
  label,
  color,
  why,
}: {
  label: string;
  color: string;
  why: string;
}) {
  return (
    <span className="badge" tabIndex={0}>
      <span
        style={{
          fontSize: 10,
          letterSpacing: 0.4,
          textTransform: "uppercase",
          fontWeight: 600,
          color,
          background: color + "1a",
          border: `1px solid ${color}55`,
          borderRadius: 3,
          padding: "2px 6px",
          cursor: "help",
        }}
      >
        {label}
      </span>
      <span className="badge-tip" role="tooltip">
        <span className="badge-tip-title" style={{ color }}>
          {label}
        </span>
        {why}
      </span>
    </span>
  );
}

/** Vertical pipeline diagram: producer(s) → optional topic → consumer(s).
 *  Used by the contract card (1:1 plus optional topic), service card
 *  (1 → 1 topic → N consumers), and topic card (1..N → topic → 1..N). */
export function DataFlow({
  producers,
  consumers,
  topic,
  producerRole = "publishes",
  consumerRole = "subscribes",
  bus = false,
  emphasiseSvc,
  producerFns,
  consumerFns,
}: {
  producers: string[];
  consumers: string[];
  topic?: string;
  producerRole?: string;
  consumerRole?: string;
  bus?: boolean;
  /** Highlight one svc name with a "← THIS" marker (used on the service card). */
  emphasiseSvc?: string;
  /** Function-name lists, keyed by svc, rendered inside each ServiceNode. */
  producerFns?: Record<string, string[]>;
  consumerFns?: Record<string, string[]>;
}) {
  const showTopic = bus && !!topic;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: 0 }}>
      {producers.map((svc) => (
        <ServiceNode
          key={`p-${svc}`}
          svc={svc}
          role={producerRole}
          fns={producerFns?.[svc] ?? []}
          emphasised={emphasiseSvc === svc}
        />
      ))}
      <FlowArrow label={bus ? producerRole : producerRole === "publishes" ? "publishes" : "calls directly"} />
      {showTopic && (
        <>
          <TopicNode topic={topic!} />
          <FlowArrow label="delivers to" />
        </>
      )}
      {consumers.map((svc) => (
        <ServiceNode
          key={`c-${svc}`}
          svc={svc}
          role={consumerRole}
          fns={consumerFns?.[svc] ?? []}
          emphasised={emphasiseSvc === svc}
        />
      ))}
    </div>
  );
}

function ServiceNode({
  svc,
  role,
  fns,
  emphasised,
}: {
  svc: string;
  role: string;
  fns: string[];
  emphasised?: boolean;
}) {
  const color = COLORS[svc] ?? "#7a8095";
  return (
    <div
      style={{
        border: `1px solid ${color}${emphasised ? "aa" : "55"}`,
        background: color + (emphasised ? "1a" : "0d"),
        borderRadius: 6,
        padding: "8px 10px",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span
          aria-hidden
          style={{ width: 6, height: 6, borderRadius: "50%", background: color, flex: "0 0 auto" }}
        />
        <span style={{ fontSize: 12.5, fontWeight: 600, color }}>{displayName(svc)}</span>
        {emphasised && (
          <span style={{ fontSize: 10, color: "#cfd3e2", letterSpacing: 0.4 }}>← this</span>
        )}
        <span style={{ fontSize: 10.5, color: "#7a8095", marginLeft: "auto", letterSpacing: 0.3 }}>
          {role}
        </span>
      </div>
      {fns.length > 0 && (
        <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.5 }}>
          {fns.map((f, i) => (
            <span key={f}>
              <code style={{ color }}>{f}</code>
              {i < fns.length - 1 ? <span style={{ color: "#5c6370" }}>, </span> : null}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function TopicNode({ topic }: { topic: string }) {
  return (
    <div
      style={{
        border: `1px dashed ${CONTRACT_TOPIC_COLOR}66`,
        background: CONTRACT_TOPIC_COLOR + "0d",
        borderRadius: 6,
        padding: "6px 10px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 10, color: "#7a8095", letterSpacing: 0.6, textTransform: "uppercase" }}>
        Topic
      </div>
      <code style={{ color: CONTRACT_TOPIC_COLOR, fontSize: 12.5 }}>{topic}</code>
    </div>
  );
}

function FlowArrow({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "6px 0",
        color: "#7a8095",
        fontSize: 10.5,
        letterSpacing: 0.4,
        textTransform: "uppercase",
      }}
    >
      <span aria-hidden style={{ width: 1, height: 10, background: "#3a4055" }} />
      <span>{label}</span>
      <span aria-hidden>▼</span>
    </div>
  );
}

/** Compact score badge for use inside accordion summary rows.  The value
 *  is `null` when the score isn't available — the badge then renders
 *  `—%` rather than disappearing, so the row still reads as "this exists,
 *  just hasn't been measured yet". */
export function ScoreBadge({ score, color }: { score: number | null; color: string }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color,
        background: color + "1a",
        border: `1px solid ${color}55`,
        borderRadius: 3,
        padding: "1px 6px",
      }}
      data-testid="score-badge"
    >
      {score == null ? "—" : Math.round(score)}%
    </span>
  );
}
