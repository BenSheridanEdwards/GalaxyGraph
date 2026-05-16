import type { TestRef } from "./types";

interface Props {
  tests: TestRef[];
}

export default function TestList({ tests }: Props) {
  return (
    <section data-testid="test-list" style={{ marginTop: 12 }}>
      <div style={{ color: "#aab0c4", fontSize: 11, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 4 }}>
        Tests covering this ({tests.length})
      </div>
      {tests.length === 0 ? (
        <div style={{ color: "#ff8c33", fontSize: 12 }}>No tests cover this endpoint.</div>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: "none", maxHeight: 160, overflowY: "auto" }}>
          {tests.map((t) => (
            <li
              key={t.id}
              style={{
                display: "flex",
                gap: 8,
                alignItems: "baseline",
                padding: "3px 0",
                borderBottom: "1px dashed #1c2030",
                fontSize: 12,
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  letterSpacing: ".5px",
                  textTransform: "uppercase",
                  padding: "1px 5px",
                  borderRadius: 3,
                  background: t.http ? "#f8d77a22" : "#1c2030",
                  color: t.http ? "#f8d77a" : "#aab0c4",
                  border: `1px solid ${t.http ? "#f8d77a55" : "#333a4d"}`,
                  flex: "0 0 auto",
                }}
              >
                {t.http ? "http" : "unit"}
              </span>
              <span style={{ color: "#cfd3e2" }}>{t.name}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
