// src/components/Sales/RecurringHistory.jsx
import React, { useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import "./RecurringHistory.css";

const fmtDateTime = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? "—" : dt.toLocaleString();
};
const money = (n) => `AED ${(Number(n) || 0).toFixed(2)}`;

export default function RecurringHistory({ data, onClose }) {
  // history array comes from backend DTO: { invoiceId, invoiceNo, createdAt/date, total, items[] }
  const history = useMemo(
    () => (Array.isArray(data?.history) ? data.history : []),
    [data]
  );

  // close on Escape
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const titleCustomer = data?.customerName || "Customer";
  const tail = (data?.templateId && String(data.templateId).slice(-6)) || "—";

  return (
    <div
      className="mini-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Recurring history"
    >
      <div
        className="mini-modal history-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mini-modal-head">
          <h3>
            History — {titleCustomer} <span style={{ opacity: 0.7 }}>
              (Template {tail})
            </span>
          </h3>
          <button className="icon-btn close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="table-wrap">
          <table className="recurring-invoices-table history-table">
            <thead>
              <tr>
                <th>Generated Invoice</th>
                <th>Date</th>
                <th className="right">Total</th>
              </tr>
            </thead>

            <tbody>
              {history.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center" }}>
                    No invoices generated yet.
                  </td>
                </tr>
              )}

              {history.map((h, idx) => {
                const key = h.invoiceId || h.invoiceNo || idx;
                const items = Array.isArray(h.items) ? h.items : [];

                return (
                  <React.Fragment key={key}>
                    <tr>
                      <td>{h.invoiceNo || "—"}</td>
                      <td>{fmtDateTime(h.createdAt || h.date)}</td>
                      <td className="right">{money(h.total)}</td>
                    </tr>

                    <tr>
                      <td colSpan={3}>
                        {items.length === 0 ? (
                          <i style={{ color: "#666" }}>No items</i>
                        ) : (
                          <table className="items-subtable">
                            <thead>
                              <tr>
                                <th style={{ width: 120 }}>Item Code</th>
                                <th>Description</th>
                                <th style={{ width: 80 }} className="right">
                                  Qty
                                </th>
                                <th style={{ width: 120 }} className="right">
                                  Price
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((it, i) => (
                                <tr key={i}>
                                  <td>{it.itemCode || "—"}</td>
                                  <td>{it.description || "—"}</td>
                                  <td className="right">{Number(it.qty) || 0}</td>
                                  <td className="right">{money(it.price)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

RecurringHistory.propTypes = {
  data: PropTypes.shape({
    customerName: PropTypes.string,
    templateId: PropTypes.string,
    history: PropTypes.arrayOf(
      PropTypes.shape({
        invoiceId: PropTypes.string,
        invoiceNo: PropTypes.string,
        createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
        date: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
        total: PropTypes.number,
        items: PropTypes.arrayOf(
          PropTypes.shape({
            itemCode: PropTypes.string,
            description: PropTypes.string,
            qty: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          })
        ),
      })
    ),
  }),
  onClose: PropTypes.func,
};

RecurringHistory.defaultProps = {
  data: null,
  onClose: () => {},
};
