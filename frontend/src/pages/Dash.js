// src/pages/Dash.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FaCog } from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Rectangle,
} from "recharts";
import "./Dash.css";

/* ---------- assets ---------- */
import infowaysLogo from "../assets/logo.png";
import productIcon from "../assets/product.png";
import billingIcon from "../assets/barcode.png";
import customerIcon from "../assets/customer.png";
import reportsIcon from "../assets/reports.png";
import analyticsIcon from "../assets/analytics.png";
import totalPurchaseIcon from "../assets/totalpurchase.png";
import accountsIcon from "../assets/accounts.png";
import dealsIcon from "../assets/Deals.png";
import salesIcon from "../assets/Sales.png";
import companyIcon from "../assets/company.png";
import developerIcon from "../assets/developer.png";
import poleScaleIcon from "../assets/polescale.png";

/* ---------- axios instance (baseURL -> http://localhost:8080/api) ---------- */
import api from "../api/axios";

/* ---------- helpers ---------- */
const normalizeRole = (r) => {
  const x = String(r || "").trim().toLowerCase();
  if (x === "admin") return "Admin";
  if (x === "developer" || x === "dev") return "Developer";
  if (x === "cashier" || x === "client") return "Cashier";
  return "";
};

const money = (n) =>
  n == null
    ? "0.00"
    : Number(n).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

/* ---------- demo fallbacks (used only if API is empty/unavailable) ---------- */
const DEMO_WEEKLY = [
  { date: "2025-09-14", Sales: 1200, Purchase: 800 },
  { date: "2025-09-15", Sales: 700, Purchase: 950 },
  { date: "2025-09-16", Sales: 1100, Purchase: 600 },
  { date: "2025-09-17", Sales: 500, Purchase: 500 },
  { date: "2025-09-18", Sales: 1400, Purchase: 900 },
  { date: "2025-09-19", Sales: 850, Purchase: 700 },
  { date: "2025-09-20", Sales: 1600, Purchase: 1000 },
];

const DEMO_TOP = [
  { name: "Milk 1L", value: 420 },
  { name: "Bread", value: 320 },
  { name: "Eggs 12pc", value: 280 },
  { name: "Rice 5kg", value: 240 },
  { name: "Tea 200g", value: 200 },
];

const PIE_COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export default function Dash() {
  const navigate = useNavigate();
  const role = normalizeRole(localStorage.getItem("userRole"));

  const [showLogout, setShowLogout] = useState(false);
  const [loading, setLoading] = useState(true);

  const [metrics, setMetrics] = useState({
    sales: 0,
    purchases: 0,
    salesReturns: 0,
    purchaseReturns: 0,
    todayTotalSales: 0,
    todayReceivedSales: 0,
    todayTotalPurchases: 0,
    todayTotalExpenses: 0,
  });
  const [weekly, setWeekly] = useState(DEMO_WEEKLY);
  const [topProducts, setTopProducts] = useState(DEMO_TOP);

  /* redirect cashiers straight to POS */
  useEffect(() => {
    if (role === "Cashier") navigate("/pos", { replace: true });
  }, [role, navigate]);

  const fetchDashboard = useCallback(async (signal) => {
    setLoading(true);
    try {
      const [m, w, p] = await Promise.all([
        api.get("/dashboard/metrics", { signal }),
        api.get("/dashboard/weekly", { params: { days: 7 }, signal }),
        api.get("/dashboard/top-products", { params: { limit: 5 }, signal }),
      ]);

      setMetrics(m?.data ?? {});

      const weeklyRows = (w?.data ?? []).map((d) => ({
        date: d.date,
        Sales: Number(d.sales ?? 0),
        Purchase: Number(d.purchase ?? 0),
      }));

      setWeekly(
        weeklyRows.length && weeklyRows.some((r) => r.Sales || r.Purchase)
          ? weeklyRows
          : DEMO_WEEKLY
      );

      const top = Array.isArray(p?.data) ? p.data : [];
      setTopProducts(top.length ? top : DEMO_TOP);
    } catch (err) {
      if (err?.name !== "CanceledError") {
        // fall back silently to demo data; keep UI responsive
        // console.warn("Dashboard fetch failed:", err);
        setWeekly(DEMO_WEEKLY);
        setTopProducts(DEMO_TOP);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchDashboard(controller.signal);
    return () => controller.abort();
  }, [fetchDashboard]);

  const tiles = useMemo(() => {
    const base = [
      { label: "COMPANY CREATION", icon: companyIcon, path: "/company" },
      { label: "POS", icon: billingIcon, path: "/pos" },
      { label: "PRODUCT MASTER", icon: productIcon, path: "/products" },
      { label: "CUSTOMER ENTRY", icon: customerIcon, path: "/customers" },
      { label: "DEALS", icon: dealsIcon, path: "/deals" },
      { label: "SALES", icon: salesIcon, path: "/sales" },
      { label: "TOTAL PURCHASE", icon: totalPurchaseIcon, path: "/total-purchase" },
      { label: "REPORTS", icon: reportsIcon, path: "/reports" },
      {
        label: "ANALYTICS",
        icon: analyticsIcon,
        path: "/analytics",
        subtext: "DAILY | WEEKLY | MONTHLY",
      },
      { label: "ACCOUNTS", icon: accountsIcon, path: "/accounts" },
      { label: "POLE SCALE LABEL", icon: poleScaleIcon, path: "/pole-scale-label" },
    ];
    if (role === "Developer") {
      base.push({
        label: "DEVELOPER SETTINGS",
        icon: developerIcon,
        path: "/developer",
      });
    }
    return base;
  }, [role]);

  const kpiCards = [
    { key: "sales", label: "Sales", color: "#4F46E5" },
    { key: "purchases", label: "Purchases", color: "#059669" },
    { key: "salesReturns", label: "Sales Returns", color: "#3B82F6" },
    { key: "purchaseReturns", label: "Purchase Returns", color: "#F59E0B" },
    { key: "todayTotalSales", label: "Today Total Sales", color: "#8B5CF6" },
    { key: "todayReceivedSales", label: "Today Received (Sales)", color: "#EC4899" },
    { key: "todayTotalPurchases", label: "Today Total Purchases", color: "#10B981" },
    { key: "todayTotalExpenses", label: "Today Total Expenses", color: "#EF4444" },
  ];

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("username");
    navigate("/", { replace: true });
  };

  return (
    <div className="dash-shell">
      <header className="dash-header">
        <img src={infowaysLogo} alt="Infoways logo" className="dash-logo" />
        <h1 className="dash-title">INFOWAYS POS</h1>
        <div className="action-buttons">
          {(role === "Admin" || role === "Developer") && (
            <button
              type="button"
              className="icon-btn"
              onClick={() => navigate("/settings")}
              aria-label="Open settings"
              title="Settings"
            >
              <FaCog size={20} />
            </button>
          )}
          <button
            type="button"
            className="icon-btn"
            onClick={() => setShowLogout(true)}
            aria-label="Logout"
            title="Logout"
          >
            🔒 Logout
          </button>
        </div>
      </header>

      <main className="dash-main">
        {role !== "Cashier" && (
          <section className="section section-tiles">
            <div className="dash-grid">
              {tiles.map((t) => (
                <button
                  key={t.label}
                  className="dash-tile"
                  onClick={() => navigate(t.path)}
                  type="button"
                  aria-label={t.label}
                  title={t.label}
                >
                  <img src={t.icon} alt="" className="tile-icon" />
                  <div className="tile-label">{t.label}</div>
                  {t.subtext && <div className="tile-subtext">{t.subtext}</div>}
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="section section-kpis">
          <div className={`metrics-row${loading ? " is-loading" : ""}`}>
            {kpiCards.map((m) => (
              <div
                key={m.key}
                className="metric-card"
                style={{ borderTopColor: m.color }}
              >
                <div className="metric-value">{money(metrics[m.key])}</div>
                <div className="metric-label">{m.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="section section-charts">
          <div className="charts-row">
            <div className="chart-box">
              <h3>This Week Sales &amp; Purchase</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={weekly}
                  margin={{ top: 8, right: 16, left: 4, bottom: 0 }}
                  barCategoryGap={16}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" minTickGap={12} />
                  <YAxis width={60} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="Purchase"
                    name="Purchase"
                    fill="#10B981"
                    barSize={28}
                    shape={<Rectangle radius={[10, 10, 0, 0]} />}
                  />
                  <Bar
                    dataKey="Sales"
                    name="Sales"
                    fill="#4F46E5"
                    barSize={28}
                    shape={<Rectangle radius={[10, 10, 0, 0]} />}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-box">
              <h3>Top Selling Products</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={topProducts}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    label
                  >
                    {topProducts.map((_, i) => (
                      <Cell key={String(i)} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </main>

      {showLogout && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="confirm-box">
            <p>Do you want to logout?</p>
            <div className="confirm-buttons">
              <button className="btn yes-btn" onClick={logout} type="button">
                ✅ Yes
              </button>
              <button
                className="btn no-btn"
                onClick={() => setShowLogout(false)}
                type="button"
              >
                ❌ No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
