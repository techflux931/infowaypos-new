// src/components/ViewSales.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import CalendarModal from "./CalendarModal";
import "./ViewSales.css";
import { FaSearch, FaPrint, FaEdit, FaTrashAlt, FaCopy, FaTimes } from "react-icons/fa";

const API_URL = "http://localhost:8080/api/sales";

/* ---------------- utils ---------------- */

const ddmmyyyyToISO = (s) => {
  if (!s) return "";
  const [dd, mm, yyyy] = s.split("/");
  return dd && mm && yyyy ? `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}` : "";
};

function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** open 80mm thermal receipt in a popup and auto-print */
function openPrintWindow(sale) {
  const items = Array.isArray(sale.items) ? sale.items : [];
  const dateStr = sale.date ? new Date(sale.date).toLocaleString() : "";

  const rows = items
    .map((it, i) => {
      const qty = Number(it.qty ?? it.quantity ?? 0);
      const rate = Number(it.unitPrice ?? it.price ?? 0);
      const line = Number(it.amount ?? rate * qty);
      const nameEn = (it.name ?? it.nameEn ?? it.productCode ?? "").toString();
      const nameAr = (it.nameAr ?? "").toString();
      return `
        <tr>
          <td class="c">${i + 1}</td>
          <td class="itemcell">
            <div class="row">
              <span class="en">${nameEn}</span>
              ${nameAr ? `<span class="ar" dir="rtl">${nameAr}</span>` : ""}
            </div>
          </td>
          <td class="c">${qty}</td>
          <td class="r">${rate.toFixed(2)}</td>
          <td class="r">${line.toFixed(2)}</td>
        </tr>
      `;
    })
    .join("");

  const gross = Number(sale.grossTotal ?? 0);
  const disc = Number(sale.discount ?? 0);
  const vat = Number(sale.vat ?? 0);
  const net = Number(sale.netTotal ?? gross - disc + vat);

  const html = `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Invoice ${sale.invoiceNo || sale.id || ""}</title>
<style>
  @page { size: 80mm auto; margin: 4mm; }
  @media print { html,body { width: 80mm; } }

  body { font: 12px/1.35 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu, "Helvetica Neue", Arial; color:#000; }
  .head { text-align:center; }
  .head h2 { margin: 0 0 4px; font-size: 16px; }
  .muted { color:#555; font-size: 11px; }

  table { width:100%; border-collapse:collapse; table-layout: fixed; }
  th, td { padding:2px 0; vertical-align: top; }
  th { border-top:1px dashed #000; border-bottom:1px dashed #000; text-align:left; }

  th.no    { width: 20px;  text-align:center; }
  th.qty   { width: 36px;  text-align:center; }
  th.rate  { width: 48px;  text-align:right; }
  th.total { width: 58px;  text-align:right; }

  td.c { text-align:center; }
  td.r { text-align:right; }

  .itemcell .row { display:flex; justify-content:space-between; gap:8px; }
  .itemcell .en  { font-weight:600; }
  .itemcell .ar  { font-size: 11px; text-align:right; max-width: 55%; }

  .sum { border-top:1px dashed #000; margin-top:6px; padding-top:6px; }
  .sum p { display:flex; justify-content:space-between; margin:2px 0; }
  .big { font-weight:700; font-size:14px; }
  .thanks { text-align:center; margin-top:8px; }
</style>
</head>
<body>
  <div class="head">
    <h2>INFOWAYS BAQALA</h2>
    <div class="muted">Street 1, Abu Dhabi, UAE • TRN 12002000000</div>
    <div class="muted">Cashier: ${sale.cashier || "-"}</div>
    <div class="muted">Invoice: ${sale.invoiceNo || sale.id || "-"} • ${dateStr}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th class="no c">#</th>
        <th>Item</th>
        <th class="qty c">Qty</th>
        <th class="rate r">Rate</th>
        <th class="total r">Total</th>
      </tr>
    </thead>
    <tbody>
      ${rows || `<tr><td colspan="5" class="c">No items</td></tr>`}
    </tbody>
  </table>

  <div class="sum">
    <p><span>Subtotal</span><span>${gross.toFixed(2)}</span></p>
    <p><span>Discount</span><span>${disc.toFixed(2)}</span></p>
    ${vat ? `<p><span>VAT</span><span>${vat.toFixed(2)}</span></p>` : ""}
    <p class="big"><span>Net Total</span><span>${net.toFixed(2)}</span></p>
    <p><span>Payment</span><span>${String(sale.paymentType || "").toUpperCase()}</span></p>
  </div>

  <div class="thanks">*** THANK YOU! VISIT AGAIN ***</div>
  <script>window.onload = () => setTimeout(() => { window.print(); window.close(); }, 200);</script>
</body>
</html>`;

  const w = window.open("", "_blank", "width=380,height=700");
  if (!w) return alert("Popup blocked. Please allow popups to print.");
  w.document.open();
  w.document.write(html);
  w.document.close();
}

/* --------------- component --------------- */

const ViewSales = ({ onClose, isAdmin = false }) => {
  // filters
  const [q, setQ] = useState("");
  const [customer, setCustomer] = useState("");
  const [typeFilter, setTypeFilter] = useState(""); // '', 'cash', 'card', 'credit'
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // ui/data
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [selIndex, setSelIndex] = useState(null);

  // cancel in-flight requests
  const abortRef = useRef(null);
  const qDeb = useDebounced(q);
  const customerDeb = useDebounced(customer);

  const openCalendar = (field) => {
    setCalendarTarget(field);
    setShowCalendar(true);
  };
  const handleDateSelect = (date) => {
    const formatted = new Date(date).toLocaleDateString("en-GB"); // DD/MM/YYYY
    if (calendarTarget === "from") setFromDate(formatted);
    if (calendarTarget === "to") setToDate(formatted);
    setShowCalendar(false);
  };

  // build API query
  const queryParams = useMemo(() => {
    const p = {};
    if (qDeb.trim()) p.q = qDeb.trim();
    if (customerDeb.trim()) p.customer = customerDeb.trim();
    if (typeFilter) p.type = typeFilter.trim();
    const f = ddmmyyyyToISO(fromDate);
    const t = ddmmyyyyToISO(toDate);
    if (f) p.from = f;
    if (t) p.to = t;
    return p;
  }, [qDeb, customerDeb, typeFilter, fromDate, toDate]);

  // map API rows to table rows
  const normalize = (list) =>
    (list || []).map((s, i) => {
      const dt = s.date ? new Date(s.date) : null;
      const amount = Number(s.netTotal ?? s.netAmount ?? s.total ?? 0) || 0;
      return {
        no: i + 1,
        id: s.id ?? s.invoiceId ?? s.invoiceNo ?? String(i + 1),
        date: dt ? dt.toLocaleDateString("en-GB") : "",
        invoice: s.invoiceNo || s.number || String(s.id ?? ""),
        customer: s.customerName || s.customer || "—",
        type: String(s.paymentType ?? s.type ?? s.saleType ?? "").toLowerCase(),
        amount,
      };
    });

  const fetchSales = useCallback(async () => {
    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const res = await axios.get(API_URL, { params: queryParams, signal: controller.signal });
      const data = Array.isArray(res.data) ? res.data : res.data?.content ?? [];
      setRows(normalize(data));
      setSelIndex(null);
    } catch (e) {
      if (e.name !== "CanceledError" && e.message !== "canceled") {
        console.warn("ViewSales fetch failed:", e?.message || e);
        setRows([]);
        setSelIndex(null);
      }
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    fetchSales();
    return () => abortRef.current?.abort?.();
  }, [fetchSales]);

  const selected = selIndex != null ? rows[selIndex] : null;

  // get full sale + print
  const handlePrint = async (row) => {
    try {
      const id = row?.id || selected?.id;
      if (!id) return alert("Select a row first.");
      const { data } = await axios.get(`${API_URL}/${encodeURIComponent(id)}`);
      openPrintWindow(data || {});
    } catch (e) {
      console.error("Print failed:", e);
      alert("Failed to load invoice to print.");
    }
  };

  const onEdit = () =>
    !selected
      ? alert("Select a row first.")
      : alert(`Edit flow for invoice ${selected.invoice} (hook your modal/API).`);

  const onDelete = async () => {
    if (!selected) return alert("Select a row first.");
    if (!isAdmin)  return alert("Delete is admin-only.");
    if (!window.confirm(`Delete invoice ${selected.invoice}?`)) return;
    // await axios.delete(`${API_URL}/${encodeURIComponent(selected.id)}`);
    alert("Call DELETE /api/sales/{id} here.");
  };

  const onCopy = async () => {
    if (!selected) return alert("Select a row first.");
    try {
      await navigator.clipboard.writeText(JSON.stringify(selected, null, 2));
      alert("Copied row JSON to clipboard.");
    } catch {
      alert("Copy failed.");
    }
  };

  return (
    <div className="view-sales-modal" role="dialog" aria-modal="true" aria-label="View Sales">
      <div className="view-sales-header-green">
        <h2>VIEW SALES</h2>
        <button className="close-button" onClick={onClose} aria-label="Close">
          <FaTimes />
        </button>
      </div>

      {/* Filters */}
      <div className="view-sales-filters">
        <label className="label">Search</label>

        <div className="search-group">
          <FaSearch className="search-icon" aria-hidden />
          <input
            type="text"
            placeholder="Invoice / any text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <input
          className="name-input"
          type="text"
          placeholder="Customer name"
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
        />

        <select
          className="type-input"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label="Payment Type"
        >
          <option value="">All Types</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="credit">Credit</option>
        </select>

        <button className="date-btn" onClick={() => openCalendar("from")}>Date From</button>
        <button className="date-btn" onClick={() => openCalendar("to")}>Date To</button>
      </div>

      {/* Selected date chips */}
      <div className="date-chips">
        {fromDate && <span className="chip">From: {fromDate}</span>}
        {toDate && <span className="chip">To: {toDate}</span>}
      </div>

      {/* Table */}
      <table className="sales-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Date</th>
            <th>Invoice No</th>
            <th>Customer</th>
            <th>Type</th>
            <th>Net Amount</th>
            <th>Print</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={7} style={{ textAlign: "center" }}>Loading…</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={7} style={{ textAlign: "center" }}>No sales found</td></tr>
          ) : (
            rows.map((r, i) => (
              <tr
                key={`${r.id}-${i}`}
                className={selIndex === i ? "selected" : ""}
                onClick={() => setSelIndex(i)}
                onDoubleClick={() => handlePrint(r)}
              >
                <td>{r.no}</td>
                <td>{r.date}</td>
                <td>{r.invoice}</td>
                <td>{r.customer}</td>
                <td style={{ textTransform: "capitalize" }}>{r.type || "—"}</td>
                <td>{r.amount.toFixed(2)}</td>
                <td>
                  <FaPrint
                    className="print-icon"
                    role="button"
                    title="Reprint"
                    onClick={(e) => { e.stopPropagation(); handlePrint(r); }}
                    aria-label="Print Invoice"
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="view-sales-divider" />

      <div className="view-sales-actions">
        <button className="reprint-btn" onClick={() => handlePrint()} disabled={!selected}>
          <FaPrint /> Reprint
        </button>
        <button className="edit-btn" onClick={onEdit} disabled={!selected}>
          <FaEdit /> Edit
        </button>

        {isAdmin && (
          <button className="delete-btn" onClick={onDelete} disabled={!selected}>
            <FaTrashAlt /> Delete
          </button>
        )}

        <button className="copy-btn" onClick={onCopy} disabled={!selected}>
          <FaCopy /> Copy
        </button>
      </div>

      {showCalendar && (
        <CalendarModal onClose={() => setShowCalendar(false)} onSelect={handleDateSelect} />
      )}
    </div>
  );
};

ViewSales.propTypes = {
  onClose: PropTypes.func.isRequired,
  isAdmin: PropTypes.bool,
};

export default ViewSales;
