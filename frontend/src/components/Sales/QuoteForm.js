// src/components/Sales/QuoteForm.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import "./QuoteForm.css";
import QuoteList from "./QuoteList";

const n = (v) => (Number.isFinite(parseFloat(v)) ? parseFloat(v) : 0);

const emptyItem = () => ({ itemCode: "", description: "", qty: "", price: "", tax: "" });

const initialQuote = {
  quoteNumber: "",
  quoteDate: "",
  validTill: "",
  customerId: "",
  customerName: "",
  trn: "",
  subject: "",
  notes: "",
  paymentTerms: "AS AGREED",
  deliveryTerms: "AS AGREED",
  discount: 0,
};

export default function QuoteForm() {
  const navigate = useNavigate();
  const [showList, setShowList] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [quote, setQuote] = useState(initialQuote);
  const [items, setItems] = useState([emptyItem()]);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("/customers");
        setCustomers(res.data || []);
      } catch (err) {
        console.error("Customer fetch error", err);
      }
    })();
  }, []);

  /* ---------- handlers ---------- */
  const handleCustomerChange = (e) => {
    const sel = customers.find((c) => c.id === e.target.value);
    if (!sel) return;
    setQuote((q) => ({
      ...q,
      customerId: sel.id,
      customerName: sel.name,
      trn: sel.trn || "",
    }));
  };

  const handleItemChange = (i, field, value) => {
    setItems((rows) => {
      const next = [...rows];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  const addRow = () => setItems((rows) => [...rows, emptyItem()]);
  const removeRow = (i) => setItems((rows) => rows.filter((_, idx) => idx !== i));

  // One-row math: tax% (blank => 5)
  const calcRow = (r) => {
    const qty = n(r.qty);
    const price = n(r.price);
    const taxPct = r.tax === "" || Number.isNaN(parseFloat(r.tax)) ? 5 : n(r.tax);
    const sub = qty * price;
    const tax = sub * (taxPct / 100);
    return { sub, tax, total: sub + tax };
  };

  /* ---------- totals ---------- */
  const subtotal = useMemo(
    () => items.reduce((sum, r) => sum + calcRow(r).sub, 0),
    [items]
  );
  const totalTax = useMemo(
    () => items.reduce((sum, r) => sum + calcRow(r).tax, 0),
    [items]
  );
  const grandTotal = useMemo(
    () => subtotal + totalTax - n(quote.discount),
    [subtotal, totalTax, quote.discount]
  );

  const handleSubmit = async () => {
    try {
      const payload = {
        ...quote,
        items: items.map((r) => ({
          itemCode: r.itemCode,
          description: r.description,
          qty: n(r.qty),
          price: n(r.price),
          // backend defaults to 5% if 0; keep your previous behavior
          tax: r.tax === "" ? 0 : n(r.tax) || 0,
        })),
      };
      await axios.post("/quotes", payload);
      alert("Quote saved!");
      // optional reset after save:
      // setQuote(initialQuote); setItems([emptyItem()]);
    } catch (err) {
      console.error("Save error", err);
      alert("Failed to save quote");
    }
  };

  const handleCancel = () =>
    window.confirm("Cancel this quote?") && navigate("/sales");

  /* ---------- UI ---------- */
  return (
    <div className="quote-form-container">
      <div className="quote-form-header">
        <button className="home-btn" onClick={() => navigate("/dashboard")}>🏠</button>
        <h2>Create Sales Quote</h2>
        <button className="viewall-btn" onClick={() => setShowList((s) => !s)}>📋 View All</button>
        <button className="close-btn" style={{ marginLeft: 16 }} onClick={() => navigate("/sales")}>X</button>
      </div>

      {showList ? (
        <div className="quote-list-inline">
          {/* Key bit: clicking "Add New Quote" in the list returns here */}
          <QuoteList onAddNew={() => setShowList(false)} />
        </div>
      ) : (
        <>
          <div className="quote-details">
            <input
              placeholder="Quote Number"
              value={quote.quoteNumber}
              onChange={(e) => setQuote({ ...quote, quoteNumber: e.target.value })}
            />
            <input
              type="date"
              value={quote.quoteDate}
              onChange={(e) => setQuote({ ...quote, quoteDate: e.target.value })}
            />
            <input
              type="date"
              value={quote.validTill}
              onChange={(e) => setQuote({ ...quote, validTill: e.target.value })}
              placeholder="Valid Until"
            />
            <select onChange={handleCustomerChange} value={quote.customerId}>
              <option value="">Select Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input value={quote.trn} placeholder="TRN Number" readOnly />
            <input
              placeholder="Subject"
              value={quote.subject}
              onChange={(e) => setQuote({ ...quote, subject: e.target.value })}
            />
            <textarea
              placeholder="Notes"
              value={quote.notes}
              onChange={(e) => setQuote({ ...quote, notes: e.target.value })}
            />
          </div>

          <table className="quote-table">
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Tax %</th>
                <th>Total</th>
                <th>🗑️</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row, i) => {
                const { total } = calcRow(row);
                return (
                  <tr key={i}>
                    <td>
                      <input
                        value={row.itemCode}
                        onChange={(e) => handleItemChange(i, "itemCode", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        value={row.description}
                        onChange={(e) => handleItemChange(i, "description", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.qty}
                        onChange={(e) => handleItemChange(i, "qty", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.price}
                        onChange={(e) => handleItemChange(i, "price", e.target.value)}
                      />
                    </td>
                    <td title="Leave blank for 5%">
                      <input
                        type="number"
                        value={row.tax}
                        onChange={(e) => handleItemChange(i, "tax", e.target.value)}
                      />
                    </td>
                    <td>{total.toFixed(2)}</td>
                    <td>
                      <button className="delete-btn" onClick={() => removeRow(i)}>🗑️</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <button className="add-row-btn" onClick={addRow}>+ Add Row</button>

          <div className="quote-footer-terms">
            <div className="payment-terms">
              <label>Payment Terms:</label>
              <select
                value={quote.paymentTerms}
                onChange={(e) => setQuote({ ...quote, paymentTerms: e.target.value })}
              >
                <option>AS AGREED</option>
                <option>CASH ON DELIVERY</option>
                <option>7 DAYS</option>
                <option>14 DAYS</option>
                <option>30 DAYS</option>
                <option>45 DAYS</option>
                <option>60 DAYS</option>
                <option>90 DAYS</option>
                <option>120 DAYS</option>
                <option>BILL TO BILL</option>
              </select>
            </div>
            <div className="delivery-terms">
              <label>Delivery Terms:</label>
              <select
                value={quote.deliveryTerms}
                onChange={(e) => setQuote({ ...quote, deliveryTerms: e.target.value })}
              >
                <option>AS AGREED</option>
                <option>ASAP</option>
                <option>WITHIN A DAY</option>
                <option>WITHIN 2 DAYS</option>
                <option>WITHIN 4 DAYS</option>
                <option>WITHIN A WEEK</option>
                <option>WITHIN 2 WEEKS</option>
                <option>WITHIN A MONTH</option>
              </select>
            </div>
          </div>

          <div className="totals-box">
            <p><strong>Subtotal:</strong> AED {subtotal.toFixed(2)}</p>
            <p><strong>Tax:</strong> AED {totalTax.toFixed(2)}</p>
            <p>
              <strong>Discount:</strong>{" "}
              <input
                type="number"
                value={quote.discount}
                onChange={(e) => setQuote({ ...quote, discount: e.target.value })}
                className="discount-input"
              />
            </p>
            <h3><strong>Total:</strong> AED {grandTotal.toFixed(2)}</h3>
          </div>

          <div className="quote-actions">
            <button className="save-btn" onClick={handleSubmit}>💾 Save</button>
            <button className="preview-btn" disabled>📄 Preview PDF</button>
            <button className="send-btn" disabled>✉️ Send</button>
            <button className="cancel-btn" onClick={handleCancel}>❌ Cancel</button>
          </div>
        </>
      )}
    </div>
  );
}
