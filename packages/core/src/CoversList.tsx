import { TESTS, ENDPOINTS } from "./data";
import { MUTATION } from "./mutation-data";
import { mutColor } from "./helpers";

interface Props {
  testId: string;
}

export default function CoversList({ testId }: Props) {
  const t = TESTS.find((x) => x.id === testId);
  if (!t) return null;

  const eps = t.endpoints
    .map((fn) => ENDPOINTS.find((e) => e.id === "ep:" + fn))
    .filter((e): e is NonNullable<typeof e> => Boolean(e));

  if (eps.length === 0) return null;

  return (
    <section data-testid="covers-list" style={{ marginTop: 14 }}>
      <div style={{ color: "#aab0c4", fontSize: 11, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 6 }}>
        Covers ({eps.length})
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {eps.map((ep) => {
          const m = MUTATION.endpoints[ep.id.replace("ep:", "")];
          const c = mutColor(m?.score);
          return (
            <li
              key={ep.id}
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                padding: "4px 0",
                borderBottom: "1px dashed #1c2030",
                fontSize: 12,
              }}
            >
              <span
                style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: c, flex: "0 0 auto",
                }}
              />
              <span style={{ color: "#cfd3e2", flex: "1 1 auto" }}>{ep.noun}</span>
              <span style={{ color: "#7a8095", fontSize: 10 }}>
                {ep.method} {ep.path}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
