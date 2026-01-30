import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaTimes } from "react-icons/fa";
import axios from "../../api/axios";
import "./ProductSalesReport.css";

/* ================= utils ================= */
const AED_FMT = new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED" });
const toNumber = (v) => (v === "" || v == null ? 0 : Number(String(v).replace(/,/g, "")) || 0);
const money = (v) => AED_FMT.format(toNumber(v));
const toYMD = (d) => {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d);
  const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

/* Pull store details if you’ve saved them (optional) */
const STORE = {
  name: localStorage.getItem("store.name") || "Store Name",
  trn:  localStorage.getItem("store.trn")  || "", // leave empty if you don't use TRN
};

/* server groups -> labels */
const GROUPS = [
  { key: "PRODUCT",  label: "Product"  },
  { key: "CATEGORY", label: "Category" },
  { key: "DAY",      label: "Day"      },
  { key: "CASHIER",  label: "Cashier"  },
];

/* ================= columns ================= */
function buildColumns(groupBy) {
  const totals = [
    { key: "qty",        label: "QTY",   align: "right" },
    { key: "grossTotal", label: "GROSS", align: "right", money: true },
    { key: "vat",        label: "VAT",   align: "right", money: true },
    { key: "netTotal",   label: "NET",   align: "right", money: true },
  ];
  switch (groupBy) {
    case "CATEGORY": return [{ key: "category", label: "CATEGORY" }, ...totals];
    case "DAY":      return [{ key: "date",     label: "DATE" },     ...totals];
    case "CASHIER":  return [{ key: "cashier",  label: "CASHIER" },  ...totals];
    case "PRODUCT":
    default:
      return [
        { key: "productCode", label: "CODE" },
        { key: "productName", label: "PRODUCT" },
        { key: "unit",        label: "UNIT", align: "center" },
        ...totals,
      ];
  }
}

/* tolerant getters so print works regardless of backend keys */
const getVal = {
  date:        (r) => r.date ?? r.day ?? r.saleDate ?? r.createdAt ?? null,
  cashier:     (r) => r.cashier ?? r.user ?? r.username ?? "-",
  category:    (r) => r.category ?? r.cat ?? "-",
  productCode: (r) => r.productCode ?? r.code ?? r.itemCode ?? "-",
  productName: (r) => r.productName ?? r.name ?? r.item ?? "-",
  unit:        (r) => r.unit ?? r.uom ?? "-",
  qty:         (r) => toNumber(r.qty ?? r.quantity ?? r.totalQty),
  grossTotal:  (r) => toNumber(r.grossTotal ?? r.gross),
  vat:         (r) => toNumber(r.vat ?? r.tax),
  netTotal:    (r) => toNumber(r.netTotal ?? r.net),
};
const cell = (row, key) => (key in getVal ? getVal[key](row) : row[key]);

/* totals fallback (client-side) */
const sumTotals = (items) => {
  const t = { qty: 0, grossTotal: 0, vat: 0, netTotal: 0 };
  for (const r of items || []) {
    t.qty        += getVal.qty(r);
    t.grossTotal += getVal.grossTotal(r);
    t.vat        += getVal.vat(r);
    t.netTotal   += getVal.netTotal(r);
  }
  return t;
};

/* Detect meaningless rows (so we can hide placeholder-only rows on print) */
function isMeaningfulRow(row, cols) {
  let hasText = false;
  let hasNonZero = false;
  for (const c of cols) {
    let v = cell(row, c.key);
    if (c.key === "date" && v) v = toYMD(v);
    if (c.money) v = toNumber(v);  // for numeric checks
    if (typeof v === "string" && v.trim() && v.trim() !== "-") hasText = true;
    if (typeof v === "number" && v !== 0) hasNonZero = true;
  }
  return hasText || hasNonZero;
}

/* ================ PRINT (iframe) ================ */
const esc = (s) => String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
function buildPrintHTML({ filters, cols, rows, totals }) {
  const printableRows = (rows || []).filter((r) => isMeaningfulRow(r, cols));

  const thead = `<tr>${cols.map(c =>
    `<th style="text-align:${c.align || "left"}">${esc(c.label)}</th>`
  ).join("")}</tr>`;

  const tbody = printableRows.length
    ? printableRows.map(r => {
        const tds = cols.map(c => {
          let v = cell(r, c.key);
          if (c.key === "date" && v) v = toYMD(v);
          if (c.money) v = money(v);
          if (v == null || v === "") v = "-";
          return `<td style="text-align:${c.align || "left"}">${esc(v)}</td>`;
        }).join("");
        return `<tr>${tds}</tr>`;
      }).join("")
    : `<tr><td colspan="${cols.length}" style="text-align:center">No data for selected filters</td></tr>`;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>Product Sales Report</title>
<style>
@page{margin:12mm}
body{font-family:Arial,Helvetica,sans-serif;color:#000}
h1{margin:0 0 2px;font-size:18px;text-align:center}
.meta{font-size:12px;margin:0 0 10px;text-align:center}
.store{font-size:12px;text-align:center;margin-bottom:2px}
table{width:100%;border-collapse:collapse;font-size:12px}
th,td{border:1px solid #000;padding:6px 8px}
th{background:#f4f4f9}
.summary{margin-top:10px;display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.box{border:1px solid #000;padding:6px}
.bold{font-weight:700}

/* Footer page numbers */
@media print {
  body::after{
    content: "Page " counter(page) " of " counter(pages);
    position: fixed; bottom: 8mm; right: 12mm; font-size: 11px;
  }
}
</style>
</head>
<body>
  <div class="store">
    ${esc(STORE.name)}${STORE.trn ? " | TRN: " + esc(STORE.trn) : ""}
  </div>
  <h1>Product Sales Report</h1>
  <div class="meta">
    Period: ${filters.from} to ${filters.to}
    ${filters.groupBy ? ` | Group: ${esc(filters.groupBy)}` : ""}
    ${filters.shift ? ` | Shift: ${esc(filters.shift)}` : ""}
    ${filters.cashier ? ` | Cashier: ${esc(filters.cashier)}` : ""}
    ${filters.cat ? ` | Category: ${esc(filters.cat)}` : ""}
    ${filters.q ? ` | Search: ${esc(filters.q)}` : ""}
    | Printed: ${esc(new Date().toLocaleString())}
  </div>
  <table><thead>${thead}</thead><tbody>${tbody}</tbody></table>
  <div class="summary">
    <div class="box"><span class="bold">Qty:</span> ${totals.qty ?? 0}</div>
    <div class="box"><span class="bold">Gross:</span> ${money(totals.grossTotal)}</div>
    <div class="box"><span class="bold">VAT:</span> ${money(totals.vat)}</div>
    <div class="box"><span class="bold">Net:</span> ${money(totals.netTotal)}</div>
  </div>
</body>
</html>`;
}

/* ================ component ================ */
export default function ProductSalesReport() {
  const navigate = useNavigate();

  const today = useMemo(() => toYMD(new Date()), []);
  const [filters, setFilters] = useState({
    from: today,
    to: today,
    shift: "",
    cashier: "",
    cat: "",
    q: "",
    groupBy: "PRODUCT",
    sortBy: "",
    sortDir: "DESC",
    page: 0,
    size: 20,
  });

  const cols = useMemo(() => buildColumns(filters.groupBy), [filters.groupBy]);

  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({});
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setField = (k, v) =>
    setFilters((f) => ({
      ...f,
      [k]: v,
      page: ["from","to","shift","cashier","cat","q","size","groupBy"].includes(k) ? 0 : f.page,
    }));

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get("/reports/product-sales", {
        params: {
          from: filters.from,
          to: filters.to,
          shift: filters.shift,
          cashier: filters.cashier,
          category: filters.cat,
          q: filters.q,
          groupBy: filters.groupBy,
          sortBy: filters.sortBy || undefined,
          sortDir: filters.sortDir,
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

  useEffect(() => { fetchData(); }, [fetchData]);

  /* sorting */
  const toggleSort = (key) => {
    setFilters((f) => {
      const nextDir = f.sortBy === key && f.sortDir === "ASC" ? "DESC" : "ASC";
      return { ...f, sortBy: key, sortDir: nextDir, page: 0 };
    });
    setRows((prev) => {
      const copy = [...prev];
      const dir = (filters.sortBy === key && filters.sortDir === "ASC") ? -1 : 1;
      copy.sort((a, b) => {
        let va = cell(a, key), vb = cell(b, key);
        if (key === "date") { va = va ? new Date(va).getTime() : 0; vb = vb ? new Date(vb).getTime() : 0; }
        else if (["qty","grossTotal","vat","netTotal"].includes(key)) { va = toNumber(va); vb = toNumber(vb); }
        else { va = String(va ?? ""); vb = String(vb ?? ""); }
        if (va > vb) return 1 * dir;
        if (va < vb) return -1 * dir;
        return 0;
      });
      return copy;
    });
  };
  const sortIndicator = (key) =>
    filters.sortBy === key ? <span className="psr-sort" aria-hidden>{filters.sortDir === "ASC" ? "▲" : "▼"}</span> : null;

  /* pager */
  const next = () => setFilters((f) => ({ ...f, page: f.page + 1 }));
  const prev = () => setFilters((f) => ({ ...f, page: Math.max(0, f.page - 1) }));

  /* export (visible structure) */
  const exportExcel = useCallback(async () => {
    try {
      const mod = await import("xlsx");
      const XLSX = mod?.default ?? mod;

      const sheetData =
        rows?.map((r) =>
          Object.fromEntries(
            cols.map((c) => {
              let v = cell(r, c.key);
              if (c.key === "date" && v) v = toYMD(v);
              if (c.money) v = money(v);
              return [c.label, v ?? ""];
            })
          )
        ) ?? [];

      const ws = XLSX.utils.json_to_sheet(sheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "ProductSales");
      XLSX.writeFile(wb, `Product_Sales_${filters.from}_${filters.to}_${filters.groupBy}.xlsx`);
    } catch (err) {
      console.error(err);
      setError(`Export failed: ${err.message}`);
    }
  }, [rows, cols, filters.from, filters.to, filters.groupBy]);

  /* print via iframe (no blank preview; with store header + page footer) */
  const handlePrint = useCallback(() => {
    try {
      const html = buildPrintHTML({
        filters,
        cols,
        rows,
        totals: Object.keys(totals || {}).length ? totals : sumTotals(rows),
      });

      const iframe = document.createElement("iframe");
      Object.assign(iframe.style, { position: "fixed", right: "0", bottom: "0", width: "0", height: "0", border: "0" });
      document.body.appendChild(iframe);

      const iw = iframe.contentWindow;
      const idoc = iw.document;
      idoc.open(); idoc.write(html); idoc.close();

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
  }, [filters, cols, rows, totals]);

  return (
    <div className="psr-wrap">
      {/* Header */}
      <div className="psr-header">
        <div className="psr-left">
          <button className="psr-iconbtn" aria-label="Home" onClick={() => navigate("/dashboard")}><FaHome /></button>
          <h2 className="psr-title">Product Sales Report</h2>
        </div>
        <div className="psr-right">
          <button className="psr-close" aria-label="Close" onClick={() => navigate("/reports")}><FaTimes /></button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="psr-toolbar">
        <div className="psr-field">
          <label>From</label>
          <input type="date" value={filters.from} onChange={(e) => setField("from", e.target.value)} />
        </div>
        <div className="psr-field">
          <label>To</label>
          <input type="date" value={filters.to} onChange={(e) => setField("to", e.target.value)} />
        </div>
        <div className="psr-field">
          <label>Shift</label>
          <select value={filters.shift} onChange={(e) => setField("shift", e.target.value)}>
            <option value="">All</option>
            <option value="A">A</option>
            <option value="B">B</option>
          </select>
        </div>
        <div className="psr-field">
          <label>Cashier</label>
          <input placeholder="Name/ID" value={filters.cashier} onChange={(e) => setField("cashier", e.target.value)} />
        </div>
        <div className="psr-field">
          <label>Category</label>
          <input placeholder="Category" value={filters.cat} onChange={(e) => setField("cat", e.target.value)} />
        </div>
        <div className="psr-field grow">
          <label>Search</label>
          <input placeholder="Code / Name / Barcode" value={filters.q} onChange={(e) => setField("q", e.target.value)} />
        </div>
        <div className="psr-field">
          <label>Group By</label>
          <select value={filters.groupBy} onChange={(e) => setField("groupBy", e.target.value)}>
            {GROUPS.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
          </select>
        </div>
        <div className="psr-field">
          <label>Rows</label>
          <select value={filters.size} onChange={(e) => setField("size", Number(e.target.value))}>
            {[20, 50, 100].map((n) => <option key={n} value={n}>{n}/page</option>)}
          </select>
        </div>

        <div className="psr-actions">
          <button className="act run" onClick={fetchData}>Run</button>
          <button className="act export" onClick={exportExcel}>Export</button>
          <button className="act print" onClick={handlePrint}>Print</button>
        </div>
      </div>

      {error && <div className="psr-error">{error}</div>}

      {/* Table */}
      <div className="psr-card">
        {loading ? (
          <div className="psr-loading">Loading…</div>
        ) : (
          <div className="psr-tablewrap">
            <table className="psr-table">
              <thead>
                <tr>
                  {cols.map((c) => (
                    <th
                      key={c.key}
                      style={{ textAlign: c.align || "left" }}
                      className="psr-th-sortable"
                      onClick={() => toggleSort(c.key)}
                    >
                      <span className="psr-th-lbl">{c.label}</span>
                      {sortIndicator(c.key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={cols.length} className="psr-empty">No data for selected filters</td></tr>
                )}
                {rows.map((r, i) => (
                  <tr key={i}>
                    {cols.map((c) => {
                      let v = cell(r, c.key);
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

      {/* Totals */}
      <div className="psr-summary">
        <div className="box"><div className="k">Qty</div>   <div className="v">{totals.qty ?? totals.totalQty ?? 0}</div></div>
        <div className="box"><div className="k">Gross</div> <div className="v">{money(totals.grossTotal)}</div></div>
        <div className="box"><div className="k">VAT</div>   <div className="v">{money(totals.vat)}</div></div>
        <div className="box"><div className="k">Net</div>   <div className="v">{money(totals.netTotal)}</div></div>
      </div>

      {/* Pager */}
      <div className="psr-pager">
        <button onClick={prev} disabled={filters.page === 0}>Prev</button>
        <span>Page {filters.page + 1}</span>
        <button onClick={next} disabled={(filters.page + 1) * filters.size >= count}>Next</button>
      </div>
    </div>
  );
}
