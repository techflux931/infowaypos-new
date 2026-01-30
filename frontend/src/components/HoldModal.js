import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import api from "../api/axios";
import "./HoldModal.css";

const AED = new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED" });
const fmtDate = (v) =>
  v
    ? new Date(v).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";
const getId = (x) => x?._id ?? x?.id ?? null;

export default function HoldModal({ onClose, onSelect }) {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const searchRef = useRef(null);
  const HOLDS_API = "/pos/holds";

  const fetchHolds = useCallback(async (term = "") => {
    setLoading(true);
    setErr("");
    try {
      const { data } = await api.get(HOLDS_API, {
        params: { q: term || undefined, limit: 200 },
      });
      const list = Array.isArray(data) ? data : data?.content ?? [];
      setRows(list);
      setActive(0);
    } catch (e) {
      setRows([]);
      setErr(e?.response?.data?.message || "Failed to load holds");
    } finally {
      setLoading(false);
    }
  }, []);

  // initial load + autofocus
  useEffect(() => {
    fetchHolds();
    const t = setTimeout(() => searchRef.current?.focus(), 40);
    return () => clearTimeout(t);
  }, [fetchHolds]);

  // debounced search
  useEffect(() => {
    const t = setTimeout(() => fetchHolds(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query, fetchHolds]);

  const filtered = useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (r) =>
        String(r?.serialNo ?? "").toLowerCase().includes(s) ||
        String(r?.customer?.name ?? "").toLowerCase().includes(s)
    );
  }, [rows, query]);

  const current = filtered[active] || null;

  const selectCurrent = useCallback(() => {
    if (current) onSelect(current);
  }, [current, onSelect]);

  const deleteCurrent = useCallback(async () => {
    const id = getId(current);
    if (!id) return;
    if (!window.confirm("Delete this held invoice?")) return;
    try {
      await api.delete(`${HOLDS_API}/${id}`);
      setRows((prev) => prev.filter((x) => getId(x) !== id));
      setActive((a) => Math.max(0, a - 1));
    } catch (e) {
      alert(e?.response?.data?.message || "Delete failed");
    }
  }, [current]);

  // keyboard: Esc / Enter / Delete / Up / Down
  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Enter") {
        e.preventDefault();
        selectCurrent();
      } else if (e.key === "Delete") {
        e.preventDefault();
        deleteCurrent();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => Math.min(a + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [filtered.length, selectCurrent, deleteCurrent, onClose]);

  return (
    <>
      <div className="hold-backdrop" onClick={onClose} />
      <div className="hold-modal" role="dialog" aria-modal="true" aria-label="Invoice Hold">
        {/* Header */}
        <div className="hold-header">
          <h2>INVOICE HOLD</h2>
          <button className="hold-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Search */}
        <div className="hold-search-row">
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by serial or customer"
            className="hold-search"
            aria-label="Search holds"
          />
          {loading && <span className="hold-loading">Loading…</span>}
          {!!err && <span className="hold-error">{err}</span>}
        </div>

        {/* Table */}
        <div className="hold-table" role="table" aria-label="Held invoices">
          <div className="hold-thead" role="row">
            <div className="col-no" role="columnheader">No</div>
            <div className="col-date" role="columnheader">Date</div>
            <div className="col-serial" role="columnheader">Serial No</div>
            <div className="col-customer" role="columnheader">Customer</div>
            <div className="col-amt" role="columnheader">Net Amount</div>
          </div>

          <div className="hold-tbody" role="rowgroup">
            {filtered.length === 0 && (
              <div className="hold-empty">{loading ? "Loading…" : "No records found"}</div>
            )}

            {filtered.map((r, i) => (
              <button
                key={getId(r) ?? i}
                className={`hold-row ${i === active ? "is-active" : ""}`}
                onClick={() => setActive(i)}
                onDoubleClick={selectCurrent}
                title={r?.serialNo || ""}
                role="row"
              >
                <div className="col-no" role="cell">{i + 1}</div>
                <div className="col-date" role="cell">{fmtDate(r?.date)}</div>
                <div className="col-serial" role="cell">{r?.serialNo ?? "-"}</div>
                <div className="col-customer" role="cell">{r?.customer?.name ?? "-"}</div>
                <div className="col-amt" role="cell">{AED.format(Number(r?.netAmount ?? 0))}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="hold-actions">
          <button className="btn-danger" onClick={deleteCurrent} disabled={!current}>🗑 Delete</button>
          <button className="btn-primary" onClick={selectCurrent} disabled={!current}>✓ Select</button>
          <button className="btn-light" onClick={onClose}>✖ Close</button>
        </div>
      </div>
    </>
  );
}

HoldModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
};
