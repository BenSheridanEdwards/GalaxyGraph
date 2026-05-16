import { api } from "encore.dev/api";

/**
 * Identity keeps customer access decisions in one trust boundary.
 * @summary Owns user sessions and actor references.
 * @why Downstream services need a stable actor instead of credentials.
 * @flow Request -> validation -> session token.
 */
export const createSession = api({ method: "POST", path: "/identity/session" }, async () => ({ ok: true }));
