// src/components/Sales/QuoteList.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import "../styles/QuoteList.css";

/* ==================== Helpers ==================== */
const fmtAED = (n) =>
  Number.isFinite(Number(n)) ? `AED ${Number(n).toFixed(2)}` : "AED 0.00";

const safeDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? d : date.toLocaleDateString("en-GB");
};

const nbsp = (v) => (v == null || v === "" ? "—" : String(v));

/** blank -> 5%, 0.05 -> 5%, 5 -> 5%, >100 => absolute AED */
const lineMath = ({ qty, price, tax }) => {
  const q = parseFloat(qty) || 0;
  const p = parseFloat(price) || 0;
  const t = Number.isFinite(parseFloat(tax)) ? parseFloat(tax) : NaN;

  const base = q * p;
  let taxAmt;
  if (Number.isNaN(t)) taxAmt = base * 0.05;
  else if (t < 1) taxAmt = base * t;
  else if (t <= 100) taxAmt = base * (t / 100);
  else taxAmt = t;

  return { base, taxAmt, total: base + taxAmt };
};

/* ---------- Print via hidden iframe (no popups) ---------- */
function printHTMLviaIframe(html) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  const doPrint = () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } finally {
      setTimeout(() => document.body.removeChild(iframe), 500);
    }
  };
  if ("onload" in iframe) iframe.onload = () => setTimeout(doPrint, 150);
  else setTimeout(doPrint, 200);
}

/* ---------- Build A4 HTML ---------- */
function buildQuoteA4HTML(quote, derivedTotals) {
  const items = Array.isArray(quote.items) ? quote.items : [];
  const today = new Date().toLocaleString();
  const discount = Number(quote.discount) || 0;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>Quotation - ${nbsp(quote.quoteNumber)}</title>
<style>
  @page { size: A4; margin: 16mm; }
  body { font-family: "Segoe UI", Arial, sans-serif; color:#222; }
  .hdr { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; }
  .brand h1 { margin:0; font-size:22px; letter-spacing:.2px; color:#4a1d75; }
  .doc h2 { margin:0; font-size:20px; }
  .meta { margin-top:6px; font-size:12px; line-height:1.4; }
  .box { border:1px solid #e6e2f3; border-radius:12px; padding:14px; margin-top:10px; background:#faf9fd; }
  table { width:100%; border-collapse:collapse; margin-top:12px; }
  th, td { border-bottom:1px solid #eee; padding:8px; font-size:13px; text-align:left; }
  th { background:#f6f1ff; color:#4a1d75; }
  .right { text-align:right; }
  .totals { margin-top:12px; width:100%; }
  .totals .row { display:flex; justify-content:flex-end; gap:24px; margin:4px 0; }
  .totals .row > span { width:140px; display:inline-block; }
  .grand { font-weight:700; color:#4a1d75; }
  .notes { margin-top:10px; font-size:12px; }
  .footer { margin-top:28px; font-size:11px; color:#666; text-align:center; }
</style>
</head>
<body>
  <div class="hdr">
    <div class="brand">
      <h1>Quotation</h1>
      <div class="meta">Printed: ${today}</div>
    </div>
    <div class="doc">
      <h2># ${nbsp(quote.quoteNumber)}</h2>
      <div class="meta">
        Date: ${safeDate(quote.quoteDate)}<br/>
        Valid Till: ${safeDate(quote.validTill)}<br/>
        TRN: ${nbsp(quote.trn)}
      </div>
    </div>
  </div>

  <div class="box">
    <div><strong>Customer:</strong> ${nbsp(quote.customerName)}</div>
    <div><strong>Subject:</strong> ${nbsp(quote.subject)}</div>
    <div><strong>Payment Terms:</strong> ${nbsp(quote.paymentTerms)} &nbsp; | &nbsp; <strong>Delivery Terms:</strong> ${nbsp(quote.deliveryTerms)}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:44px;">#</th>
        <th style="width:140px;">Item Code</th>
        <th>Description</th>
        <th class="right" style="width:70px;">Qty</th>
        <th class="right" style="width:90px;">Price</th>
        <th class="right" style="width:110px;">Tax % / AED</th>
        <th class="right" style="width:110px;">Line Total</th>
      </tr>
    </thead>
    <tbody>
      ${items
        .map((it, i) => {
          const { total } = lineMath(it);
          const taxDisp =
            it.tax === "" || it.tax == null || Number.isNaN(Number(it.tax))
              ? "5"
              : it.tax;
          return `<tr>
            <td>${i + 1}</td>
            <td>${nbsp(it.itemCode)}</td>
            <td>${nbsp(it.description)}</td>
            <td class="right">${Number(it.qty) || 0}</td>
            <td class="right">${fmtAED(Number(it.price) || 0)}</td>
            <td class="right">${taxDisp}</td>
            <td class="right">${fmtAED(total)}</td>
          </tr>`;
        })
        .join("")}
    </tbody>
  </table>

  <div class="totals">
    <div class="row"><span>Subtotal</span><span class="right">${fmtAED(derivedTotals.sub)}</span></div>
    <div class="row"><span>Tax</span><span class="right">${fmtAED(derivedTotals.tax)}</span></div>
    ${discount > 0 ? `<div class="row"><span>Discount</span><span class="right">- ${fmtAED(discount)}</span></div>` : ""}
    <div class="row grand"><span>Total</span><span class="right">${fmtAED(derivedTotals.grand)}</span></div>
  </div>

  ${quote.notes ? `<div class="notes"><strong>Notes:</strong> ${quote.notes}</div>` : ""}

  <div class="footer">Thank you for your business.</div>
</body>
</html>`;
}

/* ==================== Component ==================== */
export default function QuoteList({ onAddNew }) {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [selected, setSelected] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const detailsRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await axios.get("/quotes");
        setQuotes(res.data || []);
      } catch (e) {
        console.error("Error fetching quotes:", e);
        setErr("Failed to load quotations.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openDetails = async (q) => {
    try {
      const id = q.id || q._id;
      if (!id) return;
      setSelectedId(id);
      const res = await axios.get(`/quotes/${id}`);
      setSelected(res.data || q);
      requestAnimationFrame(() => {
        detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (e) {
      console.error("Load quote details failed", e);
      setSelected(q);
    }
  };

  const closeDetails = () => {
    setSelected(null);
    setSelectedId(null);
  };

  const handleAddNew = () => {
    if (typeof onAddNew === "function") onAddNew();
    else navigate("/sales/quotes");
  };

  // Totals (robust even if server didn't send)
  const derived = useMemo(() => {
    if (!selected?.items?.length) {
      return { sub: 0, tax: 0, grand: selected?.totalAmount || 0 };
    }
    const acc = selected.items.reduce(
      (sum, it) => {
        const { base, taxAmt } = lineMath(it);
        return { sub: sum.sub + base, tax: sum.tax + taxAmt };
      },
      { sub: 0, tax: 0 }
    );
    const discount = parseFloat(selected?.discount) || 0;
    return { sub: acc.sub, tax: acc.tax, grand: acc.sub + acc.tax - discount };
  }, [selected]);

  const onPrintA4 = () => {
    if (!selected) return;
    const html = buildQuoteA4HTML(selected, derived);
    printHTMLviaIframe(html);
  };

  return (
    <div className="quote-list-container">
      <div className="quote-header">
        <h2>📋 List Quotation</h2>
        <button className="viewall-btn" onClick={handleAddNew}>
          ➕ Add New Quote
        </button>
      </div>

      {loading && <p>Loading…</p>}
      {!!err && <p style={{ color: "#b91c1c", fontWeight: 600 }}>{err}</p>}

      {!loading && !err && (
        <>
          <div className="quote-table-wrapper">
            <table className="quote-table">
              <thead>
                <tr>
                  <th>Quotation Number</th>
                  <th>Quotation Date</th>
                  <th>Customer Name</th>
                  <th>Subject</th>
                  <th>Payment Terms</th>
                  <th>Delivery Terms</th>
                  <th>Valid Till</th>
                  <th>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {quotes.length ? (
                  quotes.map((q, i) => {
                    const id = q.id || q._id || i;
                    const safeTotal = Number.isFinite(q.totalAmount)
                      ? q.totalAmount
                      : (q.items || []).reduce((s, it) => s + lineMath(it).total, 0);

                    return (
                      <tr
                        key={id}
                        className={`row-click ${selectedId === (q.id || q._id) ? "selected" : ""}`}
                        onClick={() => openDetails(q)}
                        title="Click to view details"
                      >
                        <td>{q.quoteNumber || "N/A"}</td>
                        <td>{safeDate(q.quoteDate)}</td>
                        <td>{q.customerName || "-"}</td>
                        <td>{q.subject || "-"}</td>
                        <td>{q.paymentTerms || "-"}</td>
                        <td>{q.deliveryTerms || "-"}</td>
                        <td>{safeDate(q.validTill)}</td>
                        <td>{fmtAED(safeTotal)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="8">No quotations found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {selected && (
            <div ref={detailsRef} className="quote-details-card">
              <button className="close-x" onClick={closeDetails}>✕</button>
              <h3>Quote Details</h3>

              {/* PRINT (A4) */}
              <div style={{ display: "flex", gap: 8, margin: "6px 0 10px" }}>
                <button className="viewall-btn" onClick={onPrintA4}>
                  🖨️ Print (A4)
                </button>
              </div>

              <div className="quote-details-meta">
                <div><span className="meta-term">Quote No:</span><strong>{selected.quoteNumber || "-"}</strong></div>
                <div><span className="meta-term">Date:</span>{safeDate(selected.quoteDate)}</div>
                <div><span className="meta-term">Valid Till:</span>{safeDate(selected.validTill)}</div>
                <div><span className="meta-term">Customer:</span>{selected.customerName || "-"}</div>
                <div><span className="meta-term">TRN:</span>{selected.trn || "-"}</div>
                <div><span className="meta-term">Subject:</span>{selected.subject || "-"}</div>
                <div><span className="meta-term">Payment Terms:</span>{selected.paymentTerms || "-"}</div>
                <div><span className="meta-term">Delivery Terms:</span>{selected.deliveryTerms || "-"}</div>
              </div>

              <div className="quote-table-wrapper">
                <table className="quote-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Item Code</th>
                      <th>Description</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Tax % / AED</th>
                      <th>Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selected.items || []).map((it, idx) => {
                      const { total } = lineMath(it);
                      return (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>{it.itemCode || "-"}</td>
                          <td>{it.description || "-"}</td>
                          <td>{parseFloat(it.qty) || 0}</td>
                          <td>{fmtAED(parseFloat(it.price) || 0)}</td>
                          <td>{Number.isFinite(parseFloat(it.tax)) ? it.tax : "—"}</td>
                          <td>{fmtAED(total)}</td>
                        </tr>
                      );
                    })}
                    {!selected.items?.length && (
                      <tr><td colSpan="7">No items.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="totals">
                <div><span>Subtotal</span><span>{fmtAED(derived.sub)}</span></div>
                <div><span>Tax</span><span>{fmtAED(derived.tax)}</span></div>
                {Number.isFinite(parseFloat(selected?.discount)) && parseFloat(selected.discount) > 0 && (
                  <div><span>Discount</span><span>- {fmtAED(parseFloat(selected.discount))}</span></div>
                )}
                <div className="grand"><span>Total</span><span>{fmtAED(derived.grand)}</span></div>
              </div>

              {selected.notes && (
                <p style={{ marginTop: 10 }}>
                  <strong>Notes:</strong> {selected.notes}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
