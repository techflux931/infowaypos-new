import React, { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { FaHome, FaTimes, FaPrint, FaSyncAlt, FaPlusCircle, FaMinusCircle } from "react-icons/fa";
import axios from "../../api/axios";
import "./ShiftReport.css";

/* ----------------- helpers ----------------- */

// Optional store info (fallbacks are safe)
const STORE_NAME = localStorage.getItem("store.name") || "Store Name";
const STORE_TRN  = localStorage.getItem("store.trn")  || "";

// create & print a standalone HTML in a hidden iframe
function printHTML(html) {
  const iframe = document.createElement("iframe");
  Object.assign(iframe.style, { position: "fixed", right: "0", bottom: "0", width: "0", height: "0", border: "0" });
  document.body.appendChild(iframe);
  const iw = iframe.contentWindow;
  const idoc = iw.document;
  idoc.open(); idoc.write(html); idoc.close();

  const doPrint = () => {
    try { iw.focus(); iw.print(); } finally { setTimeout(() => document.body.removeChild(iframe), 300); }
  };
  if (idoc.readyState === "complete") setTimeout(doPrint, 50);
  else {
    idoc.addEventListener("readystatechange", () => idoc.readyState === "complete" && doPrint());
    setTimeout(doPrint, 500);
  }
}

// thermal receipt CSS (58mm; change width to 80mm if needed)
const RECEIPT_CSS = `
@page{ margin:0 }
*{ box-sizing:border-box }
body{ margin:0; font:12px/1.35 "Courier New", ui-monospace, monospace; color:#000 }
.wrap{ width:58mm; padding:6px 6px 10px }
.center{ text-align:center }
.hr{ border-top:1px dashed #000; margin:6px 0 }
.hr2{ border-top:2px dashed #000; margin:6px 0 }
.kv{ display:flex; justify-content:space-between; gap:8px; margin:2px 0 }
.small{ font-size:11px }
.big{ font-size:14px; font-weight:700 }
footer{ margin-top:8px; text-align:center }
`;

// Build HTML from plain text lines array (server may return lines for ESC/POS)
function htmlFromLines(lines = [], title = "Report") {
  const esc = (s) => String(s ?? "").replace(/[&<>]/g, (m) => ({ "&":"&amp;","<":"&lt;",">":"&gt;" }[m]));
  const body = lines.map((l) => `<div>${esc(l)}</div>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8" />
  <title>${esc(title)}</title><style>${RECEIPT_CSS}</style></head>
  <body><div class="wrap"><div class="center big">${esc(title)}</div>
  <div class="hr"></div>${body}</div></body></html>`;
}

// Build a nice X/Z receipt from a data object
function htmlFromData(data = {}, type = "X") {
  const esc = (s) => String(s ?? "").replace(/[&<>]/g, (m) => ({ "&":"&amp;","<":"&lt;",">":"&gt;" }[m]));
  const fmt = (n) => (Number.isFinite(Number(n)) ? Number(n) : 0).toFixed(2);

  const shiftNo = data.shiftNo ?? data.shift ?? data.shift_id ?? "";
  const cashier = data.cashier ?? data.user ?? data.username ?? "";
  const opened  = data.openedAt ?? data.opened ?? data.open_time ?? data.openTime ?? "";
  const closed  = data.closedAt ?? data.closed ?? data.close_time ?? data.closeTime ?? "";
  const printedAt = new Date().toLocaleString();

  const bills   = data.bills ?? data.billCount ?? data.receipts ?? 0;
  const gross   = data.gross ?? data.grossTotal ?? 0;
  const disc    = data.discount ?? data.disc ?? 0;
  const vat     = data.vat ?? data.tax ?? 0;
  const net     = data.net ?? data.netTotal ?? 0;
  const cash    = data.cash ?? 0;
  const card    = data.card ?? 0;
  const credit  = data.credit ?? 0;
  const returns = data.returns ?? 0;
  const cashIn  = data.cashIn ?? data.cash_in ?? 0;
  const cashOut = data.cashOut ?? data.cash_out ?? 0;
  const drawer  = data.drawer ?? data.drawerTotal ?? data.closingCash ?? 0;

  return `<!doctype html>
<html><head><meta charset="utf-8" /><title>${esc(type)} Report</title><style>${RECEIPT_CSS}</style></head>
<body>
  <div class="wrap">
    <div class="center">
      <div class="big">${esc(STORE_NAME)}</div>
      ${STORE_TRN ? `<div class="small">TRN: ${esc(STORE_TRN)}</div>` : ""}
      <div class="hr"></div>
      <div class="big">${esc(type)} REPORT</div>
      <div class="small">Printed: ${esc(printedAt)}</div>
    </div>

    <div class="hr"></div>
    <div class="kv"><span>Shift #</span><span>${esc(shiftNo)}</span></div>
    <div class="kv"><span>Cashier</span><span>${esc(cashier)}</span></div>
    ${opened ? `<div class="kv"><span>Opened</span><span>${esc(opened)}</span></div>` : ""}
    ${closed ? `<div class="kv"><span>${type === "Z" ? "Closed" : "Now"}</span><span>${esc(closed)}</span></div>` : ""}

    <div class="hr2"></div>
    <div class="kv"><span>Bills</span><span>${esc(bills)}</span></div>
    <div class="kv"><span>Gross</span><span>${fmt(gross)}</span></div>
    ${Number(disc) ? `<div class="kv"><span>Discount</span><span>${fmt(disc)}</span></div>` : ""}
    <div class="kv"><span>VAT</span><span>${fmt(vat)}</span></div>
    <div class="kv"><span>Net</span><span>${fmt(net)}</span></div>

    <div class="hr"></div>
    <div class="kv"><span>Cash</span><span>${fmt(cash)}</span></div>
    <div class="kv"><span>Card</span><span>${fmt(card)}</span></div>
    <div class="kv"><span>Credit</span><span>${fmt(credit)}</span></div>
    <div class="kv"><span>Returns</span><span>${fmt(returns)}</span></div>

    <div class="hr"></div>
    <div class="kv"><span>Cash In</span><span>${fmt(cashIn)}</span></div>
    <div class="kv"><span>Cash Out</span><span>${fmt(cashOut)}</span></div>
    <div class="kv"><span>Drawer</span><span>${fmt(drawer)}</span></div>

    <footer><div class="hr"></div><div class="small">Thank you</div></footer>
  </div>
</body></html>`;
}

// Decide how to print based on server response
function printShiftResponse(resp, type) {
  if (resp && typeof resp.html === "string" && resp.html.trim()) {
    printHTML(resp.html); return;
  }
  if (resp && Array.isArray(resp.lines) && resp.lines.length) {
    printHTML(htmlFromLines(resp.lines, `${type} Report`)); return;
  }
  if (resp && typeof resp === "object") {
    printHTML(htmlFromData(resp, type)); return;
  }
  printHTML(htmlFromLines([`${type} Report`, new Date().toLocaleString()], `${type} Report`));
}

/* ---------- Small confirm dialog ---------- */
function ConfirmDialog({ title, message, onConfirm, onCancel, loading }) {
  return (
    <div className="shf-modal" role="dialog" aria-modal="true" aria-labelledby="shf-dialog-title">
      <div className="shf-modal-card">
        <h3 id="shf-dialog-title" className="shf-modal-title">{title}</h3>
        <p className="shf-modal-msg">{message}</p>
        <div className="shf-modal-actions">
          <button type="button" className="btn danger"  onClick={onCancel}  disabled={loading}>Cancel</button>
          <button type="button" className="btn primary" onClick={onConfirm} disabled={loading}>{loading ? "Working…" : "OK"}</button>
        </div>
      </div>
    </div>
  );
}
ConfirmDialog.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

/* ---------- Cash In/Out dialog ---------- */
function CashIODialog({ mode, onSubmit, onCancel, loading }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  return (
    <div className="shf-modal" role="dialog" aria-modal="true" aria-labelledby="shf-cashio-title">
      <div className="shf-modal-card">
        <h3 id="shf-cashio-title" className="shf-modal-title">{mode === "IN" ? "Cash In" : "Cash Out"}</h3>
        <div className="shf-form">
          <label>Amount</label>
          <input className="shf-input" type="number" inputMode="decimal" min="0" step="0.01"
                 value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" autoFocus />
          <label>Note</label>
          <input className="shf-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" />
        </div>
        <div className="shf-modal-actions">
          <button type="button" className="btn danger"  onClick={onCancel} disabled={loading}>Cancel</button>
          <button type="button" className="btn success" onClick={() => onSubmit({ amount: Number(amount || 0), note })}
                  disabled={loading || !amount}>{loading ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}
CashIODialog.propTypes = {
  mode: PropTypes.oneOf(["IN", "OUT"]).isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

/* ---------- Main component (ShiftReport) ---------- */
export default function ShiftReport({ onClose }) {
  const navigate = useNavigate();
  const safeClose = useCallback(() => (onClose ? onClose() : navigate("/reports")), [onClose, navigate]);

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const [confirm, setConfirm] = useState(null); // { type: 'X' | 'Z' }
  const [cashIO, setCashIO] = useState(null);   // { mode: 'IN' | 'OUT' }

  // auto-dismiss banners
  useEffect(() => {
    if (!error && !info) return;
    const id = setTimeout(() => { setError(""); setInfo(""); }, 3500);
    return () => clearTimeout(id);
  }, [error, info]);

  // keyboard shortcuts (still active even though badges are hidden)
  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") return safeClose();
      const key = String(e.key).toUpperCase();
      if (key === "F1") { e.preventDefault(); setConfirm({ type: "X"  }); }
      if (key === "F2") { e.preventDefault(); setConfirm({ type: "Z"  }); }
      if (key === "F3") { e.preventDefault(); setCashIO({ mode: "IN"  }); }
      if (key === "F4") { e.preventDefault(); setCashIO({ mode: "OUT" }); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [safeClose]);

  const friendly = (e, fallback) => e?.response?.data?.message || e?.message || fallback;

  // ---- PRINT runners (iframe printing; avoids blank page) ----
  const runX = async () => {
    setLoading(true); setError(""); setInfo("");
    try {
      const { data } = await axios.post("/shift/x-report", { preview: 1 });
      setInfo("X Report generated. Sending to printer…");
      printShiftResponse(data, "X");
    } catch (e) {
      console.error(e); setError(friendly(e, "Failed to generate X Report"));
    } finally {
      setLoading(false); setConfirm(null);
    }
  };

  const runZ = async () => {
    setLoading(true); setError(""); setInfo("");
    try {
      const { data } = await axios.post("/shift/z-report", { preview: 1 });
      setInfo("Z Report generated and shift closed. Sending to printer…");
      printShiftResponse(data, "Z");
    } catch (e) {
      console.error(e); setError(friendly(e, "Failed to generate Z Report"));
    } finally {
      setLoading(false); setConfirm(null);
    }
  };

  const saveCashIO = async ({ amount, note }) => {
    setLoading(true); setError(""); setInfo("");
    try {
      if (cashIO?.mode === "IN") { await axios.post("/shift/cash-in",  { amount, note }); setInfo("Cash In saved."); }
      else                       { await axios.post("/shift/cash-out", { amount, note }); setInfo("Cash Out saved."); }
      setCashIO(null);
    } catch (e) {
      console.error(e); setError(friendly(e, "Failed to save cash movement"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shf-wrap">
      {/* Header */}
      <div className="shf-header">
        <div className="shf-left">
          <button type="button" className="iconbtn" aria-label="Home" onClick={() => navigate("/dashboard")}><FaHome /></button>
          <h2 className="shf-title">Shift Report</h2>
        </div>
        <button type="button" className="iconbtn" aria-label="Close" onClick={safeClose}><FaTimes /></button>
      </div>

      {(error || info) && <div className={`shf-banner ${error ? "err" : "ok"}`}>{error || info}</div>}

      {/* Action cards (badges removed) */}
      <div className="shf-grid">
        <button type="button" className="shf-card" onClick={() => setConfirm({ type: "X" })}>
          <FaPrint className="shf-ico blue" />
          <div className="shf-card-text"><strong>X Report</strong></div>
        </button>

        <button type="button" className="shf-card" onClick={() => setConfirm({ type: "Z" })}>
          <FaSyncAlt className="shf-ico purple" />
          <div className="shf-card-text"><strong>Z Report</strong></div>
        </button>

        <button type="button" className="shf-card" onClick={() => setCashIO({ mode: "IN" })}>
          <FaPlusCircle className="shf-ico green" />
          <div className="shf-card-text"><strong>Cash In</strong></div>
        </button>

        <button type="button" className="shf-card" onClick={() => setCashIO({ mode: "OUT" })}>
          <FaMinusCircle className="shf-ico red" />
          <div className="shf-card-text"><strong>Cash Out</strong></div>
        </button>
      </div>

      {/* Modals */}
      {confirm && (
        <ConfirmDialog
          title={confirm.type === "X" ? "Print X Report" : "Print Z Report"}
          message={confirm.type === "Z" ? "This will close the shift and print the Z Report. Continue?" : "Print the X (interim) report now?"}
          onCancel={() => setConfirm(null)}
          onConfirm={confirm.type === "X" ? runX : runZ}
          loading={loading}
        />
      )}
      {cashIO && (
        <CashIODialog mode={cashIO.mode} onSubmit={saveCashIO} onCancel={() => setCashIO(null)} loading={loading} />
      )}
    </div>
  );
}

ShiftReport.propTypes = { onClose: PropTypes.func };
