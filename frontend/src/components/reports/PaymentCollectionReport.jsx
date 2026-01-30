// src/components/reports/PaymentCollectionReport.jsx
import React, { useCallback, useMemo, useState } from "react";
import { FaHome, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import "./PaymentCollectionReport.css";

/* =========================
   Flags & Utilities
   ========================= */

// Turn API on when your backend route is live.
// In CRA: add REACT_APP_API_ENABLED=1 to .env and restart dev server.
const API_ENABLED = String(process.env.REACT_APP_API_ENABLED || "0") === "1";

const PAYMENTS_URL = "/reports/payments"; // axios baseURL should already include /api

const AED = new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED" });
const money = (v) => AED.format(Number(v || 0));

/** Format a date-like value to local YYYY-MM-DD without TZ drift. */
const toYMD = (d) => {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d || Date.now());
  const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

/** Escape minimal HTML for print. */
const esc = (s) => String(s ?? "").replace(/[&<>]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[m]));

/** Cell value renderer shared by UI, export, print. */
const getCellValue = (row, col) => {
  let v = row?.[col.key];
  if (col.money) v = money(v);
  if (col.key === "date" && v) v = toYMD(v);
  return v ?? "-";
};

const isCanceled = (e) => e?.name === "CanceledError" || e?.code === "ERR_CANCELED";

/* =========================
   Print Helpers
   ========================= */

function printHTML(html) {
  const iframe = document.createElement("iframe");
  Object.assign(iframe.style, { position: "fixed", right: 0, bottom: 0, width: 0, height: 0, border: 0 });
  document.body.appendChild(iframe);
  const idoc = iframe.contentDocument || iframe.contentWindow.document;
  idoc.open(); idoc.write(html); idoc.close();

  const doPrint = () => {
    try { (iframe.contentWindow || iframe).focus(); (iframe.contentWindow || iframe).print(); }
    finally { setTimeout(() => document.body.removeChild(iframe), 300); }
  };

  if (idoc.readyState === "complete") setTimeout(doPrint, 50);
  else {
    idoc.addEventListener("readystatechange", () => idoc.readyState === "complete" && doPrint());
    setTimeout(doPrint, 500);
  }
}

function buildPrintHTML({ store, filters, cols, rows, totals }) {
  const thead = `<tr>${cols.map(c => `<th style="text-align:${c.align || "left"}">${esc(c.label)}</th>`).join("")}</tr>`;
  const tbody = rows.length
    ? rows.map(r => {
        const cells = cols.map(c => `<td style="text-align:${c.align || "left"}">${esc(getCellValue(r, c))}</td>`).join("");
        return `<tr>${cells}</tr>`;
      }).join("")
    : `<tr><td colspan="${cols.length}" style="text-align:center;padding:8px">No data for selected filters</td></tr>`;
  const printedAt = new Date().toLocaleString();

  return `<!doctype html><html><head><meta charset="utf-8"/>
<title>Payment / Collection</title>
<style>
@page{margin:12mm}
*{box-sizing:border-box}
body{font-family:Arial,Helvetica,sans-serif;color:#000}
h1{margin:0 0 6px;font-size:18px;text-align:center}
.meta{font-size:12px;margin:0 0 10px;text-align:center}
.headerline{border-top:1px solid #000;margin:6px 0 12px}
table{width:100%;border-collapse:collapse;font-size:12px}
th,td{border:1px solid #000;padding:4px 6px}
.summary{margin-top:10px;display:grid;grid-template-columns:repeat(2,1fr);gap:6px}
.box{border:1px solid #000;padding:6px;font-size:12px}
.box b{display:inline-block;min-width:72px}
.page-footer{position:fixed;bottom:6mm;left:0;right:0;font-size:11px;text-align:center}
.page-footer:after{content:"Page " counter(page) " of " counter(pages)}
</style>
</head><body>
<div>
  <div style="text-align:center">
    <div style="font-weight:800;font-size:16px">${esc(store.name || "Store Name")}</div>
    ${store.trn ? `<div style="font-size:12px">TRN: ${esc(store.trn)}</div>` : ""}
  </div>
  <div class="headerline"></div>
  <h1>Payment / Collection</h1>
  <div class="meta">
    Period: ${esc(filters.from)} to ${esc(filters.to)}
    ${filters.customer ? `&nbsp;|&nbsp; Customer: ${esc(filters.customer)}` : ""}
    ${filters.mode ? `&nbsp;|&nbsp; Mode: ${esc(filters.mode)}` : ""}
    &nbsp;|&nbsp; Printed: ${esc(printedAt)}
  </div>
  <table><thead>${thead}</thead><tbody>${tbody}</tbody></table>
  <div class="summary">
    <div class="box"><b>Total:</b> ${esc(money(totals.amount))}</div>
    <div class="box"><b>Receipts:</b> ${esc(totals.count ?? rows.length)}</div>
  </div>
</div>
<div class="page-footer"></div>
</body></html>`;
}

/* =========================
   Component
   ========================= */

export default function PaymentCollectionReport() {
  const navigate = useNavigate();
  const today = useMemo(() => toYMD(new Date()), []);

  const [filters, setFilters] = useState({
    from: today, to: today, customer: "", mode: "", page: 0, size: 20,
  });
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({});
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Read once from localStorage (no probing endpoints → quiet console)
  const store = useMemo(() => ({
    name: localStorage.getItem("store.name") || "Store Name",
    trn:  localStorage.getItem("store.trn")  || "",
  }), []);

  const cols = useMemo(() => ([
    { key: "date",      label: "DATE" },
    { key: "receiptNo", label: "RECEIPT" },
    { key: "customer",  label: "CUSTOMER" },
    { key: "mode",      label: "MODE", align: "center" },
    { key: "ref",       label: "REF" },
    { key: "amount",    label: "AMOUNT", align: "right", money: true },
    { key: "receivedBy",label: "RECEIVED BY" },
  ]), []);

  const setField = (k, v) =>
    setFilters((f) => ({ ...f, [k]: v, page: ["from","to","customer","mode","size"].includes(k) ? 0 : f.page }));

  /** Fetch payments on demand (Run button). */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    // Dev-safe mode: skip API call entirely to avoid a failing XHR and the last console error.
    if (!API_ENABLED) {
      setRows([]); setTotals({}); setCount(0);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    try {
      const { data } = await axios.get(PAYMENTS_URL, { params: { ...filters }, signal: controller.signal });
      const items = data?.items ?? data ?? [];
      setRows(items);
      setTotals(data?.totals ?? {});
      setCount(Number(data?.count ?? items.length));
    } catch (e) {
      if (isCanceled(e)) return;
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message || "";
      // Treat 404 & “No static resource …” as empty results (quiet UI)
      if (status === 404 || /no static resource/i.test(msg)) {
        setRows([]); setTotals({}); setCount(0);
      } else {
        setError(msg || "Server error");
      }
    } finally {
      setLoading(false);
    }

    return () => controller.abort("payments-fetch-cancelled");
  }, [filters]);

  /** Export current rows as XLSX. */
  const exportExcel = useCallback(async () => {
    try {
      const mod = await import("xlsx");
      const XLSX = mod?.default ?? mod;
      const sheet = (rows ?? []).map((r) =>
        Object.fromEntries(cols.map((c) => {
          const v = getCellValue(r, c);
          return [c.label, v === "-" ? "" : v];
        }))
      );
      const ws = XLSX.utils.json_to_sheet(sheet);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Payments");
      XLSX.writeFile(wb, `Payments_${filters.from}_${filters.to}.xlsx`);
    } catch (err) {
      setError(`Export failed: ${err?.message || "Unknown error"}`);
    }
  }, [rows, cols, filters.from, filters.to]);

  /** Print current view. */
  const handlePrint = useCallback(() => {
    printHTML(buildPrintHTML({ store, filters, cols, rows, totals }));
  }, [store, filters, cols, rows, totals]);

  /* ---------- UI ---------- */
  return (
    <div className="rpt-wrap">
      <div className="rpt-header">
        <div className="left">
          <button className="iconbtn" onClick={() => navigate("/dashboard")} aria-label="Home"><FaHome /></button>
          <h2>Payment / Collection</h2>
        </div>
        <button className="iconbtn" onClick={() => navigate("/reports")} aria-label="Close"><FaTimes /></button>
      </div>

      {error && <div className="rpt-error" role="alert">{error}</div>}

      <div className="rpt-toolbar">
        <div className="field">
          <label htmlFor="from">From</label>
          <input id="from" type="date" value={filters.from} onChange={(e) => setField("from", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="to">To</label>
          <input id="to" type="date" value={filters.to} onChange={(e) => setField("to", e.target.value)} />
        </div>
        <div className="field grow">
          <label htmlFor="customer">Customer</label>
          <input
            id="customer"
            value={filters.customer}
            onChange={(e) => setField("customer", e.target.value)}
            placeholder="Name / Code / Phone"
          />
        </div>
        <div className="field">
          <label htmlFor="mode">Mode</label>
          <select id="mode" value={filters.mode} onChange={(e) => setField("mode", e.target.value)}>
            <option value="">All</option>
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="BANK">Bank</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="rows">Rows</label>
          <select id="rows" value={filters.size} onChange={(e) => setField("size", Number(e.target.value))}>
            {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}/page</option>)}
          </select>
        </div>
        <div className="actions">
          <button className="act run" onClick={fetchData} disabled={loading}>{loading ? "Running…" : "Run"}</button>
          <button className="act export" onClick={exportExcel} disabled={loading}>Export</button>
          <button className="act print" onClick={handlePrint} disabled={loading}>Print</button>
        </div>
      </div>

      <div className="rpt-card">
        {loading ? (
          <div className="rpt-loading">Loading…</div>
        ) : (
          <div className="rpt-tablewrap">
            <table className="rpt-table">
              <thead>
                <tr>
                  {cols.map((c) => (
                    <th key={c.key} scope="col" style={{ textAlign: c.align || "left" }}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td className="rpt-empty" colSpan={cols.length}>No data for selected filters</td>
                  </tr>
                )}
                {rows.map((r) => {
                  const key = r.id || r._id || r.receiptNo || `${r.date}-${r.customer}-${r.amount}`;
                  return (
                    <tr key={key}>
                      {cols.map((c) => (
                        <td key={c.key} style={{ textAlign: c.align || "left" }}>{getCellValue(r, c)}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rpt-summary">
        <div className="box">
          <div className="k">Total</div>
          <div className="v">{money(totals.amount)}</div>
        </div>
        <div className="box">
          <div className="k">Receipts</div>
          <div className="v">{totals.count ?? rows.length}</div>
        </div>
      </div>

      <div className="rpt-pager">
        <button onClick={() => setField("page", Math.max(0, filters.page - 1))} disabled={filters.page === 0}>Prev</button>
        <span>Page {filters.page + 1}</span>
        <button
          onClick={() => setField("page", filters.page + 1)}
          disabled={(filters.page + 1) * filters.size >= count}
        >
          Next
        </button>
      </div>
    </div>
  );
}
