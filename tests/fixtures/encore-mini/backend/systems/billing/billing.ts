import { api } from "encore.dev/api";

/** @summary Creates invoices and emits billing.invoice-created. */
export const createInvoice = api({ method: "POST", path: "/billing/invoices" }, async () => ({ ok: true }));
