import { ENDPOINTS } from "./data";
import { MUTATION } from "./mutation-data";
import { mutColor } from "./helpers";
import type { ServiceKey } from "./types";

interface Props {
  svc: ServiceKey;
}

export default function EndpointBreakdown({ svc }: Props) {
  const eps = ENDPOINTS.filter((e) => e.svc === svc);
  if (eps.length === 0) return null;

  return (
    <section data-testid="endpoint-breakdown" style={{ marginTop: 14 }}>
      <div style={{ color: "#aab0c4", fontSize: 11, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 6 }}>
        Endpoints ({eps.length})
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {eps.map((ep) => {
          const m = MUTATION.endpoints[ep.id.replace("ep:", "")];
          const score = m?.score;
          const c = mutColor(score);
          return (
            <li
              key={ep.id}
              style={{
                display: "grid",
                gridTemplateColumns: "44px 1fr auto",
                gap: 8,
                alignItems: "center",
                padding: "6px 0",
                borderBottom: "1px dashed #1c2030",
              }}
            >
              <span
                style={{
                  textAlign: "center",
                  fontVariantNumeric: "tabular-nums",
                  fontWeight: 600,
                  fontSize: 12,
                  color: c,
                  background: c + "1f",
                  border: `1px solid ${c}66`,
                  borderRadius: 4,
                  padding: "2px 0",
                }}
              >
                {score == null ? "—" : `${Math.round(score)}%`}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: "#e6e9f5", fontSize: 12, fontWeight: 500 }}>{ep.noun}</div>
                <div style={{ color: "#7a8095", fontSize: 10, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <span style={{ color: "#aab0c4", fontWeight: 600 }}>{ep.method}</span> {ep.path}
                  {ep.internal ? <span style={{ color: "#7a8095" }}> · internal</span> : null}
                </div>
              </div>
              <span style={{ color: "#7a8095", fontSize: 10, fontVariantNumeric: "tabular-nums" }}>
                {m ? `${m.survived}/${m.total}` : "—"}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="muted" style={{ fontSize: 10, marginTop: 4 }}>
        right column: missed / total mutations
      </div>
    </section>
  );
}
