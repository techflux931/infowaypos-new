// src/components/XReportConfirmModal.jsx
import React, { useState } from "react";
import PropTypes from "prop-types";
import api from "../api/axios";
import { printInIframe, buildThermalHtml } from "../utils/thermalPrint";

// Company details (wire from settings/API if needed)
const STORE = {
  name: "POS STORE",
  phone: "+971-55-123-4567",
  trn: "100123456700003",
  address: "",
};

const fmt = (n) =>
  Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function XReportConfirmModal({ open, onClose }) {
  const [busy, setBusy] = useState(false);
  if (!open) return null;

  const errorText = (err) => {
    if (err?.response) {
      const d = err.response.data;
      return `HTTP ${err.response.status}: ${d?.message || d?.error || JSON.stringify(d)}`;
    }
    if (err?.request) return "No response from server (backend down/CORS/URL).";
    return err?.message || "Unexpected error";
  };

  // --- API ---
  const fetchXReport = async () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const { data } = await api.get("/reports/dayz", { params: { from: todayStr, to: todayStr } });

    return {
      todayStr,
      payload: {
        type: "X",
        store: STORE,
        meta: {
          printDate: new Date().toLocaleString(),
          saleDate: todayStr,
          txnCount: data?.count ?? data?.totals?.bills ?? 0,
          counter: 1,
        },
        sales: {
          itemTotal: data?.totals?.gross ?? data?.totals?.grossTotal ?? 0,
          salesReturn: data?.totals?.returns ?? 0,
          vat: data?.totals?.vat ?? data?.totals?.tax ?? 0,
          items: data?.totals?.items ?? data?.totals?.qty ?? data?.items ?? 0,
          net: data?.totals?.net ?? data?.totals?.netTotal ?? 0,
        },
        payments: {
          cash: data?.payments?.cash ?? 0,
          card: data?.payments?.card ?? 0,
          credit: data?.payments?.credit ?? 0,
          other: data?.payments?.other ?? 0,
        },
      },
    };
  };

  // --- Ticket HTML (used for print + HTML fallback) ---
  const buildReceiptHtml = (p) => {
    const css = `
      <style>
        @page { size: 80mm auto; margin: 6mm; }
        body { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace; }
        .center { text-align:center }
        .row { display:flex; justify-content:space-between; margin:2px 0 }
        .hr { border-top:1px dashed #000; margin:6px 0 }
        small { opacity:.8 }
      </style>
    `;
    const totalPay =
      (p.payments.cash || 0) +
      (p.payments.card || 0) +
      (p.payments.credit || 0) +
      (p.payments.other || 0);

    return `
      ${css}
      <div class="center"><b>${p.store.name}</b></div>
      ${p.store.phone ? `<div class="center"><small>Phone: ${p.store.phone}</small></div>` : ""}
      ${p.store.trn ? `<div class="center"><small>TRN: ${p.store.trn}</small></div>` : ""}
      <div class="center"><small>POS X REPORT</small></div>

      <div class="hr"></div>
      <div class="row"><div>Date</div><div>${p.meta.saleDate}</div></div>
      <div class="row"><div>Printed</div><div>${p.meta.printDate}</div></div>
      <div class="row"><div>Transactions</div><div>${p.meta.txnCount}</div></div>

      <div class="hr"></div>
      <div class="row"><div>Gross</div><div>AED ${fmt(p.sales.itemTotal)}</div></div>
      <div class="row"><div>Returns</div><div>AED ${fmt(p.sales.salesReturn)}</div></div>
      <div class="row"><div>VAT</div><div>AED ${fmt(p.sales.vat)}</div></div>
      <div class="row"><div>Items (qty)</div><div>${p.sales.items}</div></div>
      <div class="row"><div><b>Net</b></div><div><b>AED ${fmt(p.sales.net)}</b></div></div>

      <div class="hr"></div>
      <div class="row"><div>Cash</div><div>AED ${fmt(p.payments.cash)}</div></div>
      <div class="row"><div>Card</div><div>AED ${fmt(p.payments.card)}</div></div>
      <div class="row"><div>Credit</div><div>AED ${fmt(p.payments.credit)}</div></div>
      <div class="row"><div>Other</div><div>AED ${fmt(p.payments.other)}</div></div>
      <div class="row"><div><b>Total Pay</b></div><div><b>AED ${fmt(totalPay)}</b></div></div>

      <div class="hr"></div>
      <div class="center"><small>Counter ${p.meta.counter}</small></div>
    `;
  };

  // --- Helpers ---
  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    try { a.remove(); } catch {}
    URL.revokeObjectURL(url);
  };

  const savePdf = async (isoDate) => {
    const res = await api.get("/reports/x/pdf", {
      params: { date: isoDate },
      responseType: "blob",
      headers: { Accept: "application/pdf" },
    });
    downloadBlob(res.data, `XReport-${isoDate}.pdf`);
  };

  const saveHtmlFallback = (payload, isoDate) => {
    const body = buildReceiptHtml(payload);
    const html = buildThermalHtml("X Report", body);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    downloadBlob(blob, `XReport-${isoDate}.html`);
  };

  // --- Actions ---
  const handleAction = async (action) => {
    try {
      setBusy(true);
      const { todayStr, payload } = await fetchXReport();

      if (action === "print") {
        const body = buildReceiptHtml(payload);
        const html = buildThermalHtml("X Report", body);
        printInIframe(html, "X Report"); // robust cleanup handled in utils
        onClose?.();
        return;
      }

      if (action === "save") {
        try {
          await savePdf(todayStr);
        } catch {
          // server PDF not available → save HTML fallback
          saveHtmlFallback(payload, todayStr);
        }
        onClose?.();
      }
    } catch (e) {
      alert(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  // --- UI ---
  return (
    <div className="xreport-modal-backdrop">
      <div className="xreport-modal" role="dialog" aria-modal="true" aria-labelledby="x-title">
        <div className="xreport-header">
          <span id="x-title">POS</span>
          <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="xreport-body">
          <h3 className="title">PRINT X REPORT?</h3>
        </div>

        <div className="confirm-actions">
          <button disabled={busy} onClick={() => handleAction("print")} className="btn btn-green">🖨 Print</button>
          <button disabled={busy} onClick={() => handleAction("save")}  className="btn btn-blue">💾 Save</button>
          <button disabled={busy} onClick={onClose} className="btn btn-red">Cancel</button>
        </div>
      </div>

      {/* Inline styles are OK. You can move them to a CSS file if you prefer. */}
      <style>{`
        .xreport-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:9999}
        .xreport-modal{width:380px;background:#111;color:#fff;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.4)}
        .xreport-header{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#1f2937;font-weight:700;letter-spacing:.5px}
        .xreport-body{padding:18px;text-align:center}
        .title{margin:0;font-size:18px}
        .confirm-actions{display:flex;gap:10px;padding:12px 14px 16px;justify-content:center}
        .btn{border:none;padding:10px 14px;border-radius:8px;font-weight:700;cursor:pointer}
        .btn-green{background:#16a34a;color:#fff}
        .btn-blue{background:#2563eb;color:#fff}
        .btn-red{background:#ef4444;color:#fff}
        .btn:disabled{opacity:.6;cursor:default}
        .close-btn{background:transparent;border:none;color:#fff;font-size:18px;cursor:pointer}
      `}</style>
    </div>
  );
}

XReportConfirmModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
};
