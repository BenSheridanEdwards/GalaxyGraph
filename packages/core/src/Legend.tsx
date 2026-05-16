import { CATEGORY_META } from "./helpers";

export interface Filters {
  showSvc: boolean;
  showEp: boolean;
  showTest: boolean;
  showHttp: boolean;
  showCross: boolean;
}

interface Props {
  filters: Filters;
  onChange: (next: Filters) => void;
  /** When true, hide the reference rows (score bands / services / edges) and
   *  show only the filter checkboxes. Used while a node is focused so the
   *  InfoCard has room to breathe. */
  compact?: boolean;
}

export default function Legend({ filters, onChange, compact = false }: Props) {
  const toggle = (key: keyof Filters) => onChange({ ...filters, [key]: !filters[key] });

  return (
    <div id="legend" className="panel" style={{ top: 16, right: 16, minWidth: 220 }}>
      {!compact && (
        <>
          <h2 style={{ marginTop: 0 }}>Mutation Score</h2>
          <div className="row"><span className="swatch" style={{ background: "#28d97a" }} />80–100% · Excellent</div>
          <div className="row"><span className="swatch" style={{ background: "#f5a623" }} />60–80% · Good</div>
          <div className="row"><span className="swatch" style={{ background: "#ff7043" }} />40–60% · Weak</div>
          <div className="row"><span className="swatch" style={{ background: "#e63946" }} />0–40% · Poor</div>
          <hr />
          <h2>Service Categories</h2>
          <div className="row"><span className="swatch" style={{ background: CATEGORY_META.core.color }} />{CATEGORY_META.core.label}</div>
          <div className="row"><span className="swatch" style={{ background: CATEGORY_META.feature.color }} />{CATEGORY_META.feature.label}</div>
          <div className="row"><span className="swatch" style={{ background: CATEGORY_META.adapter.color }} />{CATEGORY_META.adapter.label}</div>
          <hr />
          <h2>Edges</h2>
          <div className="row"><span className="swatch" style={{ background: "#fff", width: 14, height: 2, borderRadius: 0 }} />service → endpoint</div>
          <div className="row"><span className="swatch" style={{ background: "#f8d77a", width: 14, height: 2, borderRadius: 0 }} />test → endpoint (cross-service)</div>
          <div className="row"><span className="swatch" style={{ background: "#fff", width: 14, height: 2, borderRadius: 0, opacity: 0.6 }} />service dependency</div>
          <hr />
        </>
      )}
      {compact && (
        <h2 style={{ marginTop: 0 }}>Filters</h2>
      )}
      <label><input type="checkbox" checked={filters.showSvc}   onChange={() => toggle("showSvc")} /> Services</label>
      <label><input type="checkbox" checked={filters.showEp}    onChange={() => toggle("showEp")} /> Endpoints</label>
      <label><input type="checkbox" checked={filters.showTest}  onChange={() => toggle("showTest")} /> Tests</label>
      <label><input type="checkbox" checked={filters.showHttp}  onChange={() => toggle("showHttp")} /> HTTP contract tests</label>
      <label><input type="checkbox" checked={filters.showCross} onChange={() => toggle("showCross")} /> Cross-service edges</label>
    </div>
  );
}
