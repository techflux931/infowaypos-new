import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaTimes } from "react-icons/fa";
import axios from "../../api/axios";
import "./CustomerReport.css";

/* ========= utils ========= */
const AED_FMT = new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED" });
const num = (v) => {
  const n = Number((v ?? "").toString().replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const money = (v) => AED_FMT.format(num(v));
const toYMD = (d) => {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d);
  const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};
const norm = (s) => String(s ?? "").trim().toLowerCase();

/* group choices */
const GROUPS = [
  { key: "CUSTOMER", label: "Customer" },
  { key: "INVOICE",  label: "Invoice"  },
];

/* tolerant getters (support multiple backend keys) */
const g = {
  custName : (r) => r.customerName ?? r.customer ?? r.party ?? r.name ?? "",
  custCode : (r) => r.customerCode ?? r.code ?? r.customerId ?? r.customer_id ?? r.id ?? "",
  phone    : (r) => r.phone ?? r.mobile ?? r.phoneNumber ?? r.phone_no ?? "",

  bills    : (r) => num(r.bills ?? r.billCount ?? r.count ?? 0),

  invNo: (r) =>
    r.invoiceNo ?? r.billNo ?? r.invNo ?? r.reference ??
    r.invoice_no ?? r.invoice_number ?? r.bill_number ??
    r.voucherNo ?? r.voucher_no ?? r.docNo ?? r.document_no ?? "",

  date: (r) =>
    r.date ?? r.invoiceDate ?? r.createdAt ?? r.updatedAt ??
    r.invoice_date ?? r.bill_date ?? r.docDate ?? r.txnDate ?? null,

  gross: (r) => num(r.grossTotal ?? r.gross ?? r.total),
  disc : (r) => num(r.discount ?? r.disc),
  vat  : (r) => num(r.vat ?? r.tax),
  net  : (r) => num(r.netTotal ?? r.net ?? r.totalNet),
  paid : (r) => num(r.paid ?? r.received ?? r.collected),
  bal  : (r) => {
    const b = r.balance ?? r.outstanding;
    if (b != null) return num(b);
    return num(r.netTotal ?? r.net ?? r.totalNet ?? 0) - num(r.paid ?? r.received ?? r.collected ?? 0);
  },
};

/* columns */
const buildCols = (groupBy) => {
  const moneyCols = [
    { key: "gross", label: "GROSS", align: "right", money: true },
    { key: "disc",  label: "DISC",  align: "right", money: true },
    { key: "vat",   label: "VAT",   align: "right", money: true },
    { key: "net",   label: "NET",   align: "right", money: true },
    { key: "paid",  label: "PAID",  align: "right", money: true },
    { key: "bal",   label: "BAL",   align: "right", money: true },
  ];
  return groupBy === "INVOICE"
    ? [
        { key: "date",  label: "DATE" },
        { key: "invNo", label: "INVOICE #" },
        { key: "custName", label: "CUSTOMER" },
        ...moneyCols,
      ]
    : [
        { key: "custName", label: "CUSTOMER" },
        { key: "custCode", label: "CODE" },
        { key: "phone",    label: "PHONE" },
        { key: "bills",    label: "BILLS", align: "right" },
        ...moneyCols,
      ];
};

function getValue(row, key) {
  switch (key) {
    case "custName": return g.custName(row);
    case "custCode": return g.custCode(row);
    case "phone":    return g.phone(row);
    case "bills":    return g.bills(row);
    case "invNo":    return g.invNo(row);
    case "date":     return g.date(row);
    case "gross":    return g.gross(row);
    case "disc":     return g.disc(row);
    case "vat":      return g.vat(row);
    case "net":      return g.net(row);
    case "paid":     return g.paid(row);
    case "bal":      return g.bal(row);
    default:         return row[key];
  }
}

/* client-side totals (always match visible rows) */
function sumTotals(items, groupBy) {
  const t = { bills: 0, gross: 0, disc: 0, vat: 0, net: 0, paid: 0, bal: 0 };
  for (const r of items || []) {
    if (groupBy === "CUSTOMER") t.bills += g.bills(r);
    t.gross += g.gross(r);
    t.disc  += g.disc(r);
    t.vat   += g.vat(r);
    t.net   += g.net(r);
    t.paid  += g.paid(r);
    t.bal   += g.bal(r);
  }
  return t;
}

/* If API nests invoices inside customers, flatten them so Invoice view has real rows */
function normalizeToInvoiceRows(items) {
  const out = [];
  for (const row of items || []) {
    const packs = row.invoices || row.bills || row.documents || row.docs || row.rows;
    if (Array.isArray(packs) && packs.length) {
      for (const inv of packs) {
        out.push({
          ...inv,
          customerName: g.custName(row),
          customerCode: g.custCode(row),
          phone: g.phone(row),
        });
      }
    } else {
      out.push(row);
    }
  }
  return out;
}

/* printable HTML builder */
const escapeHtml = (s) =>
  String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

function buildPrintHTML({ filters, cols, rows, totals }) {
  const thead = `<tr>${cols.map(c => `<th style="text-align:${c.align || "left"}">${escapeHtml(c.label)}</th>`).join("")}</tr>`;
  const tbody = rows.length
    ? rows.map(r => {
        const tds = cols.map(c => {
          let v = getValue(r, c.key);
          if (c.key === "date" && v) v = toYMD(v);
          if (c.money) v = money(v);
          if (v == null || v === "") v = "-";
          return `<td style="text-align:${c.align || "left"}">${escapeHtml(v)}</td>`;
        }).join("");
        return `<tr>${tds}</tr>`;
      }).join("")
    : `<tr><td colspan="${cols.length}">No data</td></tr>`;

  const billsBox = filters.groupBy === "CUSTOMER" ? `<div class="box"><b>Bills:</b> ${totals.bills ?? 0}</div>` : "";

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Customer Report</title>
<style>
@page{margin:12mm}body{font-family:Arial,Helvetica,sans-serif;color:#000}
h1{margin:0 0 6px;font-size:18px}.meta{font-size:12px;margin:0 0 10px}
table{width:100%;border-collapse:collapse;font-size:12px}
th,td{border:1px solid #000;padding:4px 6px}
.summary{margin-top:10px;display:grid;grid-template-columns:repeat(6,1fr);gap:6px}
.box{border:1px solid #000;padding:6px}
</style></head>
<body>
  <h1>Customer Report</h1>
  <div class="meta">
    Date Range: ${filters.from} to ${filters.to}
    &nbsp; | &nbsp; Group By: ${escapeHtml(filters.groupBy)}
    &nbsp; | &nbsp; Printed: ${escapeHtml(new Date().toLocaleString())}
  </div>
  <table><thead>${thead}</thead><tbody>${tbody}</tbody></table>
  <div class="summary">
    ${billsBox}
    <div class="box"><b>Gross:</b> ${money(totals.gross)}</div>
    <div class="box"><b>Disc:</b> ${money(totals.disc)}</div>
    <div class="box"><b>VAT:</b> ${money(totals.vat)}</div>
    <div class="box"><b>Net:</b> ${money(totals.net)}</div>
    <div class="box"><b>Paid:</b> ${money(totals.paid)}</div>
    <div class="box"><b>Balance:</b> ${money(totals.bal)}</div>
  </div>
</body></html>`;
}

/* ========= component ========= */
export default function CustomerReport() {
  const navigate = useNavigate();

  const today = useMemo(() => toYMD(new Date()), []);
  const [filters, setFilters] = useState({
    from: today,
    to: today,
    customer: "",
    groupBy: "CUSTOMER",
    onlyBalance: false,
    sortBy: "",
    sortDir: "DESC",
    page: 0,
    size: 20,
  });

  const cols = useMemo(() => buildCols(filters.groupBy), [filters.groupBy]);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setField = (k, v) =>
    setFilters((f) => ({
      ...f,
      [k]: v,
      page: ["from","to","customer","groupBy","onlyBalance","size"].includes(k) ? 0 : f.page,
    }));

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get("/reports/customer", {
        params: {
          from: filters.from,
          to: filters.to,
          customer: filters.customer,
          groupBy: filters.groupBy,   // camelCase
          group_by: filters.groupBy,  // snake_case fallback
          balanceOnly: filters.onlyBalance ? 1 : 0,
          sortBy: filters.sortBy || undefined,
          sortDir: filters.sortDir,
          page: filters.page,
          size: filters.size,
        },
      });

      let items = data?.items ?? (Array.isArray(data) ? data : []);
      if (filters.groupBy === "INVOICE") items = normalizeToInvoiceRows(items);
      setRows(items);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Server error");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* client filters: prefix match & onlyBalance>0 (visible rows == totals) */
  const viewRows = useMemo(() => {
    let out = rows;
    const q = norm(filters.customer);
    if (q) out = out.filter((r) => [g.custName(r), g.custCode(r), g.phone(r)].some((v) => norm(v).startsWith(q)));
    if (filters.onlyBalance) out = out.filter((r) => g.bal(r) > 0);
    return out;
  }, [rows, filters.customer, filters.onlyBalance]);

  /* totals and count from visible rows */
  const viewTotals = useMemo(() => sumTotals(viewRows, filters.groupBy), [viewRows, filters.groupBy]);
  const viewCount  = viewRows.length;

  /* sorting (client-side so UI always matches) */
  const toggleSort = (key) => {
    setFilters((f) => {
      const nextDir = f.sortBy === key && f.sortDir === "ASC" ? "DESC" : "ASC";
      const sorted = [...viewRows].sort((a, b) => {
        let va = getValue(a, key), vb = getValue(b, key);
        if (key === "date") { va = va ? new Date(va).getTime() : 0; vb = vb ? new Date(vb).getTime() : 0; }
        else if (["gross","disc","vat","net","paid","bal","bills"].includes(key)) { va = num(va); vb = num(vb); }
        else { va = String(va ?? ""); vb = String(vb ?? ""); }
        return nextDir === "ASC" ? (va > vb ? 1 : va < vb ? -1 : 0) : (va < vb ? 1 : va > vb ? -1 : 0);
      });
      setRows(sorted);
      return { ...f, sortBy: key, sortDir: nextDir, page: 0 };
    });
  };
  const sortIndicator = (key) =>
    filters.sortBy === key ? <span className="cr-sort" aria-hidden>{filters.sortDir === "ASC" ? "▲" : "▼"}</span> : null;

  /* pager */
  const next = () => setFilters((f) => ({ ...f, page: f.page + 1 }));
  const prev = () => setFilters((f) => ({ ...f, page: Math.max(0, f.page - 1) }));

  /* export (visible rows) */
  const exportExcel = useCallback(async () => {
    try {
      const mod = await import("xlsx");
      const XLSX = mod?.default ?? mod;
      const sheetData = (viewRows ?? []).map((r) =>
        Object.fromEntries(
          cols.map((c) => {
            let v = getValue(r, c.key);
            if (c.key === "date" && v) v = toYMD(v);
            if (c.money) v = money(v);
            return [c.label, v ?? ""];
          })
        )
      );
      const ws = XLSX.utils.json_to_sheet(sheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Customer");
      XLSX.writeFile(wb, `Customer_Report_${filters.from}_${filters.to}_${filters.groupBy}.xlsx`);
    } catch (err) {
      console.error(err);
      setError(`Export failed: ${err.message}`);
    }
  }, [viewRows, cols, filters.from, filters.to, filters.groupBy]);

  /* print (visible rows) */
  const handlePrint = useCallback(() => {
    try {
      const html = buildPrintHTML({ filters, cols, rows: viewRows, totals: viewTotals });
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
    } catch (e) {
      console.error(e);
      setError("Print failed");
    }
  }, [filters, cols, viewRows, viewTotals]);

  return (
    <div className="cr-wrap customer-report-container">
      {/* Header */}
      <div className="cr-header">
        <div className="cr-left">
          <button className="cr-iconbtn" aria-label="Home" onClick={() => navigate("/dashboard")}><FaHome /></button>
          <h2 className="cr-title">Customer Report</h2>
        </div>
        <div className="cr-right no-print">
          <button className="cr-close" aria-label="Close" onClick={() => navigate("/reports")}><FaTimes /></button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="cr-toolbar no-print">
        <div className="cr-field">
          <label>From</label>
          <input type="date" value={filters.from} onChange={(e) => setField("from", e.target.value)} />
        </div>
        <div className="cr-field">
          <label>To</label>
          <input type="date" value={filters.to} onChange={(e) => setField("to", e.target.value)} />
        </div>
        <div className="cr-field grow">
          <label>Customer</label>
          <input
            placeholder="Name / Code / Phone (starts with)"
            value={filters.customer}
            onChange={(e) => setField("customer", e.target.value)}
          />
        </div>
        <div className="cr-field">
          <label>Group By</label>
          <select value={filters.groupBy} onChange={(e) => setField("groupBy", e.target.value)}>
            {GROUPS.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
          </select>
        </div>

        <div className="cr-field chk">
          <label className="inline">
            <input
              type="checkbox"
              checked={filters.onlyBalance}
              onChange={(e) => setField("onlyBalance", e.target.checked)}
            />
            Only balance &gt; 0
          </label>
        </div>

        <div className="cr-field">
          <label>Rows</label>
          <select value={filters.size} onChange={(e) => setField("size", Number(e.target.value))}>
            {[20, 50, 100].map((n) => <option key={n} value={n}>{n}/page</option>)}
          </select>
        </div>

        <div className="cr-actions">
          <button className="act run" onClick={fetchData}>Run</button>
          <button className="act export" onClick={exportExcel}>Export</button>
          <button className="act print" onClick={handlePrint}>Print</button>
        </div>
      </div>

      {error && <div className="cr-error">{error}</div>}

      {/* Table */}
      <div className="cr-card">
        {loading ? (
          <div className="cr-loading">Loading…</div>
        ) : (
          <div className="cr-tablewrap">
            <table className="cr-table">
              <thead>
                <tr>
                  {cols.map((c) => (
                    <th
                      key={c.key}
                      className="cr-th-sortable"
                      style={{ textAlign: c.align || "left" }}
                      onClick={() => toggleSort(c.key)}
                    >
                      <span className="cr-th-lbl">{c.label}</span>
                      {sortIndicator(c.key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {viewRows.length === 0 && (
                  <tr><td colSpan={cols.length} className="cr-empty">No data for selected filters</td></tr>
                )}
                {viewRows.map((r, i) => (
                  <tr key={i}>
                    {cols.map((c) => {
                      let v = getValue(r, c.key);
                      if (c.key === "date" && v) v = toYMD(v);
                      if (c.money) v = money(v);
                      return <td key={c.key} style={{ textAlign: c.align || "left" }}>{v ?? "-"}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Totals (from visible rows) */}
      <div className="cr-summary">
        {filters.groupBy === "CUSTOMER" && (
          <div className="box"><div className="k">Bills</div><div className="v">{viewTotals.bills ?? 0}</div></div>
        )}
        <div className="box"><div className="k">Gross</div><div className="v">{money(viewTotals.gross)}</div></div>
        <div className="box"><div className="k">Disc</div><div className="v">{money(viewTotals.disc)}</div></div>
        <div className="box"><div className="k">VAT</div><div className="v">{money(viewTotals.vat)}</div></div>
        <div className="box"><div className="k">Net</div><div className="v">{money(viewTotals.net)}</div></div>
        <div className="box"><div className="k">Paid</div><div className="v">{money(viewTotals.paid)}</div></div>
        <div className="box"><div className="k">Balance</div><div className="v">{money(viewTotals.bal)}</div></div>
      </div>

      {/* Pager */}
      <div className="cr-pager">
        <button onClick={prev} disabled={filters.page === 0}>Prev</button>
        <span>Page {filters.page + 1}</span>
        <button onClick={next} disabled={(filters.page + 1) * filters.size >= viewCount}>Next</button>
      </div>
    </div>
  );
}
