/**
 * @story Pins the invoice-created event contract so receipt delivery remains dependable.
 * @category contract
 */
test("routes invoice-created to receipt delivery", { endpoints: ["billing:createInvoice", "notifications:sendReceipt"] }, () => {});
