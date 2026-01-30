// src/components/InvoicePrintA4.js
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import QRCode from "qrcode"; // same lib as PosThermalPrint
import "./InvoicePrintA4.css";
import companyLogo from "../assets/logo.png";

const to2 = (n) => Number(n || 0).toFixed(2);
const AED = new Intl.NumberFormat("en-AE", {
  style: "currency",
  currency: "AED",
});

// defensive style – keep text horizontal
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

/* ---------- FTA QR HELPERS (same idea as thermal) ---------- */
// [TAG][LENGTH][VALUE...]
const tlv = (tag, value) => {
  const text = String(value ?? "");
  const bytes = new TextEncoder().encode(text);
  const out = new Uint8Array(2 + bytes.length);
  out[0] = tag;
  out[1] = bytes.length;
  out.set(bytes, 2);
  return out;
};

/**
 * Build UAE e-invoice QR payload (Base64 TLV)
 * 1 = Seller name
 * 2 = TRN
 * 3 = Timestamp (ISO)
 * 4 = Total incl. VAT
 * 5 = VAT amount
 */
const buildFtaQrBase64 = ({ sellerName, trn, timestamp, total, vat }) => {
  const f1 = tlv(1, sellerName);
  const f2 = tlv(2, trn);
  const f3 = tlv(3, timestamp);
  const f4 = tlv(4, total);
  const f5 = tlv(5, vat);

  const len = f1.length + f2.length + f3.length + f4.length + f5.length;
  const all = new Uint8Array(len);

  let offset = 0;
  [f1, f2, f3, f4, f5].forEach((field) => {
    all.set(field, offset);
    offset += field.length;
  });

  let binary = "";
  all.forEach((b) => {
    binary += String.fromCharCode(b);
  });

  return btoa(binary);
};

export default function InvoicePrintA4() {
  const { id } = useParams();
  const navigate = useNavigate();
  const rootRef = useRef(null);

  const [invoice, setInvoice] = useState(null);
  const [company, setCompany] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState(null);

  // ---------- LOAD DATA ----------
  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const [invRes, compRes] = await Promise.all([
          axios.get(`/invoices/${id}`),
          axios.get("/company"),
        ]);

        const inv = invRes?.data?.data ?? invRes?.data ?? {};
        const comp = compRes?.data?.data ?? compRes?.data ?? {};

        if (alive) {
          setInvoice(inv);
          setCompany(comp);
        }
      } catch (e) {
        console.error(e);
        if (alive) setError("Failed to load invoice/company");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  // ---------- DERIVED FIELDS ----------
  const items = Array.isArray(invoice?.items) ? invoice.items : [];
  const vatPct = Number(invoice?.vatPct ?? 5);

  const customerName =
    invoice?.customerName || invoice?.customer?.name || "-";
  const customerAddr =
    invoice?.customer?.address || invoice?.customerAddress || "";
  const customerPhone =
    invoice?.customer?.phone || invoice?.customerPhone || "";

  const invDate = invoice?.date
    ? new Date(invoice.date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "-";

  const getNames = (it) => {
    const t = it?.translations || it?.i18n || {};
    return {
      nameEn: it?.nameEn ?? it?.englishName ?? it?.name ?? t?.en?.name ?? "",
      nameAr:
        it?.nameAr ?? it?.arabicName ?? it?.name_ar ?? t?.ar?.name ?? "",
    };
  };

  // ---------- TOTALS ----------
  let derivedGross = 0;
  items.forEach((it) => {
    const q = Number(it?.quantity ?? it?.qty ?? 0);
    const p = Number(it?.price ?? 0);
    const line = it?.total != null ? Number(it.total) : q * p;
    derivedGross += line;
  });

  const gross = Number(invoice?.grossTotal ?? derivedGross);
  const discount = Number(invoice?.discount ?? invoice?.discountAmount ?? 0);
  const taxable = Math.max(gross - discount, 0);
  const vatAmount = taxable * (vatPct / 100);
  const net = taxable + vatAmount;
  const paid = Number(invoice?.paidAmount ?? net);
  const change = Number(invoice?.change ?? Math.max(paid - net, 0));

  // ---------- COMPANY ----------
  const companyNameEn = company?.name || "INFOWAYS IT SOLUTION";
  const companyNameAr = company?.nameAr || "مطحنة سموث";
  const trn = company?.trn || "789456123589";
  const addr = company?.address || "Shabia, Abudhabi, UAE";
  const phone = company?.phone || "+971 58 942 66";
  const email = company?.email || "infowaysitsolutions@gmail.com";

  // ---------- QR GENERATION ----------
  useEffect(() => {
    if (!invoice) {
      setQrDataUrl(null);
      return;
    }

    try {
      const sellerName = companyNameEn;
      const timestamp = invoice.date
        ? new Date(invoice.date).toISOString()
        : new Date().toISOString();

      const payload =
        invoice.eInvoiceQrPayload ||
        buildFtaQrBase64({
          sellerName,
          trn,
          timestamp,
          total: net.toFixed(2),
          vat: vatAmount.toFixed(2),
        });

      QRCode.toDataURL(
        payload,
        {
          margin: 1,
          scale: 6,
          width: 220,
        },
        (err, url) => {
          if (err) {
            console.error("QR generate error", err);
            setQrDataUrl(null);
          } else {
            setQrDataUrl(url);
          }
        }
      );
    } catch (err) {
      console.error("QR build error", err);
      setQrDataUrl(null);
    }
  }, [invoice, companyNameEn, trn, net, vatAmount]);

  // ---------- HANDLERS ----------
  const handleBack = () => {
    navigate("/invoice");
  };

  const handlePrint = async () => {
    const root = rootRef.current;
    if (!root) return;

    try {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
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

  // ---------- LOADING / ERROR ----------
  if (loading) return <div className="a4-invoice">Loading…</div>;
  if (error) return <div className="a4-invoice">{error}</div>;
  if (!invoice) return <div className="a4-invoice">Invoice not found</div>;

  // ---------- JSX ----------
  return (
    <div
      ref={rootRef}
      className="a4-invoice"
      style={FORCE}
      role="document"
      aria-label="Invoice A4"
    >
      {/* ===== HEADER (LOGO + QR) ===== */}
      <div className="lh">
        {/* LEFT – logo + company (first 2 cols) */}
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

        {/* RIGHT – QR in 3rd column */}
        <div className="lh-qrbox">
          {qrDataUrl && (
            <div className="qr-box">
              <img src={qrDataUrl} alt="E-invoice QR" className="qr-img" />
            </div>
          )}
        </div>
      </div>

      {/* ===== RIBBON ===== */}
      <div className="ribbon grid">
        {/* LEFT: Customer */}
        <div className="rib-cell mscell">
          <div className="ms-head">M/s.</div>
          <div className="ms-body">
            <div className="ms-name">{customerName}</div>
            {(customerAddr || customerPhone) && (
              <div className="ms-addr">
                {customerAddr && <span>{customerAddr}</span>}
                {customerPhone && <span> • {customerPhone}</span>}
              </div>
            )}
          </div>
        </div>

        {/* CENTER: Tax Invoice title */}
        <div className="rib-cell taxcell">
          <div className="tax-title">TAX INVOICE</div>
          <div className="tax-title ar">فاتورة ضريبية</div>
          <div className="trn-line">TRN {trn}</div>
        </div>

        {/* RIGHT: Invoice meta */}
        <div className="rib-cell">
          <div className="ibox">
            <div className="ibox-row">
              <label>Invoice No</label>
              <span className="val">{invoice?.invoiceNo || "-"}</span>
            </div>
            <div className="ibox-row">
              <label>Date</label>
              <span className="val">{invDate}</span>
            </div>
            <div className="ibox-row">
              <label>Payment</label>
              <span className="val">{invoice?.paymentType || "Cash"}</span>
            </div>
            <div className="ibox-row">
              <label>L.P.O. No.</label>
              <span className="val">{invoice?.lpoNo || "-"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== ITEMS TABLE ===== */}
      <table className="inv-table" style={FORCE}>
        <colgroup>
          <col style={{ width: "6%" }} />
          <col style={{ width: "42%" }} />
          <col style={{ width: "8%" }} />
          <col style={{ width: "9%" }} />
          <col style={{ width: "11%" }} />
          <col style={{ width: "6%" }} />
          <col style={{ width: "8%" }} />
          <col style={{ width: "10%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>
              <span className="th-en">S.No</span>
              <span className="th-ar ar">رقم</span>
            </th>
            <th>
              <span className="th-en">Description</span>
              <span className="th-ar ar">الوصف</span>
            </th>
            <th className="num">
              <span className="th-en">Qty</span>
              <span className="th-ar ar">الكمية</span>
            </th>
            <th className="num">
              <span className="th-en">Unit Price</span>
              <span className="th-ar ar">سعر الوحدة</span>
            </th>
            <th className="num">
              <span className="th-en">
                Unit Price
                <br />
                (Inc VAT)
              </span>
              <span className="th-ar ar">
                السعر شامل
                <br />
                الضريبة
              </span>
            </th>
            <th className="num">
              <span className="th-en">VAT %</span>
              <span className="th-ar ar">٪ ض</span>
            </th>
            <th className="num">
              <span className="th-en">VAT Amount</span>
              <span className="th-ar ar">قيمة الضريبة</span>
            </th>
            <th className="num">
              <span className="th-en">Amount</span>
              <span className="th-ar ar">الإجمالي</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={8} className="t-center">
                No items
              </td>
            </tr>
          ) : (
            items.map((it, i) => {
              const q = Number(it?.quantity ?? it?.qty ?? 0);
              const p = Number(it?.price ?? 0);
              const v = Number(it?.vatPct ?? vatPct);
              const base = q * p;
              const lineVat = base * (v / 100);
              const priceInc = p + p * (v / 100);
              const { nameEn, nameAr } = getNames(it);
              const key = it?.id || it?._id || `${nameEn}-${i}`;

              return (
                <tr key={key}>
                  <td className="num">{i + 1}</td>
                  <td>
                    <div className="name-en">{nameEn || "-"}</div>
                    {nameAr && <div className="name-ar ar">{nameAr}</div>}
                  </td>
                  <td className="num">{to2(q)}</td>
                  <td className="num">{to2(p)}</td>
                  <td className="num">{to2(priceInc)}</td>
                  <td className="num">{to2(v)}</td>
                  <td className="num">{to2(lineVat)}</td>
                  <td className="num">{to2(base + lineVat)}</td>
                </tr>
              );
            })
          )}
        </tbody>
        <tfoot>
          <tr className="tf-row">
            <td className="tf-spacer" colSpan={6} />
            <td className="tf-label">Taxable Amount</td>
            <td className="tf-val">{AED.format(taxable)}</td>
          </tr>
          <tr className="tf-row">
            <td className="tf-spacer" colSpan={6} />
            <td className="tf-label">{`VAT ${to2(vatPct)}%`}</td>
            <td className="tf-val">{AED.format(vatAmount)}</td>
          </tr>
          <tr className="tf-row tf-gt">
            <td className="tf-spacer" colSpan={6} />
            <td className="tf-label">Net Total</td>
            <td className="tf-val">{AED.format(net)}</td>
          </tr>
          <tr className="tf-row tf-paid">
            <td className="tf-spacer" colSpan={6} />
            <td className="tf-label">Paid</td>
            <td className="tf-val">{AED.format(paid)}</td>
          </tr>
          <tr className="tf-row tf-change">
            <td className="tf-spacer" colSpan={6} />
            <td className="tf-label">Change</td>
            <td className="tf-val">{AED.format(change)}</td>
          </tr>
        </tfoot>
      </table>

      {/* ===== FOOTER (NO BARCODE) ===== */}
      <div className="footer-wrap">
        <div className="boxed-footer">
          <div className="sign-grid">
            <div className="sign-cell">
              <div className="sign-title">Receiver’s Name &amp; Sign</div>
              <div className="sign-line" />
            </div>
            <div className="sign-cell">
              <div className="sign-title">Driver Name</div>
              <div className="sign-line" />
            </div>
            <div className="sign-cell">
              <div className="sign-title">Vehicle No.</div>
              <div className="sign-line" />
            </div>
            <div className="sign-cell">
              <div className="sign-title">Sales Executive</div>
              <div className="sign-line" />
            </div>
            <div className="sign-cell right-brand">
              <div className="sign-title">For {companyNameEn}</div>
              <div className="sign-line long" />
            </div>
          </div>

          <div className="decl-grid">
            <div className="decl-cell">
              <strong>Declaration:</strong> Goods once sold will not be taken
              back or exchanged. Please check items before leaving the counter.
            </div>
            <div className="decl-cell t-right">
              <strong>Thank You!</strong> Visit Again.
            </div>
          </div>
        </div>
      </div>

      {/* ===== SCREEN BUTTONS ONLY ===== */}
      <div className="no-print actions">
        <button type="button" className="btn" onClick={handleBack}>
          Back
        </button>
        <button type="button" className="btn primary" onClick={handlePrint}>
          Print
        </button>
      </div>
    </div>
  );
}
