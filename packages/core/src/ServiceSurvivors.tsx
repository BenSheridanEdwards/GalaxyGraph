import { ENDPOINTS } from "./data";
import { MUTATION } from "./mutation-data";
import MutatorBadge from "./MutatorBadge";
import type { ServiceKey } from "./types";

interface Props {
  svc: ServiceKey;
}

export default function ServiceSurvivors({ svc }: Props) {
  const groups = ENDPOINTS
    .filter((e) => e.svc === svc)
    .map((ep) => {
      const m = MUTATION.endpoints[ep.id.replace("ep:", "")];
      return { noun: ep.noun, fn: ep.fnName, survivors: m?.survivors ?? [] };
    })
    .filter((g) => g.survivors.length > 0);

  const total = groups.reduce((n, g) => n + g.survivors.length, 0);
  if (total === 0) {
    return (
      <div
        data-testid="service-survivors-clean"
        style={{ marginTop: 14, color: "#28d97a", fontSize: 12, fontWeight: 500 }}
      >
        ✓ Every mutation in this service was caught.
      </div>
    );
  }

  return (
    <section data-testid="service-survivors" style={{ marginTop: 14 }}>
      <div style={{ color: "#ff7043", fontSize: 11, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 4 }}>
        Missed mutations ({total})
      </div>
      <div className="muted" style={{ fontSize: 10, marginBottom: 6 }}>
        Bugs Stryker injected that no test caught, grouped by endpoint.
      </div>
      <div style={{ maxHeight: 220, overflowY: "auto" }}>
        {groups.map((g) => (
          <div key={g.fn} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
              <code style={{ color: "#ffb499", fontSize: 11 }}>{g.fn}</code>
              <span style={{ color: "#7a8095", fontSize: 10 }}>· {g.survivors.length} missed</span>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {g.survivors.map((s, i) => (
                <li
                  key={i}
                  style={{
                    padding: "3px 0 3px 8px",
                    borderLeft: "2px solid #1c2030",
                    fontSize: 12,
                  }}
                >
                  <code style={{ color: "#8b90a3", marginRight: 6 }}>L{s.line}</code>
                  <MutatorBadge mutator={s.mutator} />
                  <span style={{ color: "#ffb499" }}>{s.mutator}</span>
                  <span style={{ color: "#5c6370" }}> → </span>
                  <code style={{ color: "#cfd3e2", fontSize: 11 }}>{s.replacement}</code>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
