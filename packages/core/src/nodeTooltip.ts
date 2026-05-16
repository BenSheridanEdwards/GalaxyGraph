// Hover-tier tooltip: a medium-info card. The full deep-dive lives in InfoCard
// and is shown on click — we deliberately keep this slimmer so the user has a
// reason to click through. Three builders, one dispatcher.

import { mutColor, mutLabel, escapeHtml, mutatorCategory, displayName, COLORS } from "./helpers";
import { ENDPOINTS, TESTS } from "./data";
import { MUTATION } from "./mutation-data";
import { contractLinkTooltip, topicNodeTooltip } from "./linkTooltip";
import type { GraphNode } from "./types";

const SHELL_OPEN =
  `<div style="background:#0e1220;border:1px solid #333a4d;padding:12px 14px;` +
  `border-radius:8px;color:#eee;font:12px system-ui;max-width:380px">`;
const SHELL_CLOSE = `</div>`;

const FOOTER = (text: string) =>
  `<div style="color:#7a8095;margin-top:10px;font-size:10px;letter-spacing:.4px;` +
  `border-top:1px dashed #232838;padding-top:6px">${text}</div>`;

const SCORE_BLOCK = (score: number | null, c: string, status: string, lowConfidence: boolean) => `
  <div style="display:flex;align-items:baseline;gap:10px;margin:6px 0 4px">
    <span style="font:700 28px/1 -apple-system, system-ui;color:${c};letter-spacing:-0.5px">
      ${score == null ? "—" : Math.round(score)}<span style="font-size:14px;color:#8b90a3;font-weight:500">%</span>
    </span>
    <span style="color:${c};font-weight:600;font-size:11px;letter-spacing:.7px;text-transform:uppercase">${status}</span>
    ${lowConfidence ? '<span style="color:#8b90a3;font-size:10px;letter-spacing:.4px">⚠ few mutants</span>' : ""}
  </div>`;

const BREAKDOWN = (m: { killed: number; survived: number; ignored?: number } | null) =>
  m
    ? `<div style="font-size:11px;margin-bottom:4px">
         <span style="color:#28d97a">${m.killed} caught</span>
         <span style="color:#5c6370"> · </span>
         <span style="color:${m.survived ? "#ff7043" : "#7a8095"}">${m.survived} missed</span>
         <span style="color:#5c6370"> · </span>
         <span style="color:#7a8095">${m.ignored ?? 0} skipped</span>
       </div>`
    : `<div style="font-size:11px;color:#8b90a3">no mutation data</div>`;

const KIND_PILL = (kind: string, color = "#7a8095") =>
  `<span style="display:inline-block;font-size:9px;letter-spacing:.6px;text-transform:uppercase;` +
  `padding:1px 6px;border-radius:3px;color:${color};background:${color}1f;` +
  `border:1px solid ${color}55;font-weight:600">${kind}</span>`;

const MUTATOR_BADGE = (mutator: string) => {
  const cat = mutatorCategory(mutator);
  return `<span style="display:inline-block;font-size:9px;letter-spacing:.5px;text-transform:uppercase;` +
    `padding:0 5px;border-radius:3px;color:${cat.color};background:${cat.color}1f;` +
    `border:1px solid ${cat.color}55;margin-right:5px;font-weight:600">${escapeHtml(cat.label)}</span>`;
};

export function endpointTooltip(n: GraphNode): string {
  const m = n.mutation;
  const score = m ? m.score : null;
  const c = mutColor(score);
  const status = mutLabel(score);
  const lowConfidence = !!m && m.total < 5;
  const tests = n.tests ?? [];
  const survivors = m?.survivors ?? [];

  // Trim to top 3 of each — the click-card has the full list.
  const TOP = 3;
  const visibleTests = tests.slice(0, TOP);
  const moreTests = tests.length - visibleTests.length;
  const visibleSurvivors = survivors.slice(0, TOP);
  const moreSurvivors = survivors.length - visibleSurvivors.length;

  const testItems = visibleTests
    .map(
      (t) =>
        `<li style="margin:2px 0;color:${t.http ? "#f8d77a" : "#cfd3e2"}">
           ${t.http ? "· http" : "· unit"} — ${escapeHtml(t.name)}
         </li>`
    )
    .join("");

  const survivorItems = visibleSurvivors
    .map(
      (s) =>
        `<li style="margin:2px 0;color:#ffb499">
           <code style="color:#8b90a3">L${s.line}</code>
           ${MUTATOR_BADGE(s.mutator)}${escapeHtml(s.mutator)}
           <span style="color:#8b90a3"> → </span>
           <code>${escapeHtml(s.replacement)}</code>
         </li>`
    )
    .join("");

  const survivorsBlock = survivorItems
    ? `<div style="color:#ff7043;margin-top:10px;font-size:11px;letter-spacing:.4px">
         MISSED MUTATIONS (${m!.survived})
       </div>
       <ul style="margin:3px 0 0;padding-left:14px">${survivorItems}</ul>
       ${moreSurvivors > 0 ? `<div style="color:#7a8095;font-size:10px;margin-top:2px">+${moreSurvivors} more</div>` : ""}`
    : m && m.survived === 0 && m.total > 0
      ? '<div style="color:#28d97a;margin-top:10px;font-size:11px">✓ every mutation caught</div>'
      : "";

  return (
    SHELL_OPEN +
    `<div style="display:flex;align-items:baseline;gap:8px;margin-bottom:2px">
       ${KIND_PILL("endpoint")}
       <span style="color:${COLORS[n.svc] ?? "#7a8095"};font-size:10px">${escapeHtml(displayName(n.svc))}</span>
     </div>
     <div style="font-weight:700;font-size:15px;letter-spacing:.2px">${escapeHtml(n.name)}</div>
     <div style="color:#8b90a3;margin:1px 0 6px;font-size:11px">
       <code style="color:#aab0c4">${escapeHtml(n.fnName ?? "")}</code> · ${escapeHtml(n.method ?? "")} <code>${escapeHtml(n.path ?? "")}</code>${n.internal ? " · internal" : ""}
     </div>
     ${SCORE_BLOCK(score, c, status, lowConfidence)}
     ${BREAKDOWN(m ?? null)}
     <div style="color:#8b90a3;margin-top:6px;font-size:11px;letter-spacing:.4px">TESTS (${tests.length})</div>
     <ul style="margin:3px 0 0;padding-left:14px">
       ${testItems || '<li style="color:#ff8c33">none</li>'}
     </ul>
     ${moreTests > 0 ? `<div style="color:#7a8095;font-size:10px;margin-top:2px">+${moreTests} more</div>` : ""}
     ${survivorsBlock}
     ${FOOTER("Click for full breakdown and explanations")}` +
    SHELL_CLOSE
  );
}

export function serviceTooltip(n: GraphNode): string {
  const m = n.mutation;
  const score = m ? m.score : null;
  const c = mutColor(score);
  const status = mutLabel(score);
  const lowConfidence = !!m && m.total < 5;

  const eps = ENDPOINTS.filter((e) => e.svc === n.svc);
  const epRows = eps
    .map((ep) => {
      const em = MUTATION.endpoints[ep.id.replace("ep:", "")];
      const ec = mutColor(em?.score);
      return `<li style="display:flex;align-items:center;gap:8px;margin:3px 0;font-size:11px">
        <span style="display:inline-block;min-width:36px;text-align:center;
                     color:${ec};background:${ec}1f;border:1px solid ${ec}55;
                     border-radius:3px;padding:1px 0;font-weight:600;
                     font-variant-numeric:tabular-nums">
          ${em ? Math.round(em.score) + "%" : "—"}
        </span>
        <span style="color:#cfd3e2">${escapeHtml(ep.noun)}</span>
        <span style="color:#7a8095;font-size:10px">${escapeHtml(ep.method)} ${escapeHtml(ep.path)}</span>
      </li>`;
    })
    .join("");

  return (
    SHELL_OPEN +
    `<div style="display:flex;align-items:baseline;gap:8px;margin-bottom:2px">
       ${KIND_PILL("service", COLORS[n.svc] ?? "#7a8095")}
     </div>
     <div style="font-weight:700;font-size:16px;letter-spacing:.2px">${escapeHtml(displayName(n.svc))}</div>
     <div style="color:#8b90a3;margin:1px 0 4px;font-size:11px">
       <code>${escapeHtml(n.file ?? "")}</code>
     </div>
     ${SCORE_BLOCK(score, c, status, lowConfidence)}
     ${BREAKDOWN(m ?? null)}
     <div style="color:#8b90a3;margin-top:6px;font-size:11px;letter-spacing:.4px">ENDPOINTS (${eps.length})</div>
     <ul style="margin:3px 0 0;padding:0;list-style:none">${epRows}</ul>
     ${FOOTER("Click for the survivor list grouped by endpoint")}` +
    SHELL_CLOSE
  );
}

export function testTooltip(n: GraphNode): string {
  const t = TESTS.find((x) => x.id === n.id);
  const epCount = t?.endpoints.length ?? 0;
  const epPreview = (t?.endpoints ?? [])
    .slice(0, 3)
    .map((fn) => {
      const ep = ENDPOINTS.find((e) => e.id === "ep:" + fn);
      return ep ? `<li style="margin:2px 0;color:#cfd3e2">· ${escapeHtml(ep.noun)} <span style="color:#7a8095">${escapeHtml(ep.method)} ${escapeHtml(ep.path)}</span></li>` : "";
    })
    .join("");
  const moreEps = epCount - Math.min(3, epCount);
  const kindLabel = n.http ? "http test" : "unit test";
  const kindColor = n.http ? "#f8d77a" : "#aab0c4";

  return (
    SHELL_OPEN +
    `<div style="display:flex;align-items:baseline;gap:8px;margin-bottom:2px">
       ${KIND_PILL(kindLabel, kindColor)}
       <span style="color:${COLORS[n.svc] ?? "#7a8095"};font-size:10px">${escapeHtml(displayName(n.svc))}</span>
     </div>
     <div style="font-weight:600;font-size:14px;line-height:1.25;letter-spacing:.1px">${escapeHtml(n.name)}</div>
     <div style="color:#8b90a3;margin-top:6px;font-size:11px;letter-spacing:.4px">COVERS (${epCount})</div>
     <ul style="margin:3px 0 0;padding-left:14px">
       ${epPreview || '<li style="color:#ff8c33">none</li>'}
     </ul>
     ${moreEps > 0 ? `<div style="color:#7a8095;font-size:10px;margin-top:2px">+${moreEps} more</div>` : ""}
     ${FOOTER("Click to see every endpoint this test exercises")}` +
    SHELL_CLOSE
  );
}

export function nodeTooltip(n: GraphNode): string {
  if (n.kind === "service") return serviceTooltip(n);
  if (n.kind === "endpoint") return endpointTooltip(n);
  if (n.kind === "topic") return topicNodeTooltip(n.topic ?? n.name, n.contracts ?? []);
  if (n.kind === "bond" && n.contract) return contractLinkTooltip(n.contract);
  return testTooltip(n);
}
