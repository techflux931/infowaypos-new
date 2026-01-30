// src/components/Sales/recurring/RecurringList.jsx
import React, { useEffect, useState } from "react";
import axios from "../../../api/axios";
import EditRecurringModal from "./EditRecurringModal";
import "../RecurringInvoices.css";       // <-- bring in table/button/badge styles
import "./EditRecurringModal.css";       // modal styles

export default function RecurringList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);

  const fmtDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    return Number.isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString();
  };

  const load = async () => {
    try {
      const res = await axios.get("/recurring"); // your GET endpoint
      setRows(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleEditClick = (row) => {
    setEditing(row);
    setOpen(true);
  };

  const handleSaved = (updated) => {
    setRows((list) =>
      list.map((r) => (r.id === updated.id || r._id === updated.id ? updated : r))
    );
  };

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ padding: 16 }}>
      <h2>Recurring Invoices</h2>

      <div className="table-wrap">
        <table className="recurring-invoices-table">
          <thead>
            <tr>
              <th>Invoice No</th>
              <th>Customer</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Frequency</th>
              <th>Next Run Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => {
              const id = r.id || r._id;
              const status = String(r.status || "").toUpperCase();
              return (
                <tr key={id}>
                  <td>{r.invoiceNo || String(id).slice(-6)}</td>
                  <td>{r.customerName || "—"}</td>
                  <td>{fmtDate(r.startDate)}</td>
                  <td>{fmtDate(r.endDate)}</td>
                  <td>{r.frequency || "—"}</td>
                  <td>{fmtDate(r.nextRunDate)}</td>
                  <td>
                    <span className={`badge ${status}`}>{status || "—"}</span>
                  </td>
                  <td>
                    <button className="btn btn-primary" onClick={() => handleEditClick(r)}>
                      Edit
                    </button>
                    {/* add more actions here if you want (Pause/Resume/Delete/Run Now)
                       and use btn-ghost / btn-danger as in RecurringInvoices.css */}
                  </td>
                </tr>
              );
            })}

            {rows.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: "center" }}>No data</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <EditRecurringModal
        open={open}
        onClose={() => setOpen(false)}
        data={editing}
        onSaved={handleSaved}
      />
    </div>
  );
}
