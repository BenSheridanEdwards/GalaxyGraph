/**
 * @summary Billing completion should lead to exactly one receipt.
 * @why Customer communication is cross-service, but billing should stay payment-focused.
 * @flow Billing publishes invoice-created; Notifications consumes and sends receipt.
 */
export const invoiceReceiptContract = {
  id: "contract:invoice-receipt",
  describe: "billing invoice event produces a customer receipt",
  producer: "billing",
  consumer: "notifications",
  mode: "event-bus",
  topic: "billing.invoice-created",
  producerFns: ["createInvoice"],
  consumerFns: ["sendReceipt"],
  idempotent: true,
  auditLogged: false,
};
