// src/components/Analytics.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, Rectangle
} from "recharts";
import "./Analytics.css";

/* ---------- config ---------- */
const PERIODS = ["daily", "weekly", "monthly"];
const API_BASE =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8080/api/analytics";
const HOME_PATH = "/dashboard";
const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

/* ---------- default date range: first day of current month -> today ---------- */
const _today = new Date();
const _yyyy  = _today.getFullYear();
const _mm    = String(_today.getMonth() + 1).padStart(2, "0");
const _dd    = String(_today.getDate()).padStart(2, "0");
const FIRST_OF_MONTH = `${_yyyy}-${_mm}-01`;
const TODAY_STR      = `${_yyyy}-${_mm}-${_dd}`;

/* ---------- helpers ---------- */
const currency = (n) =>
  n == null ? "--" : `AED ${Number(n).toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;

const buildUrl = (path, params) => {
  const url = new URL(path.replace(/^\//, ""), `${API_BASE}/`);
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v != null && v !== "") url.searchParams.set(k, v);
  });
  return url.toString();
};

async function getJSON(url, signal) {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      msg = data?.message || data?.error || msg;
    } catch {
      try { msg = await res.text(); } catch {}
    }
    throw new Error(msg);
  }
  return res.json();
}

/* ---------- optional demo fallbacks (so UI still shows while wiring) ---------- */
const DEMO_SERIES = [
  { label: "Sun", sales: 1200, purchase: 800 },
  { label: "Mon", sales:  700, purchase: 950 },
  { label: "Tue", sales: 1100, purchase: 600 },
  { label: "Wed", sales:  500, purchase: 500 },
  { label: "Thu", sales: 1400, purchase: 900 },
  { label: "Fri", sales:  850, purchase: 700 },
  { label: "Sat", sales: 1600, purchase: 1000 },
];
const DEMO_TOP = [
  { name: "Milk 1L", qty: 420 },
  { name: "Bread", qty: 320 },
  { name: "Eggs 12pc", qty: 280 },
  { name: "Rice 5kg", qty: 240 },
  { name: "Tea 200g", qty: 200 },
];
const DEMO_INV = [
  { no: "INV-1008", date: "2025-09-20", customer: "Walk-in", amount: 245.6, status: "PAID" },
  { no: "INV-1007", date: "2025-09-20", customer: "Hassan", amount: 129.0, status: "PAID" },
  { no: "INV-1006", date: "2025-09-19", customer: "Reem",   amount: 95.5,  status: "DUE"  },
];

/* ---------- component ---------- */
export default function Analytics() {
  // filters
  const [period, setPeriod] = useState("daily");
  const [from, setFrom] = useState(FIRST_OF_MONTH); // yyyy-mm-dd
  const [to,   setTo]   = useState(TODAY_STR);      // yyyy-mm-dd

  // data
  const [summary, setSummary] = useState({
    grossSales: null, purchase: null, profit: null,
    customers: null, avgBill: null, vat: null,
  });
  const [series, setSeries] = useState([]);           // [{label,sales,purchase}]
  const [topProducts, setTopProducts] = useState([]); // [{name, qty}]
  const [invoices, setInvoices] = useState([]);       // recent

  // ui
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState("idle"); // idle | ok | error
  const [error, setError] = useState("");

  const validRange = useMemo(() => Boolean(from && to && from <= to), [from, to]);

  const load = useCallback(() => {
    if (!validRange) {
      setApiStatus("idle");
      setError("");
      setSummary({ grossSales: null, purchase: null, profit: null, customers: null, avgBill: null, vat: null });
      setSeries(DEMO_SERIES);
      setTopProducts(DEMO_TOP);
      setInvoices(DEMO_INV);
      return;
    }

    const ctrl = new AbortController();
    const params = { period, from, to };

    (async () => {
      setLoading(true);
      setError("");
      try {
        const [sum, svp, tops, inv] = await Promise.all([
          getJSON(buildUrl("summary", params), ctrl.signal),
          getJSON(buildUrl("series/sales-vs-purchase", params), ctrl.signal),
          getJSON(buildUrl("top-products", { ...params, limit: 5 }), ctrl.signal),
          getJSON(buildUrl("recent-invoices", { from, to, limit: 10 }), ctrl.signal),
        ]);

        setSummary({
          grossSales: sum?.grossSales ?? 0,
          purchase:  sum?.purchase   ?? 0,
          profit:    sum?.profit     ?? 0,
          customers: sum?.customers  ?? 0,
          avgBill:   sum?.avgBill    ?? 0,
          vat:       sum?.vat        ?? 0,
        });

        setSeries(Array.isArray(svp) && svp.length ? svp : DEMO_SERIES);
        setTopProducts(
          (Array.isArray(tops) && tops.length ? tops : DEMO_TOP).map(t => ({
            name: t.name, qty: t.qty ?? t.value ?? 0,
          }))
        );
        setInvoices(Array.isArray(inv) && inv.length ? inv : DEMO_INV);

        setApiStatus("ok");
      } catch (e) {
        if (e.name !== "AbortError") {
          setApiStatus("error");
          setError(e.message || "Failed to fetch analytics.");
          setSeries(DEMO_SERIES);
          setTopProducts(DEMO_TOP);
          setInvoices(DEMO_INV);
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [period, from, to, validRange]);

  useEffect(() => load(), [load]);

  const goHome = () => window.location.assign(HOME_PATH);

  return (
    <div className="ana">
      {/* header */}
      <div className="ana-head">
        <div className="left">
          <button className="icon-btn" title="Dashboard" onClick={goHome}>🏠</button>
          <h1>Analytics</h1>
          <span className={`badge ${apiStatus}`}>
            <i /> {apiStatus === "ok" ? "API connected" : apiStatus === "error" ? "API error" : "—"}
          </span>
        </div>

        <div className="right">
          <div className="pill-group">
            {PERIODS.map((p) => (
              <button
                key={p}
                className={`pill ${period === p ? "is-active" : ""}`}
                onClick={() => setPeriod(p)}
                disabled={loading}
              >
                {p[0].toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          <div className="range">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <span>–</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
      </div>

      {!validRange && <div className="alert">Pick a valid date range to load analytics.</div>}
      {error && validRange && <div className="alert">{error}</div>}

      {/* KPI row */}
      <section className={`kpi-row ${loading ? "is-loading" : ""}`}>
        <KPI title="Gross Sales" value={currency(summary.grossSales)} />
        <KPI title="Purchase"   value={currency(summary.purchase)} />
        <KPI title="Profit"     value={currency(summary.profit)} />
        <KPI title="Customers"  value={summary.customers ?? "--"} />
        <KPI title="Avg. Bill"  value={currency(summary.avgBill)} />
        <KPI title="VAT"        value={currency(summary.vat)} />
      </section>

      {/* Charts */}
      <section className="charts-row">
        <div className="chart-box">
          <div className="chart-title">Sales vs. Purchase</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={series} margin={{ top: 8, right: 16, left: 8, bottom: 0 }} barCategoryGap={16}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="purchase" name="Purchase" fill="#10B981" barSize={28}
                   shape={<Rectangle radius={[10,10,0,0]} />} />
              <Bar dataKey="sales" name="Sales" fill="#4F46E5" barSize={28}
                   shape={<Rectangle radius={[10,10,0,0]} />} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <div className="chart-title">Top Products</div>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={topProducts}
                dataKey="qty"
                cx="50%" cy="50%"
                innerRadius={70} outerRadius={110}
                label
              >
                {topProducts.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Invoices table */}
      <section className="table-card">
        <div className="card-head">
          <div className="chart-title">Recent Invoices</div>
        </div>
        <div className="table-wrap">
          {invoices.length === 0 ? (
            <div className="empty-table">No invoices yet.</div>
          ) : (
            <table className="ana-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th className="right">Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((r, idx) => (
                  <tr key={r.no ?? idx}>
                    <td>{r.no}</td>
                    <td>{r.date}</td>
                    <td>{r.customer}</td>
                    <td className="right">{currency(r.amount)}</td>
                    <td>
                      <span className={`status ${String(r.status || "").toLowerCase()}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

/* ---------- tiny components ---------- */
function KPI({ title, value }) {
  return (
    <div className="kpi-card">
      <div className="kpi-value">{value}</div>
      <div className="kpi-title">{title}</div>
    </div>
  );
}
