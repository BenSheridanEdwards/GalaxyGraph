import type { MutationStats } from "./types";

interface Props {
  mutation?: MutationStats;
}

const CELL: React.CSSProperties = {
  flex: "1 1 0",
  background: "#0e1220",
  border: "1px solid #232838",
  borderRadius: 6,
  padding: "8px 10px",
};

export default function StatBreakdown({ mutation }: Props) {
  if (!mutation) {
    return <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>no mutation data</div>;
  }
  const skipped = mutation.ignored ?? 0;

  return (
    <div data-testid="stat-breakdown" style={{ display: "flex", gap: 6, marginTop: 10 }}>
      <div style={CELL} title="Bugs Stryker injected that your tests caught.">
        <div style={{ color: "#28d97a", fontWeight: 700, fontSize: 18, lineHeight: 1 }}>{mutation.killed}</div>
        <div style={{ color: "#7a8095", fontSize: 10, letterSpacing: ".5px", textTransform: "uppercase", marginTop: 2 }}>caught</div>
      </div>
      <div style={CELL} title="Bugs Stryker injected that no test caught — gaps in your assertions.">
        <div style={{ color: mutation.survived ? "#ff7043" : "#7a8095", fontWeight: 700, fontSize: 18, lineHeight: 1 }}>{mutation.survived}</div>
        <div style={{ color: "#7a8095", fontSize: 10, letterSpacing: ".5px", textTransform: "uppercase", marginTop: 2 }}>missed</div>
      </div>
      <div style={CELL} title="Mutated route config, not real logic — doesn't count toward the score.">
        <div style={{ color: "#7a8095", fontWeight: 700, fontSize: 18, lineHeight: 1 }}>{skipped}</div>
        <div style={{ color: "#7a8095", fontSize: 10, letterSpacing: ".5px", textTransform: "uppercase", marginTop: 2 }}>skipped</div>
      </div>
    </div>
  );
}
