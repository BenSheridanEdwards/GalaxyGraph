import MutatorBadge from "./MutatorBadge";
import type { MutationStats } from "./types";

interface Props {
  mutation?: MutationStats;
}

export default function MissedMutations({ mutation }: Props) {
  if (!mutation) return null;

  if (mutation.survived === 0 && mutation.total > 0) {
    return (
      <div
        data-testid="missed-mutations-clean"
        style={{ marginTop: 12, color: "#28d97a", fontSize: 12, fontWeight: 500 }}
      >
        ✓ Every mutation was caught.
      </div>
    );
  }

  const survivors = mutation.survivors ?? [];
  if (survivors.length === 0) return null;

  return (
    <section data-testid="missed-mutations" style={{ marginTop: 12 }}>
      <div style={{ color: "#ff7043", fontSize: 11, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 4 }}>
        Missed mutations ({mutation.survived})
      </div>
      <div className="muted" style={{ fontSize: 10, marginBottom: 6 }}>
        Bugs Stryker injected that no test caught.
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", maxHeight: 180, overflowY: "auto" }}>
        {survivors.map((s, i) => (
          <li
            key={i}
            style={{
              padding: "4px 0",
              borderBottom: "1px dashed #1c2030",
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
    </section>
  );
}
