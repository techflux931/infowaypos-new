// src/components/reports/VatReport.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FaHome, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import "./VatReport.css";

/* =========================
   Utilities
   ========================= */

/** AED formatter */
const AED = new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED" });
const money = (v) => AED.format(Number(v || 0));

/** Date -> YYYY-MM-DD (local) */
const toYMD = (d) => {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d || Date.now());
  const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const isCanceled = (e) => e?.name === "CanceledError" || e?.code === "ERR_CANCELED";

/** Return first non-empty value from provided keys */
const pick = (obj, ...keys) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return "";
};

/* =========================
   Printing helpers
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

/** Build print HTML (invoice/customer columns are wider and wrap) */
function buildPrintHTML({ title, store, filters, cols, rows, totals }) {
  const esc = (s) => String(s ?? "").replace(/[&<>]/g, (m) => ({ "&":"&amp;","<":"&lt;",">":"&gt;" }[m]));
  const printedAt = new Date().toLocaleString();
  const groupLabel = filters.groupBy === "INVOICE" ? "Invoice" : "Day";

  const widthsInvoice = ["16%","22%","28%","12%","10%","12%"]; // DATE, INVOICE, CUSTOMER, TAXABLE, VAT, TOTAL
  const widthsDay     = ["22%","12%","26%","20%","20%"];       // DATE, BILLS, TAXABLE, VAT, TOTAL
  const colWidths = (filters.groupBy === "INVOICE" ? widthsInvoice : widthsDay).slice(0, cols.length);

  const colgroup = `<colgroup>${colWidths.map(w => `<col style="width:${w}">`).join("")}</colgroup>`;
  const thead = `<tr>${cols.map(c => `<th style="text-align:${c.align || "left"}">${esc(c.label)}</th>`).join("")}</tr>`;

  const tbody = rows.length
    ? rows.map(r => {
        const tds = cols.map(c => {
          let v = r[c.key];
          if (c.money) v = money(v);
          if (c.key === "date" && v) v = toYMD(v);
          if (v == null || v === "") v = "-";
          return `<td style="text-align:${c.align || "left"}">${esc(v)}</td>`;
        }).join("");
        return `<tr>${tds}</tr>`;
      }).join("")
    : `<tr><td colspan="${cols.length}" style="text-align:center;padding:8px">No data for selected filters</td></tr>`;

  return `<!doctype html><html><head><meta charset="utf-8"/>
<title>${esc(title)}</title>
<style>
@page{margin:12mm}
*{box-sizing:border-box}
body{font-family:Arial,Helvetica,sans-serif;color:#000}
h1{margin:0 0 6px;font-size:18px;text-align:center}
.meta{font-size:12px;margin:0 0 10px;text-align:center}
.headerline{border-top:1px solid #000;margin:6px 0 12px}
table{width:100%;border-collapse:collapse;font-size:12px;table-layout:fixed}
th,td{border:1px solid #000;padding:4px 6px;vertical-align:top;white-space:normal;overflow-wrap:anywhere;word-break:break-word}
.summary{margin-top:10px;display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
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
  <h1>${esc(title)}</h1>
  <div class="meta">
    Period: ${esc(filters.from)} to ${esc(filters.to)} &nbsp;|&nbsp;
    Group: ${esc(groupLabel)} &nbsp;|&nbsp;
    Printed: ${esc(printedAt)}
  </div>
  <table>${colgroup}<thead>${thead}</thead><tbody>${tbody}</tbody></table>
  <div class="summary">
    <div class="box"><b>Taxable:</b> ${esc(money(totals.taxable))}</div>
    <div class="box"><b>VAT:</b> ${esc(money(totals.vat))}</div>
    <div class="box"><b>Total:</b> ${esc(money(totals.total))}</div>
  </div>
</div>
<div class="page-footer"></div>
</body></html>`;
}

/* =========================
   Component
   ========================= */

export default function VatReport() {
  const navigate = useNavigate();
  const today = useMemo(() => toYMD(new Date()), []);

  const [filters, setFilters] = useState({
    from: today,
    to: today,
    groupBy: "INVOICE", // INVOICE | DAY (UI values)
    page: 0,
    size: 20,
  });

  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({});
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const store = useMemo(() => ({
    name: localStorage.getItem("store.name") || "Store Name",
    trn:  localStorage.getItem("store.trn")  || "",
  }), []);

  const cols = useMemo(() => (
    filters.groupBy === "INVOICE"
      ? [
          { key: "date",     label: "DATE" },
          { key: "invoice",  label: "INVOICE" },
          { key: "customer", label: "CUSTOMER" },
          { key: "taxable",  label: "TAXABLE", align: "right", money: true },
          { key: "vat",      label: "VAT",     align: "right", money: true },
          { key: "total",    label: "TOTAL",   align: "right", money: true },
        ]
      : [
          { key: "date",     label: "DATE" },
          { key: "bills",    label: "BILLS",   align: "right" },
          { key: "taxable",  label: "TAXABLE", align: "right", money: true },
          { key: "vat",      label: "VAT",     align: "right", money: true },
          { key: "total",    label: "TOTAL",   align: "right", money: true },
        ]
  ), [filters.groupBy]);

  const setField = (k, v) =>
    setFilters((f) => ({ ...f, [k]: v, page: ["from","to","groupBy","size"].includes(k) ? 0 : f.page }));

  const fetchData = useCallback(async () => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    try {
      // Map UI values to what backend expects
      const groupMap = { INVOICE: "invoice", DAY: "day" };
      const params = { ...filters, groupBy: groupMap[filters.groupBy] };

      const { data } = await axios.get("/reports/vat", { params, signal: controller.signal });
      const itemsRaw = data?.items ?? data ?? [];

      // Normalize to stable keys used by UI/print/export
      const items = itemsRaw.map((r) => ({
        date:     r.date ?? r.txnDate ?? r.docDate ?? null,
        invoice:  pick(r, "invoice", "invoiceNo", "billNo", "docNo", "receiptNo", "ref", "reference"),
        customer: pick(r, "customer", "customerName", "customer_code", "customerCode", "party", "name"),
        bills:    r.bills ?? r.count ?? r.noOfBills ?? null,
        taxable:  r.taxable ?? r.net ?? r.subtotal ?? 0,
        vat:      r.vat ?? r.tax ?? 0,
        total:    r.total ?? r.gross ?? r.amount ?? 0,
        _id:      r.id || r._id || undefined,
      }));

      setRows(items);
      setTotals(data?.totals ?? {});
      setCount(Number(data?.count ?? items.length));
    } catch (e) {
      if (!isCanceled(e)) {
        const status = e?.response?.status;
        const msg = e?.response?.data?.message || e?.message || "";
        if (status === 404 || /no static resource/i.test(msg)) {
          setRows([]); setTotals({}); setCount(0); // treat static dev stubs as empty
        } else {
          setError(msg || "Server error");
        }
      }
    } finally {
      setLoading(false);
    }

    // Note: we don't return controller here because we're not creating a live subscription.
    // If you want cancellation on unmount, call fetch inside a useEffect that holds a controller.
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const exportExcel = useCallback(async () => {
    try {
      const mod = await import("xlsx");
      const XLSX = mod?.default ?? mod;

      const sheet = (rows ?? []).map((r) =>
        Object.fromEntries(
          cols.map((c) => {
            let v = r[c.key];
            if (c.money) v = money(v);
            if (c.key === "date" && v) v = toYMD(v);
            return [c.label, v ?? ""];
          })
        )
      );

      const ws = XLSX.utils.json_to_sheet(sheet);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "VAT");
      XLSX.writeFile(wb, `VAT_${filters.from}_${filters.to}_${filters.groupBy}.xlsx`);
    } catch (err) {
      setError(`Export failed: ${err?.message || "Unknown error"}`);
    }
  }, [rows, cols, filters.from, filters.to, filters.groupBy]);

  const handlePrint = useCallback(() => {
    const html = buildPrintHTML({
      title: "VAT Report",
      store,
      filters,
      cols,
      rows,
      totals,
    });
    printHTML(html);
  }, [store, filters, cols, rows, totals]);

  /* =========================
     Render
     ========================= */

  return (
    <div className="rpt-wrap">
      <div className="rpt-header">
        <div className="left">
          <button className="iconbtn" onClick={() => navigate("/dashboard")} aria-label="Home">
            <FaHome />
          </button>
          <h2>VAT Report</h2>
        </div>
        <button className="iconbtn" onClick={() => navigate("/reports")} aria-label="Close">
          <FaTimes />
        </button>
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
        <div className="field">
          <label htmlFor="groupBy">Group By</label>
          <select id="groupBy" value={filters.groupBy} onChange={(e) => setField("groupBy", e.target.value)}>
            <option value="INVOICE">Invoice</option>
            <option value="DAY">Day</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="rows">Rows</label>
          <select id="rows" value={filters.size} onChange={(e) => setField("size", Number(e.target.value))}>
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>{n}/page</option>
            ))}
          </select>
        </div>

        <div className="actions">
          <button className="act run" onClick={fetchData} disabled={loading}>
            {loading ? "Running…" : "Run"}
          </button>
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
                    <th key={c.key} style={{ textAlign: c.align || "left" }}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td className="rpt-empty" colSpan={cols.length}>
                      No data for selected filters
                    </td>
                  </tr>
                )}
                {rows.map((r) => {
                  const key = r._id || r.invoice || `${r.date}-${r.customer ?? r.bills}-${r.total}`;
                  return (
                    <tr key={key}>
                      {cols.map((c) => {
                        let v = r[c.key];
                        if (c.money) v = money(v);
                        if (c.key === "date" && v) v = toYMD(v);
                        return (
                          <td key={c.key} style={{ textAlign: c.align || "left" }}>
                            {v ?? "-"}
                          </td>
                        );
                      })}
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
          <div className="k">Taxable</div>
          <div className="v">{money(totals.taxable)}</div>
        </div>
        <div className="box">
          <div className="k">VAT</div>
          <div className="v">{money(totals.vat)}</div>
        </div>
        <div className="box">
          <div className="k">Total</div>
          <div className="v">{money(totals.total)}</div>
        </div>
      </div>

      <div className="rpt-pager">
        <button onClick={() => setField("page", Math.max(0, filters.page - 1))} disabled={filters.page === 0}>
          Prev
        </button>
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
