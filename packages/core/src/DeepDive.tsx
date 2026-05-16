// Click-only deep-dive explainer. Lives at the bottom of the InfoCard so
// new readers can find out what mutation testing is, what each badge category
// means, and how to act on the numbers.

const SECTION: React.CSSProperties = {
  marginTop: 6,
  paddingLeft: 0,
  fontSize: 11,
  color: "#aab0c4",
  lineHeight: 1.45,
};

const H: React.CSSProperties = {
  color: "#cfd3e2",
  fontSize: 11,
  letterSpacing: ".4px",
  textTransform: "uppercase",
  marginTop: 8,
  marginBottom: 2,
};

/** Headless content of the deep-dive — used when this is rendered inside an
 *  existing accordion (e.g. the "Quality" toggle on the redesigned cards), so
 *  we don't end up with a `<details>` inside a `<details>`. */
export function DeepDiveContent() {
  return (
    <div style={SECTION}>
      <div style={H}>Mutation testing in 30 seconds</div>
      Stryker rewrites your source one tiny change at a time — flipping
      <code style={{ color: "#cfd3e2" }}> &amp;&amp; </code>to
      <code style={{ color: "#cfd3e2" }}> || </code>, replacing a string with
      <code style={{ color: "#cfd3e2" }}> "" </code>, removing a
      <code style={{ color: "#cfd3e2" }}> ?. </code>— then runs your tests.
      If a test fails, the bug was <b style={{ color: "#28d97a" }}>caught</b>.
      If they all still pass, the bug <b style={{ color: "#ff7043" }}>survived</b> and your tests have a blind spot.

      <div style={H}>Score</div>
      <code style={{ color: "#cfd3e2" }}>caught / (caught + missed)</code>.
      Skipped mutants don't count either way.

      <div style={H}>Bands</div>
      <span style={{ color: "#28d97a" }}>80–100 Excellent</span>,{" "}
      <span style={{ color: "#f5a623" }}>60–80 Good</span>,{" "}
      <span style={{ color: "#ff7043" }}>40–60 Weak</span>,{" "}
      <span style={{ color: "#e63946" }}>0–40 Poor</span>.

      <div style={H}>Badge categories</div>
      <ul style={{ margin: "2px 0 0", paddingLeft: 14 }}>
        <li><span style={{ color: "#f5a623" }}>edge case</span> — a string, object or array got emptied. Add a test that asserts on the value, not just that the call ran.</li>
        <li><span style={{ color: "#9b6bff" }}>branch / logic</span> — a condition got flipped. Make sure each branch has its own test.</li>
        <li><span style={{ color: "#54c1ff" }}>comparison / arithmetic</span> — operator boundary. Test the boundary value and one on each side.</li>
        <li><span style={{ color: "#ff7043" }}>null handling / negation</span> — <code>?.</code> or <code>!</code> swapped. Add a test that exercises the null/undefined path.</li>
        <li><span style={{ color: "#7a8095" }}>method swap / control flow</span> — call site or block emptied. Assert on the side-effect or return value.</li>
      </ul>

      <div style={H}>How to fix a missed mutation</div>
      Open the file at the line shown, look at the <i>replacement</i> Stryker tried, and write a test that would fail under that replacement. If a test would still pass with that change, your assertions aren't tight enough.
    </div>
  );
}

export default function DeepDive() {
  return (
    <details data-testid="deep-dive" style={{ marginTop: 14, borderTop: "1px dashed #232838", paddingTop: 10 }}>
      <summary
        style={{
          cursor: "pointer",
          color: "#cfd3e2",
          fontSize: 12,
          letterSpacing: ".3px",
          fontWeight: 500,
        }}
      >
        What does all this mean?
      </summary>
      <DeepDiveContent />
    </details>
  );
}
