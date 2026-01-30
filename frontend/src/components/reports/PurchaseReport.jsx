import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FaHome, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import "./PurchaseReport.css";

/* utils */
const AED = new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED" });
const money = (v) => AED.format(Number(v || 0));
const toYMD = (d) => {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d || Date.now());
  const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

/* print helpers (hidden iframe) */
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

/* printable HTML */
function buildPrintHTML({ store, filters, cols, rows, totals }) {
  const esc = (s) => String(s ?? "").replace(/[&<>]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[m]));
  const thead = `<tr>${cols.map(c => `<th style="text-align:${c.align || "left"}">${esc(c.label)}</th>`).join("")}</tr>`;
  const tbody = rows.length
    ? rows.map(r => {
        const tds = cols.map(c => {
          let v = r[c.key];
          if (c.key === "date" && v) v = toYMD(v);
          if (c.money) v = money(v);
          if (v == null || v === "") v = "-";
          return `<td style="text-align:${c.align || "left"}">${esc(v)}</td>`;
        }).join("");
        return `<tr>${tds}</tr>`;
      }).join("")
    : `<tr><td colspan="${cols.length}" style="text-align:center;padding:8px">No data for selected filters</td></tr>`;
  const printedAt = new Date().toLocaleString();

  return `<!doctype html>
<html><head><meta charset="utf-8"/><title>Purchase Report</title>
<style>
@page{ margin:12mm }
*{ box-sizing:border-box }
body{ font-family:Arial,Helvetica,sans-serif;color:#000 }
h1{ margin:0 0 6px; font-size:18px; text-align:center }
.meta{ font-size:12px; margin:0 0 10px; text-align:center }
.headerline{ border-top:1px solid #000; margin:6px 0 12px }
table{ width:100%; border-collapse:collapse; font-size:12px }
th,td{ border:1px solid #000; padding:4px 6px }
.summary{ margin-top:10px; display:grid; grid-template-columns:repeat(3,1fr); gap:6px }
.box{ border:1px solid #000; padding:6px; font-size:12px }
.box b{ display:inline-block; min-width:72px }
.page-footer{ position:fixed; bottom:6mm; left:0; right:0; font-size:11px; text-align:center }
.page-footer:after{ content: "Page " counter(page) " of " counter(pages) }
@media print{ body{ -webkit-print-color-adjust:exact; print-color-adjust:exact } }
</style></head>
<body>
  <div>
    <div style="text-align:center">
      <div style="font-weight:800;font-size:16px">${esc(store.name || "Store Name")}</div>
      ${store.trn ? `<div style="font-size:12px">TRN: ${esc(store.trn)}</div>` : ""}
    </div>
    <div class="headerline"></div>
    <h1>Purchase Report</h1>
    <div class="meta">
      Period: ${esc(filters.from)} to ${esc(filters.to)}
      ${filters.supplier ? `&nbsp;|&nbsp; Supplier: ${esc(filters.supplier)}` : ""}
      &nbsp;|&nbsp; Printed: ${esc(printedAt)}
    </div>
    <table><thead>${thead}</thead><tbody>${tbody}</tbody></table>
    <div class="summary">
      <div class="box"><b>Bills:</b> ${esc(totals.billCount ?? rows.length)}</div>
      <div class="box"><b>Gross:</b> ${esc(money(totals.gross))}</div>
      <div class="box"><b>Disc:</b> ${esc(money(totals.discount))}</div>
      <div class="box"><b>VAT:</b> ${esc(money(totals.vat))}</div>
      <div class="box"><b>Net:</b> ${esc(money(totals.net))}</div>
      <div class="box"><b>Paid:</b> ${esc(money(totals.paid))}</div>
      <div class="box"><b>Balance:</b> ${esc(money(totals.balance))}</div>
    </div>
  </div>
  <div class="page-footer"></div>
</body></html>`;
}

/* component */
export default function PurchaseReport() {
  const navigate = useNavigate();
  const today = useMemo(() => toYMD(new Date()), []);

  const [filters, setFilters] = useState({
    from: today,
    to: today,
    supplier: "",
    page: 0,
    size: 20,
  });

  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({});
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* store info (fetch once; NO warnings) */
  const DEFAULT_STORE_NAME = useMemo(() => localStorage.getItem("store.name") || "Store Name", []);
  const DEFAULT_STORE_TRN  = useMemo(() => localStorage.getItem("store.trn")  || "", []);
  const [store, setStore] = useState({ name: DEFAULT_STORE_NAME, trn: DEFAULT_STORE_TRN });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const candidates = ["/store/info", "/settings/store", "/company", "/org", "/pos/store"];
      for (const path of candidates) {
        try {
          const { data } = await axios.get(path);
          if (cancelled) return;
          const name = data?.name || data?.storeName || data?.companyName || data?.title || "";
          const trn  = data?.trn  || data?.vatNo    || data?.vat         || data?.taxId || "";
          if (name || trn) {
            setStore(prev => ({ name: name || prev.name, trn: trn || prev.trn }));
            break;
          }
        } catch { /* try next */ }
      }
    })();
    return () => { cancelled = true; };
  }, []); // empty deps: runs once, no store reads here

  const cols = useMemo(() => ([
    { key: "date",     label: "DATE" },
    { key: "supplier", label: "SUPPLIER" },
    { key: "billNo",   label: "BILL NO" },
    { key: "gross",    label: "GROSS",   align: "right", money: true },
    { key: "discount", label: "DISC",    align: "right", money: true },
    { key: "vat",      label: "VAT",     align: "right", money: true },
    { key: "net",      label: "NET",     align: "right", money: true },
    { key: "paid",     label: "PAID",    align: "right", money: true },
    { key: "balance",  label: "BALANCE", align: "right", money: true },
  ]), []);

  const setField = (k, v) =>
    setFilters(f => ({ ...f, [k]: v, page: ["from","to","supplier","size"].includes(k) ? 0 : f.page }));

  const fetchData = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data } = await axios.get("/reports/purchase", {
        params: {
          from: filters.from, to: filters.to,
          supplier: filters.supplier, page: filters.page, size: filters.size,
        },
      });
      const items = data?.items ?? data ?? [];
      setRows(items);
      setTotals(data?.totals ?? {});
      setCount(Number(data?.count ?? items.length));
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Server error");
    } finally {
      setLoading(false);
    }
  }, [filters.from, filters.to, filters.supplier, filters.page, filters.size]); // precise deps

  useEffect(() => { fetchData(); }, [fetchData]);

  const exportExcel = useCallback(async () => {
    try {
      const mod = await import("xlsx");
      const XLSX = mod.default ?? mod;
      const sheet = (rows ?? []).map(r =>
        Object.fromEntries(
          cols.map(c => {
            let v = r[c.key];
            if (c.money) v = money(v);
            if (c.key === "date" && v) v = toYMD(v);
            return [c.label, v ?? ""];
          })
        )
      );
      const ws = XLSX.utils.json_to_sheet(sheet);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Purchase");
      XLSX.writeFile(wb, `Purchase_${filters.from}_${filters.to}.xlsx`);
    } catch (err) {
      console.error(err);
      setError(`Export failed: ${err.message}`);
    }
  }, [rows, cols, filters.from, filters.to]);

  const handlePrint = useCallback(() => {
    printHTML(buildPrintHTML({ store, filters, cols, rows, totals }));
  }, [store, filters, cols, rows, totals]);

  return (
    <div className="rpt-wrap">
      <div className="rpt-header">
        <div className="left">
          <button className="iconbtn" onClick={() => navigate("/dashboard")} aria-label="Home"><FaHome /></button>
          <h2>Purchase Report</h2>
        </div>
        <button className="iconbtn" onClick={() => navigate("/reports")} aria-label="Close"><FaTimes /></button>
      </div>

      {error && <div className="rpt-error">{error}</div>}

      <div className="rpt-toolbar">
        <div className="field">
          <label>From</label>
          <input type="date" value={filters.from} onChange={(e) => setField("from", e.target.value)} />
        </div>
        <div className="field">
          <label>To</label>
          <input type="date" value={filters.to} onChange={(e) => setField("to", e.target.value)} />
        </div>
        <div className="field grow">
          <label>Supplier</label>
          <input placeholder="Name / Code" value={filters.supplier} onChange={(e) => setField("supplier", e.target.value)} />
        </div>
        <div className="field">
          <label>Rows</label>
          <select value={filters.size} onChange={(e) => setField("size", Number(e.target.value))}>
            {[10,20,50,100].map(n => <option key={n} value={n}>{n}/page</option>)}
          </select>
        </div>
        <div className="actions">
          <button className="act run" onClick={fetchData}>Run</button>
          <button className="act export" onClick={exportExcel}>Export</button>
          <button className="act print" onClick={handlePrint}>Print</button>
        </div>
      </div>

      <div className="rpt-card">
        {loading ? (
          <div className="rpt-loading">Loading…</div>
        ) : (
          <div className="rpt-tablewrap">
            <table className="rpt-table">
              <thead>
                <tr>{cols.map(c => <th key={c.key} style={{ textAlign: c.align || "left" }}>{c.label}</th>)}</tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td className="rpt-empty" colSpan={cols.length}>No data for selected filters</td></tr>
                )}
                {rows.map((r, i) => (
                  <tr key={i}>
                    {cols.map(c => {
                      let v = r[c.key];
                      if (c.money) v = money(v);
                      if (c.key === "date" && v) v = toYMD(v);
                      return <td key={c.key} style={{ textAlign: c.align || "left" }}>{v ?? "-"}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rpt-summary">
        <div className="box"><div className="k">Bills</div><div className="v">{totals.billCount ?? rows.length}</div></div>
        <div className="box"><div className="k">Gross</div><div className="v">{money(totals.gross)}</div></div>
        <div className="box"><div className="k">Disc</div><div className="v">{money(totals.discount)}</div></div>
        <div className="box"><div className="k">VAT</div><div className="v">{money(totals.vat)}</div></div>
        <div className="box"><div className="k">Net</div><div className="v">{money(totals.net)}</div></div>
        <div className="box"><div className="k">Paid</div><div className="v">{money(totals.paid)}</div></div>
        <div className="box"><div className="k">Balance</div><div className="v">{money(totals.balance)}</div></div>
      </div>

      <div className="rpt-pager">
        <button onClick={() => setField("page", Math.max(0, filters.page - 1))} disabled={filters.page === 0}>Prev</button>
        <span>Page {filters.page + 1}</span>
        <button onClick={() => setField("page", filters.page + 1)} disabled={(filters.page + 1) * filters.size >= count}>Next</button>
      </div>
    </div>
  );
}
