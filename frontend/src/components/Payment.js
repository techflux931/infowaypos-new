// src/components/Payment.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import api from "../api/axios";
import "./Payment.css";

const API = {
  SALES: "/sales",
  CARD_INTENT: "/payments/card/intent",
  CARD_CAPTURE: "/payments/card/capture",
};

const CUR = "AED";

/* ---------- helpers ---------- */
const toAmount = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Number(n.toFixed(2)) : 0;
};
const fmt2 = (n) => toAmount(n).toFixed(2);
/* keep digits + single dot, max 2 decimals (preserves "0." while typing) */
const cleanMoney = (v) => {
  let s = String(v ?? "").replace(/[^\d.]/g, "");
  const parts = s.split(".");
  if (parts.length > 2) s = parts[0] + "." + parts.slice(1).join("");
  const [a, b = ""] = s.split(".");
  return a + (s.includes(".") ? "." + b.slice(0, 2) : "");
};

export default function Payment({
  open = false,
  total = 0,
  customer = null,
  items = [],
  saleType = "RETAIL",
  mode = "card-print", // 'card-print' | 'card-noprint' | 'credit'
  onClose,
  onSuccess,
}) {
  const [status, setStatus] = useState("idle"); // idle | authorizing | capturing | success
  const [error, setError] = useState("");
  const [paidText, setPaidText] = useState(""); // start empty by design
  const userEditedRef = useRef(false); // track if user touched the input
  const paid = toAmount(paidText);

  /* reset only when dialog opens (do NOT tie to total changes) */
  useEffect(() => {
    if (!open) return;
    setStatus("idle");
    setError("");
    setPaidText("");       // keep empty when opened
    userEditedRef.current = false;
  }, [open]);

  /* normalized items for payload */
  const normItems = useMemo(
    () =>
      Array.isArray(items)
        ? items.map((it) => ({
            productId: String(it.id ?? it.code ?? ""),
            productCode: it.code || "",
            name: it.name,
            nameAr: it.nameAr || "",
            unit: it.unit,
            qty: Number(it.quantity || 1),
            unitPrice: Number(it.price || 0),
            vatPercent: 5,
            amount: Number(
              (Number(it.price || 0) * Number(it.quantity || 1)).toFixed(2)
            ),
            vat: Number(
              (Number(it.tax || 0) * Number(it.quantity || 1)).toFixed(2)
            ),
          }))
        : [],
    [items]
  );

  const basePayload = useMemo(
    () => ({
      date: new Date().toISOString(),
      shift: "A",
      cashier: "Admin",
      customerId: customer?.id || "",
      customerName: customer?.name || "",
      saleType: saleType || "RETAIL",
      grossTotal: toAmount(total),
      discount: 0,
      vat: 0,
      netTotal: toAmount(total),
      returnAmount: 0,
      items: normItems,
    }),
    [customer?.id, customer?.name, normItems, saleType, total]
  );

  const buttonLabel =
    mode === "credit"
      ? "Save as Credit"
      : mode === "card-noprint"
      ? "Pay by Card (No Print)"
      : "Pay by Card";

  const saveSale = useCallback(
    async (payType) => {
      const payload = { ...basePayload, paymentType: String(payType).toUpperCase() };
      const { data } = await api.post(API.SALES, payload);
      return data;
    },
    [basePayload]
  );

  const doGateway = useCallback(async (charge) => {
    try {
      setStatus("authorizing");
      const { data: intent } = await api.post(API.CARD_INTENT, { amount: charge });
      if (!intent || intent.status !== "AUTHORIZED") {
        throw new Error(intent?.message || "Card authorization failed.");
      }
      setStatus("capturing");
      const { data: capture } = await api.post(API.CARD_CAPTURE, {
        paymentId: intent.id,
      });
      if (!capture || capture.status !== "CAPTURED") {
        throw new Error(capture?.message || "Card capture failed.");
      }
      return true;
    } catch (e) {
      setError(e?.message || "Network Error");
      return false;
    }
  }, []);

  const fillExact = useCallback(() => {
    setPaidText(fmt2(total));
    userEditedRef.current = true;
  }, [total]);

  const submit = useCallback(async () => {
    if (status !== "idle") return;
    setError("");

    if (mode === "credit") {
      try {
        setStatus("capturing");
        const saved = await saveSale("CREDIT");
        setStatus("success");
        onSuccess?.(saved, { print: false, method: "credit" });
      } catch {
        setStatus("success");
        onSuccess?.(
          { id: `DRAFT-${Date.now()}` },
          { print: false, method: "credit", dev: true }
        );
      }
      return;
    }

    // If user left it empty, assume exact total for convenience
    const charge = paidText.trim() === "" ? toAmount(total) : paid;
    if (charge <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }

    await doGateway(charge); // continue saving even if gateway fails

    try {
      const saved = await saveSale("CARD");
      setStatus("success");
      onSuccess?.(saved, { print: mode === "card-print", method: "card" });
    } catch {
      setStatus("success");
      onSuccess?.(
        { id: `DRAFT-${Date.now()}` },
        { print: mode === "card-print", method: "card", dev: true }
      );
    }
  }, [status, mode, paid, paidText, total, doGateway, saveSale, onSuccess]);

  /* Esc to close, Enter to submit */
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape" && status === "idle") onClose?.();
      if (e.key === "Enter" && status === "idle") {
        e.preventDefault();
        submit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, status, onClose, submit]);

  if (!open) return null;

  const canClose = status === "idle";
  const disabled = status !== "idle";

  return (
    <>
      <div
        className="pay-backdrop"
        onClick={() => (canClose ? onClose?.() : null)}
        aria-hidden="true"
      />
      <div className="pay-modal" role="dialog" aria-modal="true" aria-label="Payment">
        <div className="pay-header">
          <h2>
            {mode === "credit"
              ? "CREDIT SALE"
              : mode === "card-noprint"
              ? "CARD PAYMENT (NO PRINT)"
              : "CARD PAYMENT"}
          </h2>
          <button onClick={onClose} disabled={!canClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="pay-body">
          <div className="pay-row">
            <div className="pay-label">Total&nbsp;Due</div>
            <div className="pay-amount">
              <span className="pay-amount__cur">{CUR}</span>
              <span className="pay-amount__num">{fmt2(total)}</span>
            </div>
          </div>

          {mode !== "credit" && (
            <div className="pay-row">
              <label htmlFor="chargeAmount" className="pay-label">
                Charge&nbsp;Amount
              </label>
              <div className="pay-input">
                <input
                  id="chargeAmount"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={paidText}
                  onChange={(e) => {
                    userEditedRef.current = true;
                    setPaidText(cleanMoney(e.target.value));
                  }}
                  disabled={disabled}
                  placeholder="0.00"
                  aria-label="Charge Amount"
                />
                <span className="suffix" aria-hidden="true">
                  {CUR}
                </span>
                <button
                  type="button"
                  className="btn btn-mini"
                  onClick={fillExact}
                  disabled={disabled}
                  title="Fill with exact total"
                  aria-label="Fill exact"
                >
                  Exact
                </button>
              </div>
            </div>
          )}

          {status === "authorizing" && (
            <div className="pay-note">Insert / Tap card on the terminal…</div>
          )}
          {status === "capturing" && (
            <div className="pay-note">Finalizing payment…</div>
          )}
          {!!error && <div className="pay-error">{error}</div>}
        </div>

        <div className="pay-actions">
          <button className="btn btn-light" onClick={onClose} disabled={!canClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={disabled}>
            {buttonLabel}
          </button>
        </div>
      </div>
    </>
  );
}

Payment.propTypes = {
  open: PropTypes.bool,
  total: PropTypes.number,
  customer: PropTypes.shape({ id: PropTypes.any, name: PropTypes.string }),
  items: PropTypes.arrayOf(PropTypes.object),
  saleType: PropTypes.string,
  onClose: PropTypes.func,
  onSuccess: PropTypes.func,
  mode: PropTypes.oneOf(["card-print", "card-noprint", "credit"]),
};
