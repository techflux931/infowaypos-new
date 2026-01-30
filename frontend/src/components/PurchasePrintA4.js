// src/components/PurchasePrintA4.js
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaPrint } from "react-icons/fa";
import axios from "../api/axios";
import companyLogo from "../assets/logo.png";
import "./InvoicePrintA4.css"; // reuse SAME A4 invoice design

const n = (v) => Number(v || 0);
const fmt = (x) =>
  n(x).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// keep text horizontal (same as sales A4)
const FORCE = {
  writingMode: "horizontal-tb",
  WebkitWritingMode: "horizontal-tb",
  textOrientation: "mixed",
  transform: "none",
  rotate: "0deg",
  whiteSpace: "normal",
  lineHeight: "1.15",
  display: "block",
};

export default function PurchasePrintA4() {
  const navigate = useNavigate();
  const rootRef = useRef(null);

  // -------- COMPANY (same as invoice A4) --------
  const [company, setCompany] = useState({});
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await axios.get("/company");
        const comp = data?.data ?? data ?? {};
        if (alive) setCompany(comp);
      } catch (e) {
        console.error("Failed to load company for PO print:", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const companyNameEn = company?.name || "INFOWAYS IT SOLUTION";
  const companyNameAr = company?.nameAr || "مطحنة سموث";
  const addr = company?.address || "Shabia, Abudhabi, UAE";
  const phone = company?.phone || "+971 58 942 66";
  const email = company?.email || "infowaysitsolutions@gmail.com";

  // -------- DATA FROM SESSION --------
  const d = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("purchaseForPrint") || "{}");
    } catch {
      return {};
    }
  }, []);

  const items = useMemo(
    () => (Array.isArray(d.items) ? d.items : []),
    [d]
  );

  const shipping = n(d.shipping);
  const totalsGrand = n(d.totals?.grandTotal);
  const grandFromObj = n(d.grandTotal);

  const derived = useMemo(() => {
    let subTotal = 0,
      totalTax = 0,
      totalDiscount = 0;
    for (const r of items) {
      const qty = n(r.qty);
      const rate = n(r.rate);
      const line = qty * rate;
      const tax = line * (n(r.taxPct) / 100);
      const disc = n(r.discount);
      subTotal += line;
      totalTax += tax;
      totalDiscount += disc;
    }
    const grandTotal =
      totalsGrand || grandFromObj || subTotal + totalTax - totalDiscount + shipping;
    return { subTotal, totalTax, totalDiscount, shipping, grandTotal };
  }, [items, shipping, totalsGrand, grandFromObj]);

  const dateText = d.orderDate || d.date || "-";

  const supplierName =
    d.supplierDetails ||
    d.supplierQuery ||
    d.supplier?.name ||
    d.supplierName ||
    "-";

  // -------- HANDLERS --------
  const goBackToList = () => {
    navigate("/total-purchase/purchase", { replace: false });
  };

  const handlePrint = async () => {
    const root = rootRef.current;
    if (!root) return;

    try {
      if (document.fonts?.ready) await document.fonts.ready;
    } catch {
      /* ignore */
    }

    const imgs = Array.from(root.querySelectorAll("img"));
    await Promise.all(
      imgs.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise((resolve) => {
              img.onload = img.onerror = resolve;
            })
      )
    );

    window.scrollTo({ top: 0, behavior: "instant" });
    setTimeout(() => window.print(), 50);
  };

  // -------- JSX (same structure as sales A4) --------
  return (
    <div
      ref={rootRef}
      className="a4-invoice"
      style={FORCE}
      role="document"
      aria-label="Purchase Order A4"
    >
      {/* TOP BUTTONS (hidden in print) */}
      <div className="no-print actions">
        <button type="button" className="btn" onClick={goBackToList}>
          <FaArrowLeft style={{ marginRight: 6 }} />
          Back
        </button>
        <button type="button" className="btn primary" onClick={handlePrint}>
          <FaPrint style={{ marginRight: 6 }} />
          Print
        </button>
      </div>

      {/* ===== LETTERHEAD ===== */}
      <div className="lh">
        <div className="lh-brand">
          <img src={companyLogo} alt="Logo" className="lh-logo" />
          <div className="lh-title">
            <span className="en">{companyNameEn}</span>
            <span className="ar">{companyNameAr}</span>
          </div>
          <div className="lh-contact">
            <span className="lh-row">{addr}</span>
            <span className="lh-row">
              Tel: {phone} • Email: {email}
            </span>
          </div>
        </div>
        <div /> {/* spacer */}
      </div>

      {/* ===== RIBBON ===== */}
      <div className="ribbon grid">
        {/* LEFT: Supplier (M/s) */}
        <div className="rib-cell mscell">
          <div className="cust-box">
            <div className="ms-head">M/s.</div>
            <div className="ms-body">
              <div className="ms-name">{supplierName}</div>
            </div>
          </div>
        </div>

        {/* CENTER: Title */}
        <div className="rib-cell taxcell">
          <div className="tax-box">
            <div className="tax-title">PURCHASE ORDER</div>
            <div className="tax-title ar">أمر شراء</div>
          </div>
        </div>

        {/* RIGHT: PO meta */}
        <div className="rib-cell">
          <div className="ibox">
            <div className="ibox-row">
              <label>PO No</label>
              <span className="val">{d.orderNo || d.poNo || "-"}</span>
            </div>
            <div className="ibox-row">
              <label>Date</label>
              <span className="val">{dateText}</span>
            </div>
            <div className="ibox-row">
              <label>Payment Terms</label>
              <span className="val">
                {d.paymentTerms || d.paymentTerm || "Payment On Receipt"}
              </span>
            </div>
            <div className="ibox-row">
              <label>Due Date</label>
              <span className="val">{d.dueDate || "-"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== ITEMS TABLE (styled like sales invoice) ===== */}
      <table className="inv-table" style={FORCE}>
        <colgroup>
          <col style={{ width: "6%" }} />
          <col style={{ width: "44%" }} />
          <col style={{ width: "8%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "9%" }} />
          <col style={{ width: "9%" }} />
          <col style={{ width: "14%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>
              <span className="th-en">S.No</span>
            </th>
            <th>
              <span className="th-en">Item</span>
            </th>
            <th className="num">
              <span className="th-en">Qty</span>
            </th>
            <th className="num">
              <span className="th-en">Rate</span>
            </th>
            <th className="num">
              <span className="th-en">Tax %</span>
            </th>
            <th className="num">
              <span className="th-en">Disc</span>
            </th>
            <th className="num">
              <span className="th-en">Total</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? (
            items.map((r, i) => {
              const qty = n(r.qty);
              const rate = n(r.rate);
              const line = qty * rate;
              const tax = line * (n(r.taxPct) / 100);
              const disc = n(r.discount);
              const total = line + tax - disc;

              const en =
                r.nameEn ||
                r.itemNameEn ||
                r.name ||
                r.nameOrCode ||
                r.code ||
                "";
              const ar =
                r.nameAr || r.itemNameAr || r.nameArabic || r.ar || "";

              return (
                <tr key={i}>
                  <td className="num">{i + 1}</td>
                  <td>
                    <div className="name-en">{en || "-"}</div>
                    {ar ? <div className="name-ar ar">{ar}</div> : null}
                    {r.note ? <div className="note">{r.note}</div> : null}
                  </td>
                  <td className="num">{fmt(qty)}</td>
                  <td className="num">{fmt(rate)}</td>
                  <td className="num">{fmt(r.taxPct)}</td>
                  <td className="num">{fmt(disc)}</td>
                  <td className="num">{fmt(total)}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="7" className="t-center">
                No items
              </td>
            </tr>
          )}
        </tbody>

        {/* ===== TOTALS CARD (right side, same style) ===== */}
        <tfoot>
          <tr className="tf-row">
            <td className="tf-spacer" colSpan={5} />
            <td className="tf-label">Sub Total</td>
            <td className="tf-val">
              {fmt(derived.subTotal || d.subTotal)}
            </td>
          </tr>
          <tr className="tf-row">
            <td className="tf-spacer" colSpan={5} />
            <td className="tf-label">Total Tax</td>
            <td className="tf-val">
              {fmt(derived.totalTax || d.totalTax)}
            </td>
          </tr>
          <tr className="tf-row">
            <td className="tf-spacer" colSpan={5} />
            <td className="tf-label">Total Discount</td>
            <td className="tf-val">
              {fmt(derived.totalDiscount || d.totalDiscount)}
            </td>
          </tr>
          <tr className="tf-row">
            <td className="tf-spacer" colSpan={5} />
            <td className="tf-label">Shipping</td>
            <td className="tf-val">{fmt(derived.shipping)}</td>
          </tr>
          <tr className="tf-row tf-gt">
            <td className="tf-spacer" colSpan={5} />
            <td className="tf-label">Grand Total</td>
            <td className="tf-val">
              {fmt(derived.grandTotal)}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* ===== SIGNATURE / FOOTER (optional, same look) ===== */}
      <div className="boxed-footer">
        <div className="sign-grid">
          <div className="sign-cell">
            <div className="sign-title">Prepared By</div>
            <div className="sign-line" />
          </div>
          <div className="sign-cell">
            <div className="sign-title">Checked By</div>
            <div className="sign-line" />
          </div>
          <div className="sign-cell">
            <div className="sign-title">Store Keeper</div>
            <div className="sign-line" />
          </div>
          <div className="sign-cell">
            <div className="sign-title">Accounts</div>
            <div className="sign-line" />
          </div>
          <div className="sign-cell right-brand">
            <div className="sign-title">For {companyNameEn}</div>
            <div className="sign-line long" />
          </div>
        </div>

        <div className="decl-grid">
          <div className="decl-cell">
            <strong>Note:</strong> Please confirm quantity, price and
            payment terms before supplying the goods.
          </div>
          <div className="decl-cell t-right">
            <strong>Thank You!</strong> for your cooperation.
          </div>
        </div>
      </div>
    </div>
  );
}
