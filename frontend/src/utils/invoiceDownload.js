// src/utils/invoiceDownload.js
import axios from "../api/axios";

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