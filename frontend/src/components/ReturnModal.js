// src/components/ReturnModal.js
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import PropTypes from "prop-types";
import "./ReturnModal.css";
import { FaCheck, FaCreditCard, FaUserShield, FaTimes, FaKey } from "react-icons/fa";
import { verifyReturnAuth } from "../api/managerAuth";

export default function ReturnModal({ onClose, onSubmit, requireCard = false }) {
  const [pin, setPin] = useState("");
  const [cardUid, setCardUid] = useState("");
  const [approver, setApprover] = useState(null); // { id, fullName, username }
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const pinRef = useRef(null);

  useEffect(() => { pinRef.current?.focus(); }, []);

  const pinValid   = useMemo(() => /^\d{4,8}$/.test(pin), [pin]);
  const hasCard    = useMemo(() => cardUid.trim().length > 0, [cardUid]);
  const canAttempt = pinValid || hasCard;
  const busy       = verifying || submitting;

  useEffect(() => {
    if (approver) setApprover(null);
    if (error) setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, cardUid]);

  const fail = useCallback((msg) => { setApprover(null); setError(msg); return false; }, []);

  const doVerify = useCallback(async () => {
    if (requireCard && !hasCard) return fail("Scan card to proceed.");
    if (!canAttempt) return fail("Enter a 4–8 digit PIN or scan a card.");

    setVerifying(true);
    setError("");

    try {
      const payload = {};
      if (pinValid) payload.pin = pin;
      if (hasCard)  payload.cardUid = cardUid;

      const res = await verifyReturnAuth(payload); // → { ok, user? }
      if (res?.ok && res?.user) { setApprover(res.user); return true; }
      return fail(res?.message || "Invalid PIN / card.");
    } catch (e) {
      return fail(e?.response?.data?.message || e?.message || "Verification failed.");
    } finally {
      setVerifying(false);
    }
  }, [requireCard, hasCard, canAttempt, pinValid, pin, cardUid, fail]);

  const handleConfirm = useCallback(async () => {
    if (!approver) { const ok = await doVerify(); if (!ok) return; }

    setSubmitting(true);
    setError("");
    try {
      const proceed =
        (await onSubmit?.({
          approver,
          pin: pinValid ? pin : null,
          cardUid: hasCard ? cardUid : null,
        })) ?? true;

      if (proceed !== false) onClose();
    } catch (e) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }, [approver, doVerify, onSubmit, pinValid, pin, hasCard, cardUid, onClose]);

  const onKeyDown = useCallback((e) => {
    if (e.key === "Enter") void doVerify();
    if (e.key === "Escape") onClose();
  }, [doVerify, onClose]);

  return (
    <div className="return-modal" role="dialog" aria-modal="true"
         aria-labelledby="return-auth-title" aria-busy={busy} onKeyDown={onKeyDown}>
      <div className="return-header">
        <h2 id="return-auth-title">RETURN AUTHENTICATION</h2>
        <button className="close-btn" type="button" onClick={onClose} aria-label="Close">
          <FaTimes />
        </button>
      </div>

      <div className="return-body">
        <label htmlFor="ret-pin">PIN <FaKey /></label>
        <input
          id="ret-pin"
          ref={pinRef}
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={8}
          placeholder="4–8 digits"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          disabled={busy}
          autoComplete="one-time-code"
          aria-invalid={!!error && !pinValid}
        />

        <label htmlFor="ret-card">Card Scan <FaCreditCard /></label>
        <input
          id="ret-card"
          type="text"
          value={cardUid}
          onChange={(e) => setCardUid(e.target.value.trim())}
          placeholder="Scan Card"
          disabled={busy}
        />

        <div className="verify-row">
          <button type="button" className="verify-btn" onClick={doVerify}
                  disabled={busy || !canAttempt} title="Verify now (Enter)">
            {verifying ? "Verifying…" : "Verify"}
          </button>

          {approver && (
            <div className="approver-pill" title={approver.username}>
              <FaUserShield /> Approved: <b>{approver.fullName || approver.username}</b>
            </div>
          )}
        </div>

        {!!error && <div className="error-msg" role="alert" aria-live="polite">{error}</div>}

        <div className="return-actions">
          <button className="ok-btn" type="button" onClick={handleConfirm}
                  disabled={busy || !approver} title={!approver ? "Verify first" : "Confirm return"}>
            <FaCheck /> OK
          </button>
          <button className="cancel-btn" type="button" onClick={onClose} disabled={busy}>
            <FaTimes /> Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

ReturnModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func,      // will POST the ReturnTxn to backend
  requireCard: PropTypes.bool,
};
