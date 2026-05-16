// Hover tooltip for cross-service contract bonds. The shape mirrors
// nodeTooltip.ts (same shell + footer styling) so hover transitions between
// node and link feel consistent. ContractInfo.tsx renders the click-through.

import { displayName, escapeHtml, COLORS, CONTRACT_TOPIC_COLOR } from "./helpers";
import type { ContractDef } from "./types";

const SHELL_OPEN =
  `<div style="background:#0e1220;border:1px solid #333a4d;padding:12px 14px;` +
  `border-radius:8px;color:#eee;font:12px system-ui;max-width:380px">`;
const SHELL_CLOSE = `</div>`;

const FOOTER = (text: string) =>
  `<div style="color:#7a8095;margin-top:10px;font-size:10px;letter-spacing:.4px;` +
  `border-top:1px dashed #232838;padding-top:6px">${text}</div>`;

const KIND_PILL = (kind: string, color = "#7a8095") =>
  `<span style="display:inline-block;font-size:9px;letter-spacing:.6px;text-transform:uppercase;` +
  `padding:1px 6px;border-radius:3px;color:${color};background:${color}1f;` +
  `border:1px solid ${color}55;font-weight:600">${kind}</span>`;

const TOP = 5;

function testList(c: ContractDef): string {
  const visible = c.tests.slice(0, TOP);
  const more = c.tests.length - visible.length;
  const items = visible
    .map(
      (t) =>
        `<li style="margin:2px 0;color:#cfd3e2">✓ ${escapeHtml(t.name)}</li>`
    )
    .join("");
  return `
    <div style="color:#8b90a3;margin-top:8px;font-size:11px;letter-spacing:.4px">
      TESTS (${c.tests.length})
    </div>
    <ul style="margin:3px 0 0;padding-left:14px">
      ${items || '<li style="color:#ff8c33">none</li>'}
    </ul>
    ${more > 0 ? `<div style="color:#7a8095;font-size:10px;margin-top:2px">+${more} more</div>` : ""}`;
}

export function contractLinkTooltip(c: ContractDef): string {
  const producerColor = COLORS[c.producer] ?? "#7a8095";
  const consumerColor = COLORS[c.consumer] ?? "#7a8095";
  const modePill = c.mode === "event-bus"
    ? KIND_PILL("event-bus", CONTRACT_TOPIC_COLOR)
    : KIND_PILL("direct-call", "#f8d77a");

  const callsLine = c.mode === "direct-call" && c.consumerFns.length
    ? `<div style="color:#8b90a3;margin-top:4px;font-size:11px">
         calls: <code style="color:#aab0c4">${c.consumerFns.slice(0, 3).map(escapeHtml).join(", ")}</code>
       </div>`
    : "";

  const topicLine = c.mode === "event-bus" && c.topic
    ? `<div style="color:#8b90a3;margin-top:4px;font-size:11px">
         topic: <code style="color:${CONTRACT_TOPIC_COLOR}">${escapeHtml(c.topic)}</code>
       </div>`
    : "";

  return (
    SHELL_OPEN +
    `<div style="display:flex;align-items:baseline;gap:8px;margin-bottom:4px">
       ${KIND_PILL("contract")} ${modePill}
     </div>
     <div style="font-weight:700;font-size:14px;letter-spacing:.2px">
       <span style="color:${producerColor}">${escapeHtml(displayName(c.producer))}</span>
       <span style="color:#8b90a3"> → </span>
       <span style="color:${consumerColor}">${escapeHtml(displayName(c.consumer))}</span>
     </div>
     ${c.describe ? `<div style="color:#cfd3e2;margin-top:2px;font-size:11px">${escapeHtml(c.describe)}</div>` : ""}
     ${topicLine}
     ${callsLine}
     ${testList(c)}
     ${FOOTER("Click for full contract breakdown")}` +
    SHELL_CLOSE
  );
}

export function topicNodeTooltip(topic: string, contracts: ContractDef[]): string {
  const producers = Array.from(new Set(contracts.map((c) => c.producer)));
  const consumers = Array.from(new Set(contracts.map((c) => c.consumer)));
  const totalTests = contracts.reduce((sum, c) => sum + c.tests.length, 0);

  const pcRow = (label: string, svcs: string[]) =>
    `<div style="margin-top:4px;font-size:11px;color:#8b90a3">
       ${label}:
       ${svcs
         .map(
           (s) =>
             `<span style="color:${COLORS[s] ?? "#7a8095"};margin-left:4px">${escapeHtml(displayName(s))}</span>`
         )
         .join(" ")}
     </div>`;

  return (
    SHELL_OPEN +
    `<div style="display:flex;align-items:baseline;gap:8px;margin-bottom:4px">
       ${KIND_PILL("topic", CONTRACT_TOPIC_COLOR)}
     </div>
     <div style="font-weight:700;font-size:14px;letter-spacing:.2px;color:${CONTRACT_TOPIC_COLOR}">
       ${escapeHtml(topic)}
     </div>
     ${pcRow("publisher" + (producers.length > 1 ? "s" : ""), producers)}
     ${pcRow("subscriber" + (consumers.length > 1 ? "s" : ""), consumers)}
     <div style="color:#8b90a3;margin-top:6px;font-size:11px">
       ${contracts.length} contract${contracts.length === 1 ? "" : "s"} · ${totalTests} tests
     </div>
     ${FOOTER("Click for the full subscriber list")}` +
    SHELL_CLOSE
  );
}
