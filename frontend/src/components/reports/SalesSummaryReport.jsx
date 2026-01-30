import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaTimes } from "react-icons/fa";
import axios from "../../api/axios";
import "./SalesSummaryReport.css";

/* ================== utils ================== */
const AED_FMT = new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED" });
const toNumber = (v) => (v === "" || v == null ? 0 : Number(String(v).replace(/,/g, "")) || 0);
const money = (v) => AED_FMT.format(toNumber(v));
const toYMD = (d) => {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d);
  const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

/* ================== columns ================== */
const COLS = [
  { key: "date",       label: "DATE" },
  { key: "shift",      label: "SHIFT",  align: "center" },
  { key: "cashier",    label: "CASHIER" },
  { key: "billCount",  label: "BILLS",  align: "right" },
  { key: "grossTotal", label: "GROSS",  align: "right", money: true },
  { key: "vat",        label: "VAT",    align: "right", money: true },
  { key: "netTotal",   label: "NET",    align: "right", money: true },
  { key: "cash",       label: "CASH",   align: "right", money: true },
  { key: "card",       label: "CARD",   align: "right", money: true },
  { key: "credit",     label: "CREDIT", align: "right", money: true },
  { key: "returns",    label: "RETURNS",align: "right", money: true },
];

/* tolerate backend key variations */
const getVal = {
  date:       (r) => r.date ?? r.day ?? r.saleDate ?? r.createdAt ?? null,
  shift:      (r) => r.shift ?? r.shiftName ?? r.session ?? "-",
  cashier:    (r) => r.cashier ?? r.user ?? r.username ?? "-",
  billCount:  (r) => toNumber(r.billCount ?? r.bills ?? r.count),
  grossTotal: (r) => toNumber(r.grossTotal ?? r.gross),
  vat:        (r) => toNumber(r.vat ?? r.tax),
  netTotal:   (r) => toNumber(r.netTotal ?? r.net),
  cash:       (r) => toNumber(r.cash),
  card:       (r) => toNumber(r.card),
  credit:     (r) => toNumber(r.credit),
  returns:    (r) => toNumber(r.returns),
};
const cell = (row, key) => (key in getVal ? getVal[key](row) : row[key]);

/* totals (client-side fallback) */
const sumTotals = (items) => {
  const t = { billCount: 0, grossTotal: 0, vat: 0, netTotal: 0, cash: 0, card: 0, credit: 0, returns: 0 };
  for (const r of items || []) {
    t.billCount  += getVal.billCount(r);
    t.grossTotal += getVal.grossTotal(r);
    t.vat        += getVal.vat(r);
    t.netTotal   += getVal.netTotal(r);
    t.cash       += getVal.cash(r);
    t.card       += getVal.card(r);
    t.credit     += getVal.credit(r);
    t.returns    += getVal.returns(r);
  }
  return t;
};

/* ================== print (iframe) ================== */
const esc = (s) => String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
function buildPrintHTML({ filters, rows, totals }) {
  const thead = `<tr>${COLS.map(c =>
    `<th style="text-align:${c.align || "left"}">${esc(c.label)}</th>`).join("")}</tr>`;

  const tbody = rows.length
    ? rows.map((r) => {
        const tds = COLS.map((c) => {
          let v = cell(r, c.key);
          if (c.key === "date" && v) v = toYMD(v);
          if (c.money) v = money(v);
          if (v == null || v === "") v = "-";
          return `<td style="text-align:${c.align || "left"}">${esc(v)}</td>`;
        }).join("");
        return `<tr>${tds}</tr>`;
      }).join("")
    : `<tr><td colspan="${COLS.length}">No data</td></tr>`;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>Sales Summary</title>
<style>
@page{margin:12mm}
body{font-family:Arial,Helvetica,sans-serif;color:#000}
h1{margin:0 0 6px;font-size:18px;text-align:center}
.meta{font-size:12px;margin:0 0 10px;text-align:center}
table{width:100%;border-collapse:collapse;font-size:12px}
th,td{border:1px solid #000;padding:6px 8px}
th{background:#f4f4f9}
.summary{margin-top:10px;display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.box{border:1px solid #000;padding:6px}
.bold{font-weight:700}
</style>
</head>
<body>
  <h1>Sales Summary</h1>
  <div class="meta">
    Period: ${filters.from} to ${filters.to}
    ${filters.groupBy ? ` | Group: ${esc(filters.groupBy)}` : ""}
    ${filters.shift ? ` | Shift: ${esc(filters.shift)}` : ""}
    ${filters.cashier ? ` | Cashier: ${esc(filters.cashier)}` : ""}
    | Printed: ${esc(new Date().toLocaleString())}
  </div>
  <table><thead>${thead}</thead><tbody>${tbody}</tbody></table>
  <div class="summary">
    <div class="box"><span class="bold">Bills:</span> ${totals.billCount ?? 0}</div>
    <div class="box"><span class="bold">Gross:</span> ${money(totals.grossTotal)}</div>
    <div class="box"><span class="bold">VAT:</span> ${money(totals.vat)}</div>
    <div class="box"><span class="bold">Net:</span> ${money(totals.netTotal)}</div>
    <div class="box"><span class="bold">Cash:</span> ${money(totals.cash)}</div>
    <div class="box"><span class="bold">Card:</span> ${money(totals.card)}</div>
    <div class="box"><span class="bold">Credit:</span> ${money(totals.credit)}</div>
    <div class="box"><span class="bold">Returns:</span> ${money(totals.returns)}</div>
  </div>
</body>
</html>`;
}

/* ================== component ================== */
export default function SalesSummaryReport() {
  const navigate = useNavigate();

  const today = useMemo(() => toYMD(new Date()), []);
  const [filters, setFilters] = useState({
    from: today,
    to: today,
    shift: "",
    cashier: "",
    groupBy: "DAY",       // DAY | SHIFT | CASHIER
    page: 0,
    size: 20,
  });

  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({});
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setField = (k, v) =>
    setFilters((f) => ({
      ...f,
      [k]: v,
      page: ["from","to","shift","cashier","groupBy","size"].includes(k) ? 0 : f.page,
    }));

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get("/reports/sales-summary", {
        params: {
          from: filters.from,
          to: filters.to,
          shift: filters.shift,
          cashier: filters.cashier,
          groupBy: filters.groupBy,
          page: filters.page,
          size: filters.size,
        },
      });

      const items = data?.items ?? data ?? [];
      setRows(items);
      setTotals(data?.totals && Object.keys(data.totals).length ? data.totals : sumTotals(items));
      setCount(Number(data?.count ?? items.length));
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Server error");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const next = () => setFilters((f) => ({ ...f, page: f.page + 1 }));
  const prev = () => setFilters((f) => ({ ...f, page: Math.max(0, f.page - 1) }));

  const exportExcel = useCallback(async () => {
    try {
      const mod = await import("xlsx");
      const XLSX = mod?.default ?? mod;
      const sheetData =
        rows?.map((r) =>
          Object.fromEntries(
            COLS.map((c) => {
              let v = cell(r, c.key);
              if (c.key === "date" && v) v = toYMD(v);
              if (c.money) v = money(v);
              return [c.label, v ?? ""];
            })
          )
        ) ?? [];
      const ws = XLSX.utils.json_to_sheet(sheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "SalesSummary");
      XLSX.writeFile(wb, `Sales_Summary_${filters.from}_${filters.to}.xlsx`);
    } catch (err) {
      console.error(err);
      setError(`Export failed: ${err.message}`);
    }
  }, [rows, filters.from, filters.to]);

  const handlePrint = useCallback(() => {
    try {
      const html = buildPrintHTML({
        filters,
        rows,
        totals: Object.keys(totals || {}).length ? totals : sumTotals(rows),
      });

      const iframe = document.createElement("iframe");
      Object.assign(iframe.style, {
        position: "fixed",
        right: "0",
        bottom: "0",
        width: "0",
        height: "0",
        border: "0",
      });
      document.body.appendChild(iframe);

      const iw = iframe.contentWindow;
      const idoc = iw.document;
      idoc.open();
      idoc.write(html);
      idoc.close();

      const doPrint = () => {
        try { iw.focus(); iw.print(); }
        finally { setTimeout(() => document.body.removeChild(iframe), 300); }
      };

      if (idoc.readyState === "complete") setTimeout(doPrint, 50);
      else {
        idoc.addEventListener("readystatechange", () => idoc.readyState === "complete" && doPrint());
        setTimeout(doPrint, 500);
      }
    } catch (e) {
      console.error(e);
      setError("Print failed");
    }
  }, [filters, rows, totals]);

  return (
    <div className="ssx-wrap">
      {/* Header */}
      <div className="ssx-header">
        <div className="ssx-left">
          <button className="ssx-iconbtn" aria-label="Home" onClick={() => navigate("/dashboard")}>
            <FaHome />
          </button>
          <h2 className="ssx-title">Sales Summary</h2>
        </div>
        <div className="ssx-right">
          <button className="ssx-close" aria-label="Close" onClick={() => navigate("/reports")}>
            <FaTimes />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="ssx-toolbar">
        <div className="ssx-field">
          <label>From</label>
          <input type="date" value={filters.from} onChange={(e) => setField("from", e.target.value)} />
        </div>
        <div className="ssx-field">
          <label>To</label>
          <input type="date" value={filters.to} onChange={(e) => setField("to", e.target.value)} />
        </div>
        <div className="ssx-field">
          <label>Shift</label>
          <select value={filters.shift} onChange={(e) => setField("shift", e.target.value)}>
            <option value="">All</option>
            <option value="A">A</option>
            <option value="B">B</option>
          </select>
        </div>
        <div className="ssx-field">
          <label>Cashier</label>
          <input placeholder="Name/ID" value={filters.cashier} onChange={(e) => setField("cashier", e.target.value)} />
        </div>
        <div className="ssx-field">
          <label>Group By</label>
          <select value={filters.groupBy} onChange={(e) => setField("groupBy", e.target.value)}>
            <option value="DAY">Day</option>
            <option value="SHIFT">Shift</option>
            <option value="CASHIER">Cashier</option>
          </select>
        </div>
        <div className="ssx-field">
          <label>Rows</label>
          <select value={filters.size} onChange={(e) => setField("size", Number(e.target.value))}>
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>{n}/page</option>
            ))}
          </select>
        </div>
        <div className="ssx-actions">
          <button className="act run" onClick={fetchReports}>Run</button>
          <button className="act export" onClick={exportExcel}>Export</button>
          <button className="act print" onClick={handlePrint}>Print</button>
        </div>
      </div>

      {error && <div className="ssx-error">{error}</div>}

      {/* Table */}
      <div className="ssx-card">
        {loading ? (
          <div className="ssx-loading">Loading…</div>
        ) : (
          <div className="ssx-tablewrap">
            <table className="ssx-table">
              <thead>
                <tr>
                  {COLS.map((c) => (
                    <th key={c.key} style={{ textAlign: c.align || "left" }}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={COLS.length} className="ssx-empty">No data for selected filters</td>
                  </tr>
                )}
                {rows.map((r, i) => (
                  <tr key={i}>
                    {COLS.map((c) => {
                      let v = cell(r, c.key);
                      if (c.key === "date" && v) v = toYMD(v);
                      if (c.money) v = money(v);
                      return (
                        <td key={c.key} style={{ textAlign: c.align || "left" }}>
                          {v ?? "-"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Totals */}
      <div className="ssx-summary">
        <div className="box"><div className="k">Bills</div><div className="v">{totals.billCount ?? 0}</div></div>
        <div className="box"><div className="k">Gross</div><div className="v">{money(totals.grossTotal)}</div></div>
        <div className="box"><div className="k">VAT</div><div className="v">{money(totals.vat)}</div></div>
        <div className="box"><div className="k">Net</div><div className="v">{money(totals.netTotal)}</div></div>
        <div className="box"><div className="k">Cash</div><div className="v">{money(totals.cash)}</div></div>
        <div className="box"><div className="k">Card</div><div className="v">{money(totals.card)}</div></div>
        <div className="box"><div className="k">Credit</div><div className="v">{money(totals.credit)}</div></div>
        <div className="box"><div className="k">Returns</div><div className="v">{money(totals.returns)}</div></div>
      </div>

      {/* Pager */}
      <div className="ssx-pager">
        <button onClick={prev} disabled={filters.page === 0}>Prev</button>
        <span>Page {filters.page + 1}</span>
        <button onClick={next} disabled={(filters.page + 1) * filters.size >= count}>Next</button>
      </div>
    </div>
  );
}
