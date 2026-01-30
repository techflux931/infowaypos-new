import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./VatSummaryReport.css";

/* ------------ helpers ------------ */
const API_BASE =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8080/api";

const todayISO = () => new Date().toISOString().slice(0, 10);
const toISO = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

const AED = (n) =>
  `AED ${Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const GROUPS = [
  { value: "day", label: "Day" },
  { value: "month", label: "Month" },
  { value: "invoice", label: "Invoice" },
];

const PAGE_SIZES = [20, 50, 100];

export default function VatSummaryReport() {
  const navigate = useNavigate();

  // filters
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(todayISO());
  const [groupBy, setGroupBy] = useState("day");
  const [pageSize, setPageSize] = useState(20);

  // data/paging
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);         // 1-based for UI
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const printRef = useRef(null);

  const totals = useMemo(() => {
    return rows.reduce(
      (a, r) => ({
        bills: a.bills + Number(r.bills || 0),
        taxable: a.taxable + Number(r.taxable || 0),
        vat: a.vat + Number(r.vat || 0),
        total: a.total + Number(r.total || 0),
      }),
      { bills: 0, taxable: 0, vat: 0, total: 0 }
    );
  }, [rows]);

  async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  const run = async (requestedPage = 1) => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({
        from: toISO(from),
        to: toISO(to),
        groupBy,
        page: String(requestedPage - 1), // backend zero-based
        size: String(pageSize),
      });
      const data = await fetchJSON(
        `${API_BASE}/reports/vat-summary?${qs.toString()}`
      );
      setRows(Array.isArray(data?.content) ? data.content : []);
      setPage(Number(data?.page ?? requestedPage));
      setTotalPages(Number(data?.totalPages ?? 1));
    } catch (e) {
      setRows([]);
      setPage(1);
      setTotalPages(1);
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ["Date", "Bills", "Taxable", "VAT", "Total"];
    const lines = [
      headers.join(","),
      ...rows.map((r) =>
        [
          `"${r.date ?? ""}"`,
          r.bills ?? 0,
          (r.taxable ?? 0).toFixed(2),
          (r.vat ?? 0).toFixed(2),
          (r.total ?? 0).toFixed(2),
        ].join(",")
      ),
      "",
      `,,${(totals.taxable || 0).toFixed(2)},${(totals.vat || 0).toFixed(
        2
      )},${(totals.total || 0).toFixed(2)}`,
    ].join("\n");

    const blob = new Blob([lines], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `VAT_Summary_Report_${from}_to_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const print = () => {
    const w = window.open("", "_blank", "width=900,height=600");
    if (!w) return;
    const html = `
      <html>
        <head>
          <title>VAT Summary Report</title>
          <style>
            body{font-family:Segoe UI,Tahoma,Arial,sans-serif;color:#222;margin:24px}
            h2{margin:0 0 16px 0}
            .muted{color:#666;font-size:12px;margin-bottom:12px}
            table{width:100%;border-collapse:collapse}
            th,td{border:1px solid #e9e5ff;padding:8px 10px;font-size:13px}
            th{background:#f7f6ff;text-transform:uppercase;color:#6b46ff;letter-spacing:.02em}
            .cards{display:flex;gap:16px;margin-top:16px}
            .card{flex:1;border:1px solid #eee;border-radius:12px;padding:12px}
            .label{font-size:12px;color:#666}
            .value{font-size:18px;font-weight:700;margin-top:6px}
          </style>
        </head>
        <body>
          <h2>VAT Summary Report</h2>
          <div class="muted">From ${from} To ${to} • Grouped by ${GROUPS.find(g=>g.value===groupBy)?.label || groupBy}</div>
          ${printRef.current?.innerHTML || ""}
          <script>window.print();</script>
        </body>
      </html>`;
    w.document.open(); w.document.write(html); w.document.close();
  };

  useEffect(() => {
    run(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="vat-wrap">
      {/* header */}
      <div className="vat-header">
        <div className="left">
          <button
            className="icon-btn"
            title="Home"
            aria-label="Home"
            onClick={() => navigate("/dashboard")}
          >
            🏠
          </button>
          <h1>VAT Summary Report</h1>
        </div>
        <div className="right">
          <button
            className="icon-btn close"
            title="Close"
            aria-label="Close"
            onClick={() => navigate(-1)}
          >
            ✕
          </button>
        </div>
      </div>

      {/* filters */}
      <div className="vat-filters">
        <div className="field">
          <label>From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="field">
          <label>To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="field">
          <label>Group By</label>
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
            {GROUPS.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Rows</label>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>{n}/page</option>
            ))}
          </select>
        </div>

        <div className="actions">
          <button className="btn run" onClick={() => run(1)} disabled={loading}>
            {loading ? "Running..." : "Run"}
          </button>
          <button className="btn export" onClick={exportCSV} disabled={!rows.length}>
            Export
          </button>
          <button className="btn print" onClick={print} disabled={!rows.length}>
            Print
          </button>
        </div>
      </div>

      {/* printable zone */}
      <div ref={printRef}>
        <div className="vat-table">
          <div className="thead">
            <div className="th">DATE</div>
            <div className="th num">BILLS</div>
            <div className="th num">TAXABLE</div>
            <div className="th num">VAT</div>
            <div className="th num">TOTAL</div>
          </div>

          {error && <div className="error">⚠ {error}</div>}
          {!error && rows.length === 0 && (
            <div className="nodata">No data for selected filters</div>
          )}

          {!!rows.length && (
            <div className="tbody">
              {rows.map((r, i) => (
                <div key={`${r.date}-${i}`} className="tr">
                  <div className="td">{r.date}</div>
                  <div className="td num">{r.bills ?? 0}</div>
                  <div className="td num">{AED(r.taxable)}</div>
                  <div className="td num">{AED(r.vat)}</div>
                  <div className="td num">{AED(r.total)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* totals cards */}
        <div className="vat-cards">
          <div className="card">
            <div className="label">Taxable</div>
            <div className="value">{AED(totals.taxable)}</div>
          </div>
          <div className="card">
            <div className="label">VAT</div>
            <div className="value">{AED(totals.vat)}</div>
          </div>
          <div className="card">
            <div className="label">Total</div>
            <div className="value">{AED(totals.total)}</div>
          </div>
        </div>
      </div>

      {/* pager */}
      <div className="pager">
        <button className="pg-btn" disabled={page <= 1} onClick={() => run(page - 1)}>
          Prev
        </button>
        <span className="pg-info">Page {page}</span>
        <button className="pg-btn" disabled={page >= totalPages} onClick={() => run(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
