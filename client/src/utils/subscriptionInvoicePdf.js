/**
 * Opens a print window with subscription invoice HTML so user can save as PDF.
 */
export function openSubscriptionInvoicePdf(payload) {
  if (!payload) return;
  const {
    invoiceNumber,
    plan,
    status,
    startedAt,
    expiresAt,
    amountPaid,
    paymentProvider,
    createdAt,
    userName,
    userEmail,
  } = payload;

  const printWindow = window.open("", "_blank", "width=800,height=900");
  if (!printWindow) return;

  const esc = (v) => (v == null ? "" : String(v));
  const dateStr = (v) => (v ? new Date(v).toLocaleDateString(undefined, { dateStyle: "long" }) : "—");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice ${esc(invoiceNumber)} - KrishiMitra</title>
        <style>
          @page { margin: 14mm; }
          body {
            font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
            margin: 0;
            background: #fff;
            color: #111827;
            font-size: 14px;
          }
          .container { max-width: 640px; margin: 24px auto; padding: 0 16px; }
          .logo { font-size: 20px; font-weight: 700; color: #047857; margin-bottom: 24px; }
          h1 { font-size: 18px; margin: 0 0 20px 0; color: #111827; }
          .meta { color: #6b7280; font-size: 12px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
          th { color: #6b7280; font-weight: 600; font-size: 12px; text-transform: uppercase; }
          .amount { font-size: 18px; font-weight: 700; color: #047857; }
          .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">KrishiMitra</div>
          <h1>Subscription Invoice</h1>
          <div class="meta">
            Invoice #${esc(invoiceNumber)} &nbsp;|&nbsp; Date: ${dateStr(createdAt)}
          </div>
          <table>
            <tr><th>Plan</th><td>${esc(plan)}</td></tr>
            <tr><th>Status</th><td>${esc(status)}</td></tr>
            <tr><th>Period start</th><td>${dateStr(startedAt)}</td></tr>
            <tr><th>Period end</th><td>${dateStr(expiresAt)}</td></tr>
            <tr><th>Payment method</th><td>${esc(paymentProvider) || "—"}</td></tr>
            <tr><th>Amount paid</th><td class="amount">Rs. ${esc(amountPaid)}</td></tr>
          </table>
          ${userName || userEmail ? `
          <p style="margin-top:16px;color:#6b7280;font-size:12px;">
            Billed to: ${esc(userName)} ${userEmail ? `&lt;${esc(userEmail)}&gt;` : ""}
          </p>
          ` : ""}
          <div class="footer">
            Thank you for subscribing to KrishiMitra Premium. This is a computer-generated invoice.
          </div>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
