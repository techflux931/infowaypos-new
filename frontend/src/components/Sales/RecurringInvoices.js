// src/components/Sales/RecurringInvoices.jsx
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import "./RecurringInvoices.css";

export default function RecurringInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);              // {type:'error'|'ok', msg:string}
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null);        // full recurring with items

  // NEW: history modal state
  const [histOpen, setHistOpen] = useState(false);
  const [histData, setHistData] = useState(null);        // { templateId, customerName, history: [...] }

  const navigate = useNavigate();

  /* ---------- helpers ---------- */
  const fmtDate = useCallback((d) => {
    if (!d) return "—";
    const dt = new Date(d);
    return Number.isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString();
  }, []);

  const displayInvoiceNo = useCallback((inv) => {
    const tail = String(inv?.id || "").slice(-6) || "—";
    return inv?.invoiceNoPrefix ? `${inv.invoiceNoPrefix}${tail}` : tail;
  }, []);

  const showToast = (msg, type = "error") => {
    setToast({ msg, type });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 2800);
  };

  const errMsg = (e) => {
    if (e?.response?.data?.message) return e.response.data.message;
    if (e?.message) return e.message;
    return "Request failed";
  };

  const refresh = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("/sales/recurring-invoices", { signal });
      setInvoices(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      if (err.name !== "CanceledError" && err.message !== "canceled") {
        console.error(err);
        setError("Failed to fetch recurring invoices.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  /* ---------- nav ---------- */
  const handleHomeClick = () => navigate("/dashboard");
  const handleCloseClick = () =>
    window.history.length > 1 ? navigate(-1) : navigate("/sales/recurring");
  const handleAddNewClick = () => navigate("/sales/recurring/new");
  const handleEdit = (id) => navigate(`/sales/recurring/${id}/edit`);

  /* ---------- row actions (w/ safe error handling) ---------- */
  const doRowAction = async (id, fn, okMsg) => {
    try {
      setBusyId(id);
      await fn();
      await refresh();
      if (okMsg) showToast(okMsg, "ok");
    } catch (e) {
      console.error(e);
      showToast(errMsg(e), "error");
    } finally {
      setBusyId(null);
    }
  };

  const handlePause = (id) =>
    doRowAction(id, () => axios.patch(`/sales/recurring-invoices/${id}/pause`), "Paused");

  const handleResume = (id) =>
    doRowAction(id, () => axios.patch(`/sales/recurring-invoices/${id}/resume`), "Resumed");

  const handleDelete = (id) => {
    if (!window.confirm("Delete this recurring invoice?")) return;
    doRowAction(id, () => axios.delete(`/sales/recurring-invoices/${id}`), "Deleted");
  };

  const handleRunNow = (id) =>
    doRowAction(
      id,
      async () => { await axios.post(`/sales/recurring-invoices/${id}/run-now`); },
      "Invoice generated"
    );

  /* ---------- view & print ---------- */
  const fetchFull = async (id) => {
    const res = await axios.get(`/sales/recurring-invoices/${id}`);
    return res.data || {};
  };

  const handleView = async (id) => {
    try {
      setBusyId(id);
      const full = await fetchFull(id);
      setViewData(full);
      setViewOpen(true);
    } catch (e) {
      console.error(e);
      showToast("Failed to load details", "error");
    } finally {
      setBusyId(null);
    }
  };

  const printHTMLviaIframe = (html) => {
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
    const go = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } finally {
        setTimeout(() => document.body.removeChild(iframe), 500);
      }
    };
    if ("onload" in iframe) iframe.onload = () => setTimeout(go, 150);
    else setTimeout(go, 200);
  };

  const buildPrintHTML = (rec) => {
    const items = Array.isArray(rec.items) ? rec.items : [];
    const fmtAED = (n) =>
      Number.isFinite(Number(n)) ? `AED ${Number(n).toFixed(2)}` : "AED 0.00";
    const today = new Date().toLocaleString();

    return `<!doctype html>
<html><head><meta charset="utf-8"/>
<title>Recurring - ${displayInvoiceNo(rec)}</title>
<style>
@page { size: A4; margin: 14mm; }
body { font-family: "Segoe UI", Arial, sans-serif; color:#222; }
h1 { font-size: 20px; margin: 0 0 6px; color:#4a1d75; }
.meta { font-size: 12px; color:#555; margin-bottom:10px; }
table { width:100%; border-collapse:collapse; margin-top:8px; }
th, td { border-bottom:1px solid #eee; padding:8px; font-size:13px; text-align:left; }
th { background:#f6f1ff; color:#4a1d75; }
.right { text-align:right; }
.footer { margin-top:20px; text-align:center; font-size:11px; color:#666; }
</style></head>
<body>
  <h1>Recurring Invoice Template</h1>
  <div class="meta">
    Printed: ${today} &nbsp;&nbsp; | &nbsp;&nbsp;
    Customer: ${rec.customerName || "—"} &nbsp;&nbsp; | &nbsp;&nbsp;
    Frequency: ${rec.frequency || "—"}
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:44px;">#</th>
        <th style="width:140px;">Item Code</th>
        <th>Description</th>
        <th class="right" style="width:70px;">Qty</th>
        <th class="right" style="width:90px;">Price</th>
      </tr>
    </thead>
    <tbody>
      ${items
        .map((it, i) => {
          const qty = Number(it.qty) || 0;
          const price = Number(it.price) || 0;
          return `<tr>
            <td>${i + 1}</td>
            <td>${it.itemCode || "—"}</td>
            <td>${it.description || "—"}</td>
            <td class="right">${qty}</td>
            <td class="right">${fmtAED(price)}</td>
          </tr>`;
        })
        .join("")}
      ${items.length === 0 ? `<tr><td colspan="5">No items.</td></tr>` : ""}
    </tbody>
  </table>
  <div class="footer">Thank you.</div>
</body></html>`;
  };

  const handlePrint = async (id) => {
    try {
      setBusyId(id);
      const rec = viewData?.id === id ? viewData : await fetchFull(id);
      printHTMLviaIframe(buildPrintHTML(rec));
    } catch (e) {
      console.error(e);
      showToast("Print failed", "error");
    } finally {
      setBusyId(null);
    }
  };

  /* ---------- HISTORY (NEW) ---------- */
  // API expected: GET /sales/recurring-invoices/:id/history
  // Response shape:
  // { templateId, customerName, history: [{ invoiceNo, date, total, items:[{itemCode, description, qty, price}] }] }
  const handleHistory = async (id) => {
    try {
      setBusyId(id);
      const res = await axios.get(`/sales/recurring-invoices/${id}/history`);
      setHistData(res.data || { history: [] });
      setHistOpen(true);
    } catch (e) {
      console.error(e);
      showToast("Failed to load history", "error");
    } finally {
      setBusyId(null);
    }
  };

  const badgeClass = (status) => `badge ${status || ""}`;
  const money = (n) => `AED ${(Number(n) || 0).toFixed(2)}`;
  const fmtDateTime = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    return Number.isNaN(dt.getTime()) ? "—" : dt.toLocaleString();
  };

  /* ---------- UI ---------- */
  return (
    <div className="recurring-invoices-container">
      <div className="recurring-header">
        <button className="icon-btn home-btn" title="Home" onClick={handleHomeClick}>🏠</button>
        <h2>Recurring Invoices</h2>
        <button className="icon-btn close-btn" title="Close" onClick={handleCloseClick}>❌</button>
      </div>

      <button className="add-new-btn" onClick={handleAddNewClick}>+ Add New</button>

      {loading && <p>Loading…</p>}
      {!loading && error && <p style={{ color: "#b00020", fontWeight: 600 }}>{error}</p>}

      {!loading && !error && (
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
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center" }}>No recurring invoices found.</td>
                </tr>
              )}
              {invoices.map((inv) => {
                const id = inv.id;
                const disabled = busyId === id;
                const status = String(inv.status || "—").toUpperCase();

                return (
                  <tr key={id}>
                    <td>{displayInvoiceNo(inv)}</td>
                    <td>{inv.customerName || "—"}</td>
                    <td>{fmtDate(inv.startDate)}</td>
                    <td>{fmtDate(inv.endDate)}</td>
                    <td>{inv.frequency || "—"}</td>
                    <td>{fmtDate(inv.nextRunDate)}</td>
                    <td><span className={badgeClass(status)}>{status}</span></td>
                    <td className="actions-cell">
                      {/* Always available */}
                      <button type="button" className="btn btn-ghost"   onClick={() => handleView(id)}    disabled={disabled}>View</button>
                      <button type="button" className="btn btn-ghost"   onClick={() => handleHistory(id)} disabled={disabled}>History</button>
                      <button type="button" className="btn btn-ghost"   onClick={() => handlePrint(id)}   disabled={disabled}>Print</button>

                      {/* ACTIVE */}
                      {status === "ACTIVE" && (
                        <>
                          <button className="btn btn-primary" onClick={() => handleEdit(id)}    disabled={disabled}>Edit</button>
                          <button className="btn btn-ghost"   onClick={() => handlePause(id)}   disabled={disabled}>Pause</button>
                          <button className="btn btn-primary" onClick={() => handleRunNow(id)}   disabled={disabled}>Run Now</button>
                          <button className="btn btn-danger"  onClick={() => handleDelete(id)}   disabled={disabled}>Delete</button>
                        </>
                      )}

                      {/* PAUSED */}
                      {status === "PAUSED" && (
                        <>
                          <button className="btn btn-primary" onClick={() => handleEdit(id)}   disabled={disabled}>Edit</button>
                          <button className="btn btn-ghost"   onClick={() => handleResume(id)} disabled={disabled}>Resume</button>
                          <button className="btn btn-danger"  onClick={() => handleDelete(id)} disabled={disabled}>Delete</button>
                        </>
                      )}

                      {/* ENDED / others */}
                      {status !== "ACTIVE" && status !== "PAUSED" && (
                        <button className="btn btn-danger" onClick={() => handleDelete(id)} disabled={disabled}>Delete</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* View Modal */}
      {viewOpen && (
        <div className="mini-modal-backdrop" onClick={() => setViewOpen(false)}>
          <div className="mini-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mini-modal-head">
              <h3>Recurring Details</h3>
              <button className="icon-btn close-btn" onClick={() => setViewOpen(false)}>✕</button>
            </div>

            {!viewData ? (
              <p>Loading…</p>
            ) : (
              <>
                <div className="view-meta">
                  <div><b>Invoice No:</b> {displayInvoiceNo(viewData)}</div>
                  <div><b>Customer:</b> {viewData.customerName || "—"}</div>
                  <div><b>Frequency:</b> {viewData.frequency || "—"}</div>
                  <div><b>Status:</b> {viewData.status || "—"}</div>
                </div>

                <div className="table-wrap">
                  <table className="recurring-invoices-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Item Code</th>
                        <th>Description</th>
                        <th>Qty</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(viewData.items || []).length === 0 && (
                        <tr><td colSpan={5} style={{ textAlign: "center" }}>No items</td></tr>
                      )}
                      {(viewData.items || []).map((it, i) => (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td>{it.itemCode || "—"}</td>
                          <td>{it.description || "—"}</td>
                          <td>{Number(it.qty) || 0}</td>
                          <td>AED {(Number(it.price) || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* History Modal (NEW) */}
      {histOpen && (
        <div className="mini-modal-backdrop" onClick={() => setHistOpen(false)}>
          <div className="mini-modal" style={{ maxWidth: 960 }} onClick={(e) => e.stopPropagation()}>
            <div className="mini-modal-head">
              <h3>
                History — {histData?.customerName || "Customer"}
                {histData?.templateId && <> (Template {String(histData.templateId).slice(-6)})</>}
              </h3>
              <button className="icon-btn close-btn" onClick={() => setHistOpen(false)}>✕</button>
            </div>

            {!histData ? (
              <p>Loading…</p>
            ) : (
              <div className="table-wrap">
                <table className="recurring-invoices-table">
                  <thead>
                    <tr>
                      <th>Generated Invoice</th>
                      <th>Date</th>
                      <th className="right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(histData.history || []).length === 0 && (
                      <tr><td colSpan={3} style={{ textAlign: "center" }}>No invoices generated yet.</td></tr>
                    )}

                    {(histData.history || []).map((h, idx) => (
                      <React.Fragment key={idx}>
                        <tr>
                          <td>{h.invoiceNo || "—"}</td>
                          <td>{fmtDateTime(h.date)}</td>
                          <td className="right">{money(h.total)}</td>
                        </tr>
                        <tr>
                          <td colSpan={3}>
                            {(h.items || []).length === 0 ? (
                              <i style={{ color: "#666" }}>No items</i>
                            ) : (
                              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
                                <thead>
                                  <tr>
                                    <th style={{ width: 140, background: "#faf6ff", color: "#4a1d75" }}>Item Code</th>
                                    <th style={{ background: "#faf6ff", color: "#4a1d75" }}>Description</th>
                                    <th style={{ width: 80,  background: "#faf6ff", color: "#4a1d75", textAlign: "right" }}>Qty</th>
                                    <th style={{ width: 120, background: "#faf6ff", color: "#4a1d75", textAlign: "right" }}>Price</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {h.items.map((it, i) => (
                                    <tr key={i}>
                                      <td style={{ borderBottom: "1px solid #eee", padding: "6px 8px" }}>{it.itemCode || "—"}</td>
                                      <td style={{ borderBottom: "1px solid #eee", padding: "6px 8px" }}>{it.description || "—"}</td>
                                      <td style={{ borderBottom: "1px solid #eee", padding: "6px 8px", textAlign: "right" }}>{Number(it.qty) || 0}</td>
                                      <td style={{ borderBottom: "1px solid #eee", padding: "6px 8px", textAlign: "right" }}>{money(it.price)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type === "ok" ? "ok" : "err"}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
