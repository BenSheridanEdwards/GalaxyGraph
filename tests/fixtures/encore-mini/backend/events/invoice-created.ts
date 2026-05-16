import { Topic } from "encore.dev/pubsub";

/**
 * @summary Published when billing has made a durable invoice.
 * @why Notifications should react without billing owning delivery.
 */
export const invoiceCreated = new Topic<{ invoiceId: string }>("billing.invoice-created", { deliveryGuarantee: "at-least-once" });
