import { api } from "encore.dev/api";

/** @summary Sends customer messages. */
export const sendReceipt = api({ method: "POST", path: "/notifications/receipt", expose: false }, async () => ({ ok: true }));
