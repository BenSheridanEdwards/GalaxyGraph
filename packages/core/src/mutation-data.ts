import type { MutationData } from "./types";

export const SAMPLE_MUTATION: MutationData = {
  aggregate: { killed: 27, survived: 1, total: 28, score: 96.43 },
  services: {
    identity: { killed: 10, survived: 0, ignored: 1, total: 10, score: 100 },
    billing: { killed: 11, survived: 1, ignored: 0, total: 12, score: 91.67, survivors: [{ mutator: "ConditionalExpression", line: 42, replacement: "false" }] },
    notifications: { killed: 6, survived: 0, ignored: 0, total: 6, score: 100 },
  },
  endpoints: {
    "identity:createSession": { svc: "identity", fnName: "createSession", killed: 10, survived: 0, total: 10, score: 100 },
    "billing:createInvoice": { svc: "billing", fnName: "createInvoice", killed: 11, survived: 1, total: 12, score: 91.67, survivors: [{ mutator: "ConditionalExpression", line: 42, replacement: "false" }] },
    "notifications:sendReceipt": { svc: "notifications", fnName: "sendReceipt", killed: 6, survived: 0, total: 6, score: 100 },
  },
};

export let MUTATION: MutationData = SAMPLE_MUTATION;

export function setGalaxyGraphMutation(next: MutationData): void {
  MUTATION = next;
}
