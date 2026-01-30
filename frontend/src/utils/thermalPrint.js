// src/utils/thermalPrint.js
import axios from "../api/axios";

/** Build the final printable HTML (80mm thermal) */
export function buildThermalHtml(title, bodyHtml) {
  const css = `
    <style>
      @page { size: 80mm auto; margin: 4mm; }
      html, body { margin: 0; padding: 0; }
      body {
        width: 72mm;
        font: 12px/1.35 "Consolas","Courier New",monospace;
        color: #000;
      }
      .center { text-align: center; }
      .right { text-align: right; }
      .row { display: flex; justify-content: space-between; }
      .hr { border-top: 1px dashed #000; margin: 6px 0; }
      h1 {
        font-size: 14px;
        margin: 0 0 6px;
        text-transform: uppercase;
      }
      .small { font-size: 11px; }
      table { width: 100%; border-collapse: collapse; }
      td { padding: 2px 0; vertical-align: top; }
      .totals td { padding: 3px 0; }
      .muted { opacity: .9; }
      .pad { padding: 2px 0; }
      .section { margin: 6px 0; }
      @media print { .no-print { display: none; } }
    </style>`;

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title ?? "Report"}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    ${css}
  </head>
  <body>${bodyHtml || ""}</body>
</html>`;
}

/** Render the X/Z body from a normalized payload */
export function renderXZBody({
  type,
  store = {},
  meta = {},
  sales = {},
  pay = {},
  tax = {},
  cashout = {},
  groups = [],
}) {
  const f = (v) =>
    (v ?? 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const header = `
    <div class="center">
      <div><strong>${store.name || "POS STORE"}</strong></div>
      ${store.address ? `<div class="small muted">${store.address}</div>` : ""}
      ${store.vat ? `<div class="small muted">TRN: ${store.vat}</div>` : ""}
    </div>
    <div class="hr"></div>
    <div class="center"><h1>${type} Report</h1></div>
    <div class="small">
      <div class="row">
        <span>Print Date</span>
        <span>${meta.printDate || new Date().toLocaleString()}</span>
      </div>
      ${
        meta.saleDate
          ? `<div class="row"><span>Sale Date</span><span>${meta.saleDate}</span></div>`
          : ""
      }
      ${
        meta.txnCount != null
          ? `<div class="row"><span>No. of Transactions</span><span>${meta.txnCount}</span></div>`
          : ""
      }
      ${
        meta.counter != null
          ? `<div class="row"><span>Counter</span><span>${meta.counter}</span></div>`
          : ""
      }
    </div>
    <div class="hr"></div>`;

  const block = (titleText, rows) =>
    `<div class="section"><strong>${titleText}</strong></div>
     <table>${rows.join("")}</table>
     <div class="hr"></div>`;

  const salesRows = [];
  if (sales.itemTotal != null)
    salesRows.push(
      `<tr><td>Item Total</td><td class="right">${f(sales.itemTotal)}</td></tr>`
    );
  if (sales.salesReturn != null)
    salesRows.push(
      `<tr><td>Sales Return</td><td class="right">${f(
        sales.salesReturn
      )}</td></tr>`
    );
  if (sales.discount != null)
    salesRows.push(
      `<tr><td>Discount</td><td class="right">${f(sales.discount)}</td></tr>`
    );
  if (sales.salesTotal != null)
    salesRows.push(
      `<tr><td>Sales Total</td><td class="right">${f(
        sales.salesTotal
      )}</td></tr>`
    );
  if (sales.totalTax != null)
    salesRows.push(
      `<tr><td>Total Tax</td><td class="right">${f(sales.totalTax)}</td></tr>`
    );
  if (sales.subTotal != null)
    salesRows.push(
      `<tr><td>Sub Total</td><td class="right">${f(sales.subTotal)}</td></tr>`
    );
  if (sales.creditSales != null)
    salesRows.push(
      `<tr><td>Credit Sales</td><td class="right">${f(
        sales.creditSales
      )}</td></tr>`
    );
  if (sales.netTotal != null)
    salesRows.push(
      `<tr><td><strong>Net Total</strong></td><td class="right"><strong>${f(
        sales.netTotal
      )}</strong></td></tr>`
    );

  const payRows = [];
  if (pay.cash != null)
    payRows.push(
      `<tr><td>Cash</td><td class="right">${f(pay.cash)}</td></tr>`
    );
  if (pay.card != null)
    payRows.push(
      `<tr><td>Card</td><td class="right">${f(pay.card)}</td></tr>`
    );
  if (pay.total != null)
    payRows.push(
      `<tr class="totals"><td><strong>Total</strong></td><td class="right"><strong>${f(
        pay.total
      )}</strong></td></tr>`
    );

  const taxRows = [];
  if (tax.taxable != null)
    taxRows.push(
      `<tr><td>Taxable</td><td class="right">${f(tax.taxable)}</td></tr>`
    );
  if (tax.rate != null)
    taxRows.push(
      `<tr><td>Tax%</td><td class="right">${f(tax.rate)}</td></tr>`
    );
  if (tax.tax != null)
    taxRows.push(
      `<tr><td>Tax</td><td class="right">${f(tax.tax)}</td></tr>`
    );
  if (tax.net != null)
    taxRows.push(
      `<tr><td>Net</td><td class="right">${f(tax.net)}</td></tr>`
    );

  const cashRows = [];
  if (cashout.opening != null)
    cashRows.push(
      `<tr><td>Opening Balance</td><td class="right">${f(
        cashout.opening
      )}</td></tr>`
    );
  if (cashout.cashSales != null)
    cashRows.push(
      `<tr><td>Cash Sales</td><td class="right">${f(
        cashout.cashSales
      )}</td></tr>`
    );
  if (cashout.total != null)
    cashRows.push(
      `<tr class="totals"><td><strong>Total Cash Out</strong></td><td class="right"><strong>${f(
        cashout.total
      )}</strong></td></tr>`
    );

  const groupRows = (Array.isArray(groups) ? groups : []).map(
    (g) =>
      `<tr>
         <td>${g.name ?? "Group"}</td>
         <td class="right">${g.count ?? 0}</td>
         <td class="right">${f(g.total ?? 0)}</td>
       </tr>`
  );

  return [
    header,
    salesRows.length ? block("Sales Value", salesRows) : "",
    payRows.length ? block("Payments Value", payRows) : "",
    taxRows.length ? block("Tax Details", taxRows) : "",
    cashRows.length ? block("Cash Out", cashRows) : "",
    groupRows.length
      ? `<div class="section"><strong>Group Wise</strong></div>
         <table>
           <tr>
             <td><em>Group</em></td>
             <td class="right"><em>Count</em></td>
             <td class="right"><em>Total</em></td>
           </tr>
           ${groupRows.join("")}
         </table>`
      : "",
    `<div class="center pad small muted">— End of Report —</div>`,
  ].join("");
}

/** Print in a popup window (with safe close) */
export function openPrintWindow(htmlOrBody, title = "Report") {
  let finalHtml = String(htmlOrBody || "");
  const isHtml = /<\s*html[\s>]/i.test(finalHtml);
  if (!isHtml) finalHtml = buildThermalHtml(title, finalHtml);

  const w = window.open(
    "",
    "_blank",
    "noopener,noreferrer,width=420,height=600"
  );
  if (!w) {
    // eslint-disable-next-line no-alert
    alert("Popup blocked. Allow popups for this site.");
    return;
  }

  w.document.open();
  w.document.write(finalHtml);
  w.document.close();

  const safeClose = () => {
    try {
      w.close();
    } catch {
      // ignore
    }
  };

  const doPrint = () => {
    try {
      w.focus();
      w.print();
    } catch {
      // ignore
    }
  };

  const after = () => {
    setTimeout(safeClose, 0);
  };

  try {
    w.addEventListener("afterprint", after);
  } catch {
    // ignore
  }

  w.onload = () => setTimeout(doPrint, 80);
  setTimeout(doPrint, 500); // fallback if onload not fired
  setTimeout(safeClose, 4000); // final fallback
}

/** Print using a hidden iframe (no popup) — robust one-shot cleanup */
export function printInIframe(htmlOrBody, title = "Report") {
  let finalHtml = String(htmlOrBody || "");
  const isHtml = /<\s*html[\s>]/i.test(finalHtml);
  if (!isHtml) finalHtml = buildThermalHtml(title, finalHtml);

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const done = { v: false };
  const cleanup = () => {
    if (done.v) return;
    done.v = true;
    try {
      iframe.remove();
    } catch {
      // ignore
    }
  };

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(finalHtml);
  doc.close();

  iframe.onload = () => {
    const w = iframe.contentWindow;

    const handleAfterPrint = () => {
      setTimeout(cleanup, 0);
      try {
        w.removeEventListener("afterprint", handleAfterPrint);
      } catch {
        // ignore
      }
    };

    try {
      w.addEventListener("afterprint", handleAfterPrint);
    } catch {
      // ignore
    }

    setTimeout(() => {
      try {
        w.focus();
        w.print();
      } catch {
        // ignore
      }
    }, 60);

    // fallback if afterprint doesn't fire
    setTimeout(cleanup, 4000);
  };

  // last-resort fallback if onload never fires
  setTimeout(cleanup, 8000);
}

/** Download an .html file from given html/body string (safe removal) */
export function downloadHtml(htmlOrBody, filename = "Report.html", title = "Report") {
  let finalHtml = String(htmlOrBody || "");
  const isHtml = /<\s*html[\s>]/i.test(finalHtml);
  if (!isHtml) finalHtml = buildThermalHtml(title, finalHtml);

  const blob = new Blob([finalHtml], { type: "text/html;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  try {
    a.remove();
  } catch {
    // ignore
  }
  window.URL.revokeObjectURL(url);
}

/**
 * Download invoice PDF from backend.
 * type = "a4" or "thermal"
 */
export async function downloadInvoicePdf(invoiceId, type = "thermal") {
  if (!invoiceId) {
    // eslint-disable-next-line no-alert
    alert("Invoice ID not available yet.");
    return;
  }

  try {
    const url = `/invoices/${type}/${invoiceId}`;

    const res = await axios.get(url, {
      responseType: "blob",
    });

    const blob = new Blob([res.data], { type: "application/pdf" });
    const downloadUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `invoice-${type}-${invoiceId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (err) {
    console.error("❌ Failed to download invoice PDF:", err);
    // eslint-disable-next-line no-alert
    alert("Unable to download E-Invoice. Please try again.");
  }
}
