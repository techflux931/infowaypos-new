import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./PurchaseList.css";

const API = process.env.REACT_APP_API || "http://localhost:8080/api";
const money = (n) =>
  Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function PurchaseList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("All");

  // Load (API → local fallback)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/purchases`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) setRows(Array.isArray(json) ? json : []);
      } catch {
        const local = JSON.parse(localStorage.getItem("purchases") || "[]");
        if (!cancelled) setRows(Array.isArray(local) ? local : []);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const getRowDate = useCallback((r) => {
    const iso = r?.orderDate || (typeof r?.date === "string" ? r.date.slice(0, 10) : "");
    return iso || "";
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const supplier = (r.supplierQuery || r.supplier?.name || "").toLowerCase();
      if (q && !supplier.includes(q)) return false;
      if (paymentFilter !== "All" && (r.paymentTerms || "") !== paymentFilter) return false;
      const d = getRowDate(r);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [rows, search, paymentFilter, from, to, getRowDate]);

  const totalAED = useMemo(
    () => filtered.reduce((s, r) => s + Number(r.totals?.grandTotal ?? r.grandTotal ?? 0), 0),
    [filtered]
  );

  const handleView = useCallback(
    (row) => {
      sessionStorage.setItem("purchaseForPrint", JSON.stringify(row));
      const id = row?.id || row?._id || row?.orderNo || "";
      if (id) sessionStorage.setItem("purchaseForPrintId", String(id));
      navigate("/total-purchase/purchase/a4");
    },
    [navigate]
  );

  const rowKey = (r, i) => r?.id || r?._id || `${r?.orderNo || "row"}-${i}`;

  return (
    <div className="page">
      <div className="list-header">
        <div className="title">
          <button
            type="button"
            className="home-btn"
            aria-label="Go to dashboard"
            title="Dashboard"
            onClick={() => navigate("/dashboard")}
          >
            🏠
          </button>
          <h2>PURCHASE LIST</h2>
        </div>

        <div className="header-actions">
          <button
            className="btn primary"
            onClick={() => navigate("/total-purchase/purchase/add")}
          >
            + Add Purchase
          </button>
          <button
            className="icon-btn close"
            aria-label="Close"
            title="Back to Total Purchase"
            onClick={() => navigate("/total-purchase")}
          >
            ×
          </button>
        </div>
      </div>

      <div className="filters" role="region" aria-label="Filters">
        <input
          className="input"
          placeholder="Search by Supplier Name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          className="input"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          aria-label="From date"
        />
        <input
          className="input"
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          aria-label="To date"
        />
        <select
          className="input"
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          aria-label="Payment terms"
        >
          <option>All</option>
          <option>Payment On Receipt</option>
          <option>Net 7</option>
          <option>Net 15</option>
          <option>Net 30</option>
        </select>
      </div>

      <div className="table-top">
        <div>Total Purchases: {filtered.length}</div>
        <div>
          <strong>Total AED: {money(totalAED)}</strong>
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: "6%" }}>#</th>
              <th style={{ width: "14%" }}>PO No</th>
              <th style={{ width: "14%" }}>Date</th>
              <th>Supplier</th>
              <th style={{ width: "18%" }}>Payment Terms</th>
              <th style={{ width: "16%" }}>Total (AED)</th>
              <th style={{ width: "12%" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td className="empty" colSpan={7}>
                  No purchases yet.
                </td>
              </tr>
            ) : (
              filtered.map((r, i) => (
                <tr key={rowKey(r, i)}>
                  <td>{i + 1}</td>
                  <td>{r.orderNo || r.poNo || "-"}</td>
                  <td>{getRowDate(r) || "-"}</td>
                  <td>{r.supplierQuery || r.supplier?.name || "-"}</td>
                  <td>{r.paymentTerms || "-"}</td>
                  <td className="num">
                    {money(r.totals?.grandTotal ?? r.grandTotal ?? 0)}
                  </td>
                  <td>
                    <button className="btn tiny" onClick={() => handleView(r)}>
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
