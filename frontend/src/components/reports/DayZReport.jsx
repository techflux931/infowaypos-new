import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaTimes } from "react-icons/fa";
import axios from "../../api/axios";
import "./DayZReport.css";

/* ---------- utils ---------- */
const AED_FMT = new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED" });
const money = (v) => AED_FMT.format(Number(v || 0));
const toYMD = (d) => {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d);
  const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};
const toHM = (d) => {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};
const n = (v) => Number(v || 0);

/* tolerant getters (DISCOUNT REMOVED) */
const g = {
  time:    (r) => r.time ?? r.createdAt ?? r.date ?? null,
  billNo:  (r) => r.invoiceNo ?? r.billNo ?? r.invNo ?? r.reference ?? "",
  cashier: (r) => r.cashier ?? r.user ?? r.employee ?? "",
  gross:   (r) => n(r.grossTotal ?? r.gross ?? r.total),
  vat:     (r) => n(r.vat ?? r.tax),
  net:     (r) => n(r.netTotal ?? r.net ?? r.totalNet),
  cash:    (r) => n(r.cash ?? r.cashAmount),
  card:    (r) => n(r.card ?? r.cardAmount),
  credit:  (r) => n(r.credit ?? r.onAccount ?? r.creditAmount),
  returns: (r) => n(r.returns ?? r.returnAmount),

  // totals / meta
  bills:    (t) => Number(t?.bills ?? t?.billCount ?? 0),
  opening:  (t) => n(t?.openingFloat ?? t?.opening),
  cashIn:   (t) => n(t?.cashIn ?? t?.paidIn),
  cashOut:  (t) => n(t?.cashOut ?? t?.paidOut),
  expected: (t) => n(t?.expectedCash ?? t?.expected),
  counted:  (t) => n(t?.countedCash ?? t?.counted),
  variance: (t) => n(t?.variance ?? (g.counted(t) - g.expected(t))),
  zNo:      (m) => m?.zNo ?? m?.zNumber ?? "",
  closedAt: (m) => m?.closedAt ?? m?.zClosedAt ?? null,
};

/* columns for the bills table (DISCOUNT REMOVED) */
const COLS = [
  { key: "time",   label: "TIME" },
  { key: "billNo", label: "BILL #" },
  { key: "cashier",label: "CASHIER" },
  { key: "gross",  label: "GROSS",  align: "right", money: true },
  { key: "vat",    label: "VAT",    align: "right", money: true },
  { key: "net",    label: "NET",    align: "right", money: true },
  { key: "cash",   label: "CASH",   align: "right", money: true },
  { key: "card",   label: "CARD",   align: "right", money: true },
  { key: "credit", label: "CREDIT", align: "right", money: true },
  { key: "returns",label: "RETURNS",align: "right", money: true },
];

export default function DayZReport() {
  const navigate = useNavigate();
  const today = useMemo(() => toYMD(new Date()), []);

  const [filters, setFilters] = useState({
    date: today,
    shift: "",
    reportType: "DAY", // DAY | X | Z
    sortBy: "time",
    sortDir: "ASC",
    page: 0,
    size: 20,
  });

  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({});
  const [shiftBox, setShiftBox] = useState(null);
  const [zMeta, setZMeta] = useState(null);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setField = (k, v) =>
    setFilters((f) => ({
      ...f,
      [k]: v,
      page: ["date", "shift", "reportType", "size"].includes(k) ? 0 : f.page,
    }));

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // BACKEND expects from/to (your controller has: dayz(from,to))
      const { data } = await axios.get("/reports/dayz", {
        params: {
          from: filters.date,   // send both as same day
          to: filters.date,
          shift: filters.shift,
          type: filters.reportType, // DAY | X | Z
          sortBy: filters.sortBy,
          sortDir: filters.sortDir,
          page: filters.page,
          size: filters.size,
        },
      });

      const items = data?.items ?? data?.bills ?? data ?? [];
      setRows(items);

      setTotals({
        bills:  g.bills(data?.totals ?? data),
        gross:  n(data?.totals?.grossTotal ?? data?.grossTotal),
        vat:    n(data?.totals?.vat        ?? data?.vat),
        net:    n(data?.totals?.netTotal   ?? data?.netTotal),
        cash:   n(data?.totals?.cash       ?? data?.cash),
        card:   n(data?.totals?.card       ?? data?.card),
        credit: n(data?.totals?.credit     ?? data?.credit),
        returns:n(data?.totals?.returns    ?? data?.returns),
      });

      setShiftBox(data?.shiftBox ?? data?.cashBox ?? null);
      setZMeta(data?.zInfo ?? data?.zMeta ?? null);

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
  const toggleSort = (key) =>
    setFilters((f) =>
      f.sortBy !== key
        ? { ...f, sortBy: key, sortDir: "ASC", page: 0 }
        : { ...f, sortDir: f.sortDir === "ASC" ? "DESC" : "ASC", page: 0 }
    );
  const sortIndicator = (key) =>
    filters.sortBy === key ? (
      <span className="dzr-sort">{filters.sortDir === "ASC" ? "▲" : "▼"}</span>
    ) : null;

  /* pager */
  const next = () => setFilters((f) => ({ ...f, page: f.page + 1 }));
  const prev = () => setFilters((f) => ({ ...f, page: Math.max(0, f.page - 1) }));

  /* export (DISCOUNT REMOVED) */
  const exportExcel = useCallback(async () => {
    try {
      const mod = await import("xlsx");
      const XLSX = mod?.default ?? mod;

      const sheetData =
        rows?.map((r) =>
          Object.fromEntries(
            COLS.map((c) => {
              let v;
              switch (c.key) {
                case "time":    v = g.time(r) ? `${toYMD(g.time(r))} ${toHM(g.time(r))}` : ""; break;
                case "billNo":  v = g.billNo(r); break;
                case "cashier": v = g.cashier(r); break;
                case "gross":   v = g.gross(r); break;
                case "vat":     v = g.vat(r); break;
                case "net":     v = g.net(r); break;
                case "cash":    v = g.cash(r); break;
                case "card":    v = g.card(r); break;
                case "credit":  v = g.credit(r); break;
                case "returns": v = g.returns(r); break;
                default:        v = r[c.key];
              }
              if (c.money) v = money(v);
              return [c.label, v ?? ""];
            })
          )
        ) ?? [];

      const ws = XLSX.utils.json_to_sheet(sheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `${filters.reportType}_Bills`);
      XLSX.writeFile(
        wb,
        `DayZ_${filters.date}_${filters.shift || "ALL"}_${filters.reportType}.xlsx`
      );
    } catch (err) {
      console.error(err);
      setError(`Export failed: ${err.message}`);
    }
  }, [rows, filters]);

  return (
    <div className="dzr-wrap">
      {/* Header */}
      <div className="dzr-header">
        <div className="dzr-left">
          <button className="dzr-iconbtn" aria-label="Home" onClick={() => navigate("/dashboard")}>
            <FaHome />
          </button>
          <h2 className="dzr-title">Day Report / Z Report</h2>
        </div>
        <div className="dzr-right">
          <button className="dzr-close" aria-label="Close" onClick={() => navigate("/reports")}>
            <FaTimes />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="dzr-toolbar">
        <div className="dzr-field">
          <label>Date</label>
          <input type="date" value={filters.date} onChange={(e) => setField("date", e.target.value)} />
        </div>
        <div className="dzr-field">
          <label>Shift</label>
          <select value={filters.shift} onChange={(e) => setField("shift", e.target.value)}>
            <option value="">All</option>
            <option value="A">A</option>
            <option value="B">B</option>
          </select>
        </div>
        <div className="dzr-field">
          <label>Report Type</label>
          <select value={filters.reportType} onChange={(e) => setField("reportType", e.target.value)}>
            <option value="DAY">Day</option>
            <option value="X">X Report</option>
            <option value="Z">Z Report</option>
          </select>
        </div>
        <div className="dzr-field">
          <label>Rows</label>
          <select value={filters.size} onChange={(e) => setField("size", Number(e.target.value))}>
            {[20, 50, 100].map((n) => (
              <option key={n} value={n}>{n}/page</option>
            ))}
          </select>
        </div>
        <div className="dzr-actions">
          <button className="act run" onClick={fetchData}>Run</button>
          <button className="act export" onClick={exportExcel}>Export</button>
          <button className="act print" onClick={() => window.print()}>Print</button>
        </div>
      </div>

      {error && <div className="dzr-error">{error}</div>}

      {/* Meta badges */}
      {(filters.reportType === "Z" && (g.zNo(zMeta) || g.closedAt(zMeta))) && (
        <div className="dzr-meta">
          {g.zNo(zMeta) && <span className="pill">Z No: <strong>{g.zNo(zMeta)}</strong></span>}
          {g.closedAt(zMeta) && <span className="pill">Closed: <strong>{toYMD(g.closedAt(zMeta))} {toHM(g.closedAt(zMeta))}</strong></span>}
        </div>
      )}

      {shiftBox && (
        <div className="dzr-cashbox">
          <div className="card"><div className="k">Opening</div><div className="v">{money(g.opening(shiftBox))}</div></div>
          <div className="card"><div className="k">Cash-In</div><div className="v">{money(g.cashIn(shiftBox))}</div></div>
          <div className="card"><div className="k">Cash-Out</div><div className="v">{money(g.cashOut(shiftBox))}</div></div>
          <div className="card"><div className="k">Expected</div><div className="v">{money(g.expected(shiftBox))}</div></div>
          <div className="card"><div className="k">Counted</div><div className="v">{money(g.counted(shiftBox))}</div></div>
          <div className={`card ${g.variance(shiftBox) !== 0 ? "warn" : ""}`}>
            <div className="k">Variance</div><div className="v">{money(g.variance(shiftBox))}</div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="dzr-card">
        {loading ? (
          <div className="dzr-loading">Loading…</div>
        ) : (
          <div className="dzr-tablewrap">
            <table className="dzr-table">
              <thead>
                <tr>
                  {COLS.map((c) => (
                    <th
                      key={c.key}
                      className="dzr-th-sortable"
                      style={{ textAlign: c.align || "left" }}
                      onClick={() => toggleSort(c.key)}
                    >
                      <span className="dzr-th-lbl">{c.label}</span>
                      {sortIndicator(c.key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={COLS.length} className="dzr-empty">No data for selected filters</td>
                  </tr>
                )}
                {rows.map((r, i) => (
                  <tr key={i}>
                    {COLS.map((c) => {
                      let v;
                      switch (c.key) {
                        case "time":    v = g.time(r) ? toHM(g.time(r)) : ""; break;
                        case "billNo":  v = g.billNo(r); break;
                        case "cashier": v = g.cashier(r); break;
                        case "gross":   v = g.gross(r); break;
                        case "vat":     v = g.vat(r); break;
                        case "net":     v = g.net(r); break;
                        case "cash":    v = g.cash(r); break;
                        case "card":    v = g.card(r); break;
                        case "credit":  v = g.credit(r); break;
                        case "returns": v = g.returns(r); break;
                        default:        v = r[c.key];
                      }
                      if (c.money) v = money(v);
                      return (
                        <td key={c.key} style={{ textAlign: c.align || "left" }}>{v ?? "-"}</td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Totals (DISCOUNT REMOVED) */}
      <div className="dzr-summary">
        <div className="box"><div className="k">Bills</div>   <div className="v">{totals.bills ?? 0}</div></div>
        <div className="box"><div className="k">Gross</div>   <div className="v">{money(totals.gross)}</div></div>
        <div className="box"><div className="k">VAT</div>     <div className="v">{money(totals.vat)}</div></div>
        <div className="box"><div className="k">Net</div>     <div className="v">{money(totals.net)}</div></div>
        <div className="box"><div className="k">Cash</div>    <div className="v">{money(totals.cash)}</div></div>
        <div className="box"><div className="k">Card</div>    <div className="v">{money(totals.card)}</div></div>
        <div className="box"><div className="k">Credit</div>  <div className="v">{money(totals.credit)}</div></div>
        <div className="box"><div className="k">Returns</div> <div className="v">{money(totals.returns)}</div></div>
      </div>

      {/* Pager */}
      <div className="dzr-pager">
        <button onClick={prev} disabled={filters.page === 0}>Prev</button>
        <span>Page {filters.page + 1}</span>
        <button onClick={next} disabled={(filters.page + 1) * filters.size >= count}>Next</button>
      </div>
    </div>
  );
}
