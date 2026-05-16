interface Row {
  label: string;
  color: string;
  desc: string;
}

const ROWS: Row[] = [
  { label: "Caught", color: "#28d97a",
    desc: "A bug was injected and a test failed — tests did their job." },
  { label: "Missed", color: "#ff7043",
    desc: "A bug was injected but no test failed — your tests can't tell." },
  { label: "Skipped", color: "#7a8095",
    desc: "Mutated route config, not real logic — doesn't count toward the score." },
];

export default function StatusGuide() {
  return (
    <details data-testid="status-guide" style={{ marginTop: 10 }}>
      <summary style={{ cursor: "pointer", color: "#b0b6c9", fontSize: 11, letterSpacing: ".4px" }}>
        How to read this
      </summary>
      <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
        {ROWS.map((r) => (
          <div key={r.label} style={{ display: "flex", gap: 8, alignItems: "baseline", fontSize: 11 }}>
            <span style={{ color: r.color, fontWeight: 600, minWidth: 56 }}>{r.label}</span>
            <span style={{ color: "#aab0c4" }}>{r.desc}</span>
          </div>
        ))}
        <div style={{ color: "#7a8095", fontSize: 10, marginTop: 4, letterSpacing: ".3px" }}>
          score = caught / (caught + missed)
        </div>
      </div>
    </details>
  );
}
