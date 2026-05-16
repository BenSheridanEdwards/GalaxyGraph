import { describe, expect, it } from "vitest";
import { generateEncoreDataset, parseEncoreContracts, parseEncoreContractTests, parseEncoreEndpoints, parseEncoreTopics } from "../packages/adapters/src/encore";

const fixture = new URL("./fixtures/encore-mini", import.meta.url).pathname;

describe("Encore adapter", () => {
  it("discovers services, endpoints, topics, contracts, tests, and mutation data", async () => {
    const dataset = await generateEncoreDataset(fixture);
    expect(dataset.services.map((s) => s.svc).sort()).toEqual(["billing", "identity", "notifications"]);
    expect(parseEncoreEndpoints(fixture).map((e) => `${e.svc}:${e.fnName}`)).toEqual(expect.arrayContaining(["identity:createSession", "billing:createInvoice", "notifications:sendReceipt"]));
    expect(parseEncoreTopics(fixture)[0]).toMatchObject({ topic: "billing.invoice-created" });
    expect(parseEncoreContracts(fixture)[0]).toMatchObject({ id: "contract:invoice-receipt", producer: "billing", consumer: "notifications", mode: "event-bus" });
    expect(parseEncoreContractTests(fixture)[0]).toMatchObject({ category: "contract", endpoints: ["billing:createInvoice", "notifications:sendReceipt"] });
    expect(dataset.mutation.aggregate).toMatchObject({ killed: 2, survived: 1, total: 3, score: 66.67 });
  });
});
