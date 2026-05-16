import type { ContractDef, EndpointDef, ServiceDef, ServiceKey, TestDef, TopicDef } from "./types";

export interface GalaxyGraphCatalog {
  services: ServiceDef[];
  endpoints: EndpointDef[];
  tests: TestDef[];
  contracts: ContractDef[];
  topics: TopicDef[];
  colors?: Record<ServiceKey, string>;
}

export const SAMPLE_CATALOG: GalaxyGraphCatalog = {
  services: [
    {
      id: "svc:identity",
      svc: "identity",
      file: "services/identity.ts",
      narrative: {
        summary: "Owns user identity and access intent.",
        why: "A backend graph needs a clear trust boundary around identity-sensitive flows.",
        flow: "1. A client requests a session.\n2. Identity validates the caller.\n3. Downstream services receive a stable actor reference.",
      },
    },
    { id: "svc:billing", svc: "billing", file: "services/billing.ts", narrative: { summary: "Turns product actions into billable account records.", why: "Payment and entitlement logic should be visible as an architectural dependency." } },
    { id: "svc:notifications", svc: "notifications", file: "services/notifications.ts", narrative: { summary: "Delivers user-facing messages emitted by other services." } },
  ],
  endpoints: [
    { id: "ep:identity:createSession", fnName: "createSession", noun: "Create Session", svc: "identity", method: "POST", path: "/identity/session", narrative: { summary: "Issues a session after validating user credentials." } },
    { id: "ep:billing:createInvoice", fnName: "createInvoice", noun: "Create Invoice", svc: "billing", method: "POST", path: "/billing/invoices", narrative: { summary: "Creates the account invoice and publishes a lifecycle event." } },
    { id: "ep:notifications:sendReceipt", fnName: "sendReceipt", noun: "Send Receipt", svc: "notifications", method: "POST", path: "/notifications/receipt", internal: true, narrative: { summary: "Sends the receipt after billing completes." } },
  ],
  tests: [
    { id: "t:identity-1", svc: "identity", name: "creates a session for a valid user", http: true, endpoints: ["identity:createSession"], story: "Locks the public session contract so identity remains safe to call from clients.", category: "contract" },
    { id: "t:billing-1", svc: "billing", name: "publishes invoice-created after invoice creation", endpoints: ["billing:createInvoice"], story: "Pins the event that downstream services depend on.", category: "event" },
    { id: "t:notifications-1", svc: "notifications", name: "sends a receipt exactly once", endpoints: ["notifications:sendReceipt"], story: "Guards against duplicate customer messages.", category: "resilience" },
  ],
  contracts: [
    { id: "contract:invoice-receipt", file: "contracts/invoice-receipt.contract.test.ts", describe: "billing invoice event produces a customer receipt", producer: "billing", consumer: "notifications", mode: "event-bus", topic: "billing.invoice-created", narrative: { summary: "Billing publishes invoice completion; Notifications turns it into customer communication.", why: "The customer receipt is a visible product promise, but billing should not own delivery channels.", flow: "1. Billing creates an invoice.\n2. Billing publishes invoice-created.\n3. Notifications consumes it and sends the receipt." }, producerFns: ["createInvoice"], consumerFns: ["sendReceipt"], tests: [{ name: "routes invoice-created to receipt delivery", category: "contract" }], signals: { idempotent: true, auditLogged: false } },
  ],
  topics: [{ topic: "billing.invoice-created", file: "events/invoice-created.ts", narrative: { summary: "Emitted when billing has created a stable invoice record." } }],
  colors: { identity: "#54c1ff", billing: "#ff7b54", notifications: "#28d97a" },
};

let catalog: GalaxyGraphCatalog = SAMPLE_CATALOG;
export let SERVICES = catalog.services;
export let ENDPOINTS = catalog.endpoints;
export let TESTS = catalog.tests;
export let CONTRACTS = catalog.contracts;
export let TOPICS = catalog.topics;
export let SERVICE_COLORS = catalog.colors ?? {};

export function setGalaxyGraphCatalog(next: GalaxyGraphCatalog): void {
  catalog = next;
  SERVICES = next.services;
  ENDPOINTS = next.endpoints;
  TESTS = next.tests;
  CONTRACTS = next.contracts;
  TOPICS = next.topics;
  SERVICE_COLORS = next.colors ?? {};
}

export function getGalaxyGraphCatalog(): GalaxyGraphCatalog {
  return catalog;
}
