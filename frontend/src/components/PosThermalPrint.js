// src/components/PosThermalPrint.js
import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import QRCode from "qrcode";          // <-- NEW
import "./PosThermalPrint.css";

/* ---------- helpers ---------- */
const toNumber = (v, def = 0) =>
  v === "" || v == null ? def : Number(v) || def;

const round2 = (v) =>
  Math.round((Number(v) + Number.EPSILON) * 100) / 100;

const fmt2 = (v) => round2(v).toFixed(2);

const firstDefined = (...vals) => vals.find((x) => x != null);

/* ---------- FTA QR (TLV + Base64) ---------- */
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
 * Build UAE e-invoice QR payload (Base64 TLV).
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

  // Uint8Array -> binary string -> Base64
  let binary = "";
  all.forEach((b) => {
    binary += String.fromCharCode(b);
  });

  return btoa(binary);
};

/* ---------- component ---------- */

function PosThermalPrint({ invoiceData }) {
  const [qrDataUrl, setQrDataUrl] = useState(null);

  // auto-print + notify POS screen
  useEffect(() => {
    if (!invoiceData) return;

    const timer = setTimeout(() => {
      try {
        window.print();
      } catch {
        // ignore
      }
    }, 300);

    const handleAfterPrint = () => {
      window.dispatchEvent(new Event("after-invoice-print"));
    };

    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [invoiceData]);

  // normalize + totals
  const data = useMemo(() => {
    if (!invoiceData) return null;

    const d = invoiceData;
    const items = Array.isArray(d.items) ? d.items : [];

    const calcSubTotal = () =>
      round2(
        items.reduce((sum, it) => {
          const qty = toNumber(it?.qty ?? it?.quantity, 1);
          const rate = toNumber(it?.rate ?? it?.unitPrice ?? it?.price, 0);
          return sum + qty * rate;
        }, 0)
      );

    const subTotal = toNumber(
      firstDefined(d.subTotal, d.subtotal),
      calcSubTotal()
    );

    // discount
    const discountAbs = toNumber(
      firstDefined(d.discount, d.discountAmt, d.discountAmount),
      NaN
    );
    const discountPct = toNumber(
      firstDefined(
        d.discountPct,
        d.discountPercent,
        d.discount_perc,
        d.discount_percentage
      ),
      NaN
    );

    const discount = Number.isFinite(discountAbs)
      ? round2(discountAbs)
      : Number.isFinite(discountPct)
      ? round2((discountPct / 100) * subTotal)
      : 0;

    // VAT (default 5%)
    const vatAbs = toNumber(
      firstDefined(d.vat, d.tax, d.vatAmount, d.taxAmount),
      NaN
    );
    const vatPct = toNumber(
      firstDefined(d.vatPct, d.taxPct, d.taxPercent),
      NaN
    );

    const vat = Number.isFinite(vatAbs)
      ? round2(vatAbs)
      : round2(
          ((Number.isFinite(vatPct) ? vatPct : 5) / 100) *
            (subTotal - discount)
        );

    // total
    const total = toNumber(
      d.total,
      round2(subTotal - discount + vat)
    );

    // paid / change / due
    let paid = toNumber(
      firstDefined(
        d.paid,
        d.cashReceived,
        d.tendered,
        d.paidAmount,
        d.amountPaid,
        d.payCash,
        d.cash,
        d.received,
        d.payment?.amount,
        d.payment?.paid
      ),
      NaN
    );

    const incomingChange = toNumber(
      firstDefined(d.change, d.balanceChange),
      NaN
    );
    const incomingDue = toNumber(
      firstDefined(d.due, d.balanceDue),
      NaN
    );

    if (!Number.isFinite(paid)) {
      if (Number.isFinite(incomingChange)) {
        paid = round2(total + incomingChange);
      } else if (Number.isFinite(incomingDue)) {
        paid = round2(total - incomingDue);
      } else {
        paid = total;
      }
    }

    const change = paid >= total ? round2(paid - total) : 0;
    const due = paid < total ? round2(total - paid) : 0;

    const balanceLabel = paid >= total ? "Change" : "Due";
    const balanceLabelAr =
      paid >= total ? "الباقي للعميل" : "المتبقي";

    const discountPctView = subTotal > 0 ? (discount / subTotal) * 100 : 0;

    // meta / header
    const shopName = d.shopName ?? "JABAL AL RAHMAH GROCERY L.L.C";
    const address = d.address ?? "RAS AL KHOR DUBAI UAE";
    const phone = d.phone ?? d.phonenumber ?? "0569304466";
    const trn = d.trn ?? "12002000000";

    const invoiceNo = d.invoiceNo ?? `DRAFT-${Date.now()}`;
    const dateTime =
      d.dateTime ?? [d.date ?? "", d.time ?? ""].filter(Boolean).join(" ");

    const dateTimeIso =
      d.dateTimeIso ||
      (d.dateTime
        ? new Date(d.dateTime).toISOString()
        : new Date().toISOString());

    // footer
    const returnPolicyDays = toNumber(
      firstDefined(d.returnPolicyDays, d.returnDays),
      7
    );

    const footerNote = d.footerNote ?? "Thank you! Visit again.";
    const footerNoteAr =
      d.footerNoteAr ??
      "الإرجاع خلال {DAYS} أيام — شكرًا لزيارتكم";

    const barcode = d.barcode ?? "1010101020223";
    const cashier = d.cashier ?? "Admin";
    const paymentMethod = String(d.paymentMethod ?? "CASH").toUpperCase();

    // e-invoice QR payload (Base64 TLV)
    const eInvoiceQrPayload =
      d.eInvoiceQrPayload ||
      buildFtaQrBase64({
        sellerName: shopName,
        trn,
        timestamp: dateTimeIso,
        total: total.toFixed(2),
        vat: vat.toFixed(2),
      });

    return {
      shopName,
      address,
      phone,
      trn,
      invoiceNo,
      dateTime,
      cashier,
      paymentMethod,
      items,
      subTotal,
      discount,
      discountPctView,
      vat,
      total,
      paid,
      change,
      due,
      balanceLabel,
      balanceLabelAr,
      returnPolicyDays,
      footerNote,
      footerNoteAr,
      barcode,
      eInvoiceQrPayload,
    };
  }, [invoiceData]);

  // generate QR PNG locally whenever payload changes
  useEffect(() => {
    if (!data?.eInvoiceQrPayload) {
      setQrDataUrl(null);
      return;
    }

    QRCode.toDataURL(
      data.eInvoiceQrPayload,
      {
        margin: 1,
        scale: 4,      // controls size (80mm receipt – this is fine)
        width: 120,
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
  }, [data?.eInvoiceQrPayload]);

  // rows: No | Item | Qty | Rate | Total
  const rows = useMemo(() => {
    if (!data) return [];

    return (data.items || []).map((it, idx) => {
      const qty = toNumber(it?.qty ?? it?.quantity, 1);
      const rate = toNumber(it?.rate ?? it?.unitPrice ?? it?.price, 0);
      const fallbackTotal = round2(qty * rate);

      return {
        key:
          it?.id ??
          it?._id ??
          `${idx}-${
            it?.barcode ??
            it?.itemBarcode ??
            it?.productCode ??
            it?.code ??
            "row"
          }`,
        no: idx + 1,
        nameEn: it?.nameEn ?? it?.name ?? it?.itemName ?? "",
        nameAr: it?.nameAr ?? it?.arabicName ?? "",
        code:
          it?.barcode ??
          it?.itemBarcode ??
          it?.productCode ??
          it?.code ??
          "",
        qty,
        rate,
        total: toNumber(it?.total, fallbackTotal),
      };
    });
  }, [data]);

  if (!invoiceData || !data) return null;

  const footerArText = (data.footerNoteAr || "")
    .replace("{DAYS}", String(data.returnPolicyDays))
    .replace("{days}", String(data.returnPolicyDays));

  const finalValue = data.change > 0 ? data.change : data.due;

  return (
    <div id="print-section">
      <div className="tp-root">
        {/* HEADER */}
        <div className="tp-header">
          <div className="tp-title">{data.shopName}</div>
          <div className="tp-sub">L.L.C</div>
          <div className="tp-sub">{data.address}</div>
          <div className="tp-sub">Phone: {data.phone}</div>
          {!!data.trn && <div className="tp-sub">TRN: {data.trn}</div>}

          <div className="tp-meta">
            <div>Tax Invoice</div>
            <div>Invoice: {data.invoiceNo}</div>
            {!!data.dateTime && <div>Date: {data.dateTime}</div>}
            <div>Cashier: {data.cashier}</div>
            <div>Payment: {data.paymentMethod}</div>
          </div>
        </div>

        {/* TABLE HEAD */}
        <div className="tp-rule" />
        <div className="tp-grid5 tp-head">
          <div>No</div>
          <div>Item</div>
          <div className="a-r">Qty</div>
          <div className="a-r">Rate</div>
          <div className="a-r">Total</div>
        </div>
        <div className="tp-rule" />

        {/* TABLE ROWS */}
        <div className="tp-lines">
          {rows.map((row) => (
            <div className="tp-grid5 tp-row" key={row.key}>
              <div>{row.no}</div>
              <div className="tp-itemcell">
                {row.nameEn && (
                  <div className="en tp-ellipsis">{row.nameEn}</div>
                )}
                {row.nameAr && (
                  <div className="ar tp-ellipsis" dir="rtl">
                    {row.nameAr}
                  </div>
                )}
                {row.code && <div className="bc">{row.code}</div>}
              </div>
              <div className="a-r">{fmt2(row.qty)}</div>
              <div className="a-r">{fmt2(row.rate)}</div>
              <div className="a-r">{fmt2(row.total)}</div>
            </div>
          ))}
        </div>

        <div className="tp-rule" />

        {/* TOTALS */}
        <div className="tp-totals">
          <div className="tp-total-row">
            <span>Before VAT</span>
            <span>{fmt2(data.subTotal)}</span>
          </div>

          {data.discount > 0 && (
            <div className="tp-total-row">
              <span>Discount ({fmt2(data.discountPctView)}%)</span>
              <span>{fmt2(data.discount)}</span>
            </div>
          )}

          {data.vat > 0 && (
            <div className="tp-total-row">
              <span>VAT (5%)</span>
              <span>{fmt2(data.vat)}</span>
            </div>
          )}

          <div className="tp-total-row tp-grand">
            <span>Total</span>
            <span>{fmt2(data.total)}</span>
          </div>

          <div className="tp-total-row">
            <span>Paid</span>
            <span>{fmt2(data.paid)}</span>
          </div>

          <div className="tp-total-row tp-strong">
            <span>
              {data.balanceLabel} / {data.balanceLabelAr}
            </span>
            <span>{fmt2(finalValue)}</span>
          </div>
        </div>

        {/* QR (FTA) */}
        {qrDataUrl && (
          <div className="tp-qr">
            <img src={qrDataUrl} alt="E-Invoice QR" />
          </div>
        )}

        {/* BARCODE */}
        <div className="tp-barcode">
          <img
            src={`https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(
              data.barcode
            )}&code=Code128&translate-esc=false`}
            alt="Barcode"
          />
          <div className="tp-barcode-text">{data.barcode}</div>
        </div>

        {/* FOOTER */}
        <div className="tp-footer">
          <div className="en">{data.footerNote}</div>
          <div className="ar" dir="rtl">
            {footerArText}
          </div>
        </div>
      </div>
    </div>
  );
}

PosThermalPrint.propTypes = {
  invoiceData: PropTypes.shape({
    shopName: PropTypes.string,
    address: PropTypes.string,
    phone: PropTypes.string,
    phonenumber: PropTypes.string,
    trn: PropTypes.string,
    invoiceNo: PropTypes.string,
    dateTime: PropTypes.string,
    dateTimeIso: PropTypes.string,
    date: PropTypes.string,
    time: PropTypes.string,
    cashier: PropTypes.string,
    paymentMethod: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),

    footerNote: PropTypes.string,
    footerNoteAr: PropTypes.string,
    returnPolicyDays: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    returnDays: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    barcode: PropTypes.string,

    eInvoiceQrPayload: PropTypes.string,

    items: PropTypes.arrayOf(PropTypes.object),

    subTotal: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    subtotal: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),

    discount: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    discountAmt: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    discountAmount: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    discountPct: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    discountPercent: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),

    vat: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    tax: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    vatPct: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    taxPct: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    taxPercent: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),

    total: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),

    paid: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    cashReceived: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    tendered: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    paidAmount: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    amountPaid: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    payCash: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    cash: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    received: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),

    change: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    balanceChange: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    due: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    balanceDue: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
  }),
};

export default React.memo(PosThermalPrint);
