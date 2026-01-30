// src/components/PurchaseForm.js
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { translateProductName } from "../utils/translateProductName"; // <-- use your JSON dictionary
import "./PurchaseForm.css";

/* ---------- helpers ---------- */
const API = process.env.REACT_APP_API || "http://localhost:8080/api";
const todayISO = () => new Date().toISOString().slice(0, 10);
const n = (v) =>
  v === "" || v === null || v === undefined ? 0 : Number(v) || 0;
const money = (x) =>
  `AED ${Number(x || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/* fresh editable row */
const newRow = () => ({
  enName: "",
  arName: "",
  desc: "",
  qty: 1,
  rate: "",
  taxPct: 0,
  discount: "",
  discountType: "AED", // "AED" | "%"
  editing: true,
  autoAr: true, // while true we keep auto-filling Arabic from EN
});

export default function PurchaseForm() {
  const navigate = useNavigate();

  // Bill From
  const [supplierQuery, setSupplierQuery] = useState("");
  const [supplierDetails, setSupplierDetails] = useState("");
  const [warehouse, setWarehouse] = useState("Main WareHouse");

  // Purchase Order meta
  const [orderNo, setOrderNo] = useState("");
  const [reference, setReference] = useState("");
  const [orderDate, setOrderDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState(todayISO());
  const [taxMode, setTaxMode] = useState("Off"); // Off | On (Add to Rate)
  const [discountMode, setDiscountMode] = useState("% Discount After TAX");
  const [poNotes, setPoNotes] = useState("");

  // Items
  const [rows, setRows] = useState([newRow()]);
  const updateRow = (i, patch) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = () => setRows((prev) => [...prev, newRow()]);
  const removeRow = (i) =>
    setRows((prev) => (prev.length === 1 ? [newRow()] : prev.filter((_, idx) => idx !== i)));
  const cloneRow = (i) =>
    setRows((prev) => [
      ...prev.slice(0, i + 1),
      { ...prev[i], editing: true },
      ...prev.slice(i + 1),
    ]);
  const saveRow = (i) => updateRow(i, { editing: false });
  const editRow = (i) => updateRow(i, { editing: true });

  // When EN changes: auto-fill AR from dictionary while autoAr is true
  const onEn = (i, val) =>
    setRows((prev) =>
      prev.map((r, idx) =>
        idx !== i
          ? r
          : {
              ...r,
              enName: val,
              arName: r.autoAr ? translateProductName(val) : r.arName,
            }
      )
    );

  // When AR is manually changed: keep the typed value and stop auto-fill for this row
  const onAr = (i, val) => updateRow(i, { arName: val, autoAr: false });

  // Footer / totals
  const [shipping, setShipping] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Payment On Receipt");
  const [updateStock, setUpdateStock] = useState(true);

  /** full math with per-line discount type */
  const computed = useMemo(() => {
    let subTotal = 0,
      totalTax = 0,
      totalDiscount = 0;

    rows.forEach((r) => {
      const qty = Math.max(0, n(r.qty));
      const rate = Math.max(0, n(r.rate));
      const line = qty * rate;

      // discount
      const dVal = Math.max(0, n(r.discount));
      const lineDisc = r.discountType === "%" ? (line * dVal) / 100 : dVal;

      // tax
      const taxableBase = line - lineDisc; // discount reduces taxable base
      const taxAmt =
        taxMode === "Off" ? 0 : (taxableBase * Math.max(0, n(r.taxPct))) / 100;

      subTotal += line;
      totalDiscount += Math.min(line, lineDisc);
      totalTax += taxAmt;
    });

    const ship = Math.max(0, n(shipping));
    const grand = subTotal - totalDiscount + totalTax + ship;
    return { subTotal, totalDiscount, totalTax, ship, grand };
  }, [rows, taxMode, shipping]);

  /** POST to backend; fall back to localStorage if API not reachable */
  const onSave = async () => {
    const payload = {
      supplierQuery,
      supplierDetails,
      warehouse,
      orderNo,
      reference,
      orderDate,
      dueDate,
      taxMode,
      discountMode,
      notes: poNotes,
      paymentTerms,
      updateStock,
      items: rows.map((r) => {
        const qty = Math.max(0, n(r.qty));
        const rate = Math.max(0, n(r.rate));
        const line = qty * rate;
        const dVal = Math.max(0, n(r.discount));
        const lineDisc = r.discountType === "%" ? (line * dVal) / 100 : dVal;
        const taxAmt =
          taxMode === "Off" ? 0 : ((line - lineDisc) * Math.max(0, n(r.taxPct))) / 100;

        const nameEn = (r.enName || "").trim();
        // Final guard: if AR is empty, attempt one more translation at save time
        const nameAr = (r.arName || translateProductName(nameEn) || nameEn).trim();

        return {
          nameEn,
          nameAr,
          description: (r.desc || "").trim(),
          qty,
          rate,
          taxPct: n(r.taxPct),
          discountType: r.discountType,
          discount: dVal,
          lineAmount: line,
          lineDiscount: Math.min(line, lineDisc),
          lineTax: taxAmt,
          lineTotal: line - Math.min(line, lineDisc) + taxAmt,
        };
      }),
      totals: {
        subTotal: computed.subTotal,
        totalDiscount: computed.totalDiscount,
        totalTax: computed.totalTax,
        shipping: computed.ship,
        grandTotal: computed.grand,
      },
    };

    try {
      const res = await fetch(`${API}/purchases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await res.json();
      navigate("/total-purchase/purchase");
    } catch (e) {
      console.warn("Backend down, keeping locally. Reason:", e.message);
      const local = JSON.parse(localStorage.getItem("purchases") || "[]");
      local.push({ id: Date.now().toString(), ...payload });
      localStorage.setItem("purchases", JSON.stringify(local));
      navigate("/total-purchase/purchase");
    }
  };

  return (
    <div className="pf-page">
      {/* header */}
      <div className="pf-header">
        <div className="pf-breadcrumbs">
          <button className="pf-link" onClick={() => navigate("/dashboard")}>
            Dashboard
          </button>
          <span>›</span>
          <button
            className="pf-link"
            onClick={() => navigate("/total-purchase/purchase")}
          >
            Purchases
          </button>
        </div>
        <div className="pf-header-actions">
          <button className="pf-btn ghost" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button className="pf-btn primary" onClick={onSave}>
            Generate Order
          </button>
        </div>
      </div>

      {/* top panels */}
      <div className="pf-top">
        {/* left - bill from */}
        <section className="pf-card">
          <div className="pf-card-title">
            <span>Bill From</span>
            <button
              className="pf-btn tiny"
              type="button"
              onClick={() => alert("Open supplier modal…")}
            >
              + Add Supplier
            </button>
          </div>

          <label className="pf-field">
            <span className="pf-label">Search Supplier</span>
            <input
              className="pf-input"
              placeholder="Enter Supplier Name or Mobile Number to search"
              value={supplierQuery}
              onChange={(e) => setSupplierQuery(e.target.value)}
            />
          </label>

          <label className="pf-field">
            <span className="pf-label">Supplier Details</span>
            <textarea
              className="pf-input"
              rows={3}
              placeholder="Optional notes about supplier, TRN, address…"
              value={supplierDetails}
              onChange={(e) => setSupplierDetails(e.target.value)}
            />
          </label>

          <label className="pf-field">
            <span className="pf-label">Warehouse</span>
            <select
              className="pf-input"
              value={warehouse}
              onChange={(e) => setWarehouse(e.target.value)}
            >
              <option>Main WareHouse</option>
              <option>Branch – Airport Road</option>
              <option>Branch – City Center</option>
            </select>
          </label>
        </section>

        {/* right - meta */}
        <section className="pf-card">
          <div className="pf-card-title">Purchase Order</div>
          <div className="pf-two">
            <label className="pf-field">
              <span className="pf-label">Order No</span>
              <input
                className="pf-input"
                placeholder="Auto / Manual"
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
              />
            </label>
            <label className="pf-field">
              <span className="pf-label">Reference</span>
              <input
                className="pf-input"
                placeholder="Reference #"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </label>
            <label className="pf-field">
              <span className="pf-label">Order Date</span>
              <input
                className="pf-input"
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
              />
            </label>
            <label className="pf-field">
              <span className="pf-label">Order Due Date</span>
              <input
                className="pf-input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </label>
            <label className="pf-field">
              <span className="pf-label">Tax</span>
              <select
                className="pf-input"
                value={taxMode}
                onChange={(e) => setTaxMode(e.target.value)}
              >
                <option>Off</option>
                <option>On (Add to Rate)</option>
              </select>
            </label>
            <label className="pf-field">
              <span className="pf-label">Discount</span>
              <select
                className="pf-input"
                value={discountMode}
                onChange={(e) => setDiscountMode(e.target.value)}
              >
                <option>% Discount After TAX</option>
                <option>% Discount Before TAX</option>
                <option>Flat Amount</option>
              </select>
            </label>
          </div>

          <label className="pf-field">
            <span className="pf-label">Notes</span>
            <textarea
              className="pf-input"
              rows={2}
              value={poNotes}
              onChange={(e) => setPoNotes(e.target.value)}
            />
          </label>
        </section>
      </div>

      {/* items table */}
      <section className="pf-card">
        <div className="pf-table-wrap">
          <table className="pf-table">
            <thead>
              <tr>
                <th style={{ width: "18%" }}>Item (EN)</th>
                <th style={{ width: "16%" }}>Item (AR)</th>
                <th style={{ width: "20%" }}>Description</th>
                <th style={{ width: "8%" }}>Qty</th>
                <th style={{ width: "10%" }}>Rate</th>
                <th style={{ width: "8%" }}>Tax(%)</th>
                <th style={{ width: "10%" }}>Tax</th>
                <th style={{ width: "12%" }}>Discount</th>
                <th style={{ width: "12%" }}>Amount</th>
                <th style={{ width: "6%" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const disabled = !r.editing;
                const qty = Math.max(0, n(r.qty));
                const rate = Math.max(0, n(r.rate));
                const line = qty * rate;
                const dVal = Math.max(0, n(r.discount));
                const lineDisc = r.discountType === "%" ? (line * dVal) / 100 : dVal;
                const taxAmt =
                  taxMode === "Off"
                    ? 0
                    : ((line - lineDisc) * Math.max(0, n(r.taxPct))) / 100;
                const total = line - Math.min(line, lineDisc) + taxAmt;

                return (
                  <tr key={i}>
                    <td>
                      <input
                        className="pf-input"
                        placeholder="English name"
                        value={r.enName}
                        onChange={(e) => onEn(i, e.target.value)}
                        disabled={disabled}
                      />
                    </td>
                    <td>
                      <input
                        className="pf-input"
                        dir="rtl"
                        placeholder="الاسم بالعربية"
                        value={r.arName}
                        onChange={(e) => onAr(i, e.target.value)}
                        disabled={disabled}
                      />
                    </td>
                    <td>
                      <textarea
                        className="pf-input pf-input--sm"
                        placeholder="Optional description"
                        value={r.desc}
                        onChange={(e) => updateRow(i, { desc: e.target.value })}
                        disabled={disabled}
                      />
                    </td>
                    <td>
                      <input
                        className="pf-input"
                        type="number"
                        min="0"
                        step="1"
                        value={r.qty}
                        onChange={(e) => updateRow(i, { qty: e.target.value })}
                        disabled={disabled}
                      />
                    </td>
                    <td>
                      <input
                        className="pf-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={r.rate}
                        onChange={(e) => updateRow(i, { rate: e.target.value })}
                        disabled={disabled}
                      />
                    </td>
                    <td>
                      <input
                        className="pf-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={r.taxPct}
                        onChange={(e) => updateRow(i, { taxPct: e.target.value })}
                        disabled={disabled}
                      />
                    </td>
                    <td className="pf-num">{money(taxAmt)}</td>
                    <td>
                      <div className="pf-inline">
                        <select
                          className="pf-input"
                          style={{ width: 90 }}
                          value={r.discountType}
                          onChange={(e) =>
                            updateRow(i, { discountType: e.target.value })
                          }
                          disabled={disabled}
                        >
                          <option value="AED">AED</option>
                          <option value="%">%</option>
                        </select>
                        <input
                          className="pf-input"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder={r.discountType}
                          value={r.discount}
                          onChange={(e) =>
                            updateRow(i, { discount: e.target.value })
                          }
                          disabled={disabled}
                        />
                      </div>
                    </td>
                    <td className="pf-num">{money(total)}</td>
                    <td className="pf-actions">
                      {r.editing ? (
                        <>
                          <button
                            className="pf-btn tiny success"
                            onClick={() => saveRow(i)}
                            title="Save row"
                          >
                            💾
                          </button>
                          <button
                            className="pf-btn tiny"
                            onClick={() => cloneRow(i)}
                            title="Duplicate row"
                          >
                            📄
                          </button>
                          <button
                            className="pf-btn tiny danger"
                            onClick={() => removeRow(i)}
                            title="Delete row"
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="pf-btn tiny"
                            onClick={() => editRow(i)}
                            title="Edit row"
                          >
                            ✏️
                          </button>
                          <button
                            className="pf-btn tiny"
                            onClick={() => cloneRow(i)}
                            title="Duplicate row"
                          >
                            📄
                          </button>
                          <button
                            className="pf-btn tiny danger"
                            onClick={() => removeRow(i)}
                            title="Delete row"
                          >
                            ✕
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="pf-row-actions">
          <button className="pf-btn add" onClick={addRow}>
            ⊕ Add Row
          </button>
        </div>
      </section>

      {/* totals row */}
      <div className="pf-bottom">
        <section className="pf-card">
          <div className="pf-two">
            <label className="pf-field">
              <span className="pf-label">Payment Terms</span>
              <select
                className="pf-input"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
              >
                <option>Payment On Receipt</option>
                <option>Net 7</option>
                <option>Net 15</option>
                <option>Net 30</option>
              </select>
            </label>
            <div className="pf-field">
              <span className="pf-label">Update Stock</span>
              <div className="pf-radio-row">
                <label>
                  <input
                    type="radio"
                    checked={updateStock}
                    onChange={() => setUpdateStock(true)}
                  />{" "}
                  <span>Yes</span>
                </label>
                <label>
                  <input
                    type="radio"
                    checked={!updateStock}
                    onChange={() => setUpdateStock(false)}
                  />{" "}
                  <span>No</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        <section className="pf-card pf-card--totals">
          <div className="pf-totals">
            <div>
              <span>Total Tax</span>
              <strong>{money(computed.totalTax)}</strong>
            </div>
            <div>
              <span>Total Discount</span>
              <strong>{money(computed.totalDiscount)}</strong>
            </div>
            <div className="pf-ship">
              <label className="pf-field">
                <span className="pf-label">Shipping</span>
                <input
                  className="pf-input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Value"
                  value={shipping}
                  onChange={(e) => setShipping(e.target.value)}
                />
                <small>Tax AED 0</small>
              </label>
            </div>
            <div className="pf-grand">
              <span>Grand Total (AED)</span>
              <input
                className="pf-input"
                readOnly
                value={computed.grand.toFixed(2)}
              />
            </div>
          </div>
        </section>
      </div>

      {/* footer */}
      <div className="pf-footer">
        <button className="pf-btn ghost" onClick={() => navigate(-1)}>
          Close
        </button>
        <button className="pf-btn primary" onClick={onSave}>
          Generate Order
        </button>
      </div>
    </div>
  );
}
