import { describe, expect, it } from "vitest";
import { buildMutationData } from "../packages/adapters/src/stryker";

describe("Stryker adapter", () => {
  it("aggregates mutation score by service and endpoint", () => {
    const data = buildMutationData({ files: { "backend/systems/billing/billing.ts": { mutants: [{ status: "Killed" }, { status: "Survived", mutatorName: "BooleanLiteral", location: { start: { line: 7 } }, replacement: "false" }] } } }, { endpointsByFile: { "backend/systems/billing/billing.ts": [{ key: "billing:createInvoice", svc: "billing", fnName: "createInvoice" }] } });
    expect(data.aggregate).toMatchObject({ killed: 1, survived: 1, total: 2, score: 50 });
    expect(data.services.billing.score).toBe(50);
    expect(data.endpoints["billing:createInvoice"].survivors?.[0]).toMatchObject({ mutator: "BooleanLiteral", line: 7 });
  });
});
