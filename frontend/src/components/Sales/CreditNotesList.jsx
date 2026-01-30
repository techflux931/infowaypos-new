// src/components/Sales/CreditNotesList.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import './CreditNotesList.css';
import { FaHome, FaPlus, FaSearch, FaSync, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';

const PAGE_SIZE = 10;

export default function CreditNotesList() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [status, setStatus] = useState(''); // '', Draft, Open, Void
  const [q, setQ] = useState('');
  const [qLive, setQLive] = useState('');

  const controllerRef = useRef(null);

  // debounce: type -> q
  useEffect(() => {
    const t = setTimeout(() => setQ(qLive.trim()), 350);
    return () => clearTimeout(t);
  }, [qLive]);

  // when filters change, go back to first page
  useEffect(() => { setPage(0); }, [status, q]);

  const fmtCurrency = useMemo(
    () => new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }),
    []
  );
  const fmtDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

  const fetchData = useCallback(async () => {
    // cancel any in-flight request
    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    try {
      const params = { page, size: PAGE_SIZE };
      if (status) params.status = status;
      if (q) params.q = q;

      const { data } = await axios.get('/credit-notes', { params, signal: controller.signal });

      setRows(Array.isArray(data?.content) ? data.content : []);
      setTotalPages(Number(data?.totalPages || 0));
      setTotalElements(Number(data?.totalElements || 0));
    } catch (err) {
      // ignore aborts
      if (err?.name === 'CanceledError') return;
      const resp = err?.response;
      const msg =
        resp?.data?.message ||
        resp?.data?.error ||
        (typeof resp?.data === 'string' ? resp.data : '') ||
        err.message;
      console.error('Failed to load credit notes:', resp?.status, resp?.data || err);
      alert(`Failed to load credit notes: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [page, status, q]);

  useEffect(() => {
    fetchData();
    return () => {
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, [fetchData]);

  const onDelete = async (id) => {
    if (!window.confirm('Delete this credit note?')) return;
    try {
      await axios.delete(`/credit-notes/${id}`);
      fetchData();
    } catch (err) {
      const resp = err?.response;
      const msg =
        resp?.data?.message ||
        resp?.data?.error ||
        (typeof resp?.data === 'string' ? resp.data : '') ||
        err.message;
      console.error('Delete failed:', resp?.status, resp?.data || err);
      alert(`Delete failed: ${msg}`);
    }
  };

  return (
    <div className="cn-list-container">
      <div className="cn-header">
        <button className="icon-button" title="Home" type="button" onClick={() => navigate('/dashboard')}>
          <FaHome />
        </button>
        <h2>Credit Notes</h2>
        <div className="cn-header-right">
          <button className="cn-btn primary" onClick={() => navigate('/sales/creditnotes/new')} disabled={loading}>
            <FaPlus /> New
          </button>
          <button className="cn-btn" onClick={fetchData} title="Refresh" disabled={loading}>
            <FaSync />
          </button>
          <button className="icon-button close-button" title="Close" onClick={() => navigate('/sales')} type="button">
            <FaTimes />
          </button>
        </div>
      </div>

      <div className="cn-toolbar">
        <div className="cn-tabs">
          {['', 'Draft', 'Open', 'Void'].map((t) => (
            <button
              key={t || 'all'}
              className={`cn-tab ${status === t ? 'active' : ''}`}
              onClick={() => setStatus(t)}
              disabled={loading}
            >
              {t || 'All'}
            </button>
          ))}
        </div>

        <div className="cn-search">
          <FaSearch />
          <input
            type="text"
            placeholder="Search customer…"
            value={qLive}
            onChange={(e) => setQLive(e.target.value)}
          />
        </div>
      </div>

      <div className="cn-table-wrap">
        <table className="cn-table">
          <thead>
            <tr>
              <th>CN#</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Reference</th>
              <th>Salesperson</th>
              <th>Status</th>
              <th className="num">Sub Total</th>
              <th className="num">Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" className="center">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan="9" className="center">No credit notes found</td></tr>
            ) : (
              rows.map((r) => {
                const id = r.id || r._id;
                const cnNo = r.creditNoteNo || r.cnNumber || '-';
                const dateIso = r.creditNoteDate || r.date || null;
                const customer = r.customerName || r.customerId || '-';
                const ref = r.referenceNo || r.reference || '-';
                const sales = r.salesperson || '-';
                const st = r.status || '-';
                const sub = Number(r.subTotal ?? 0);
                const tot = Number(r.total ?? sub);

                return (
                  <tr key={id}>
                    <td>{cnNo}</td>
                    <td>{fmtDate(dateIso)}</td>
                    <td>{customer}</td>
                    <td>{ref}</td>
                    <td>{sales}</td>
                    <td><span className={`badge ${String(st).toLowerCase()}`}>{st}</span></td>
                    <td className="num">{fmtCurrency.format(sub)}</td>
                    <td className="num">{fmtCurrency.format(tot)}</td>
                    <td className="actions">
                      <button
                        className="table-icon edit"
                        title="Edit"
                        onClick={() => navigate(`/sales/creditnotes/${id}`)}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="table-icon delete"
                        title="Delete"
                        onClick={() => onDelete(id)}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="cn-pagination">
        <div className="info">{totalElements} record{totalElements === 1 ? '' : 's'}</div>
        <div className="pager">
          <button
            className="cn-btn"
            disabled={page <= 0 || loading}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            ‹ Prev
          </button>
          <span className="page-indicator">Page {page + 1} / {Math.max(1, totalPages)}</span>
          <button
            className="cn-btn"
            disabled={page + 1 >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next ›
          </button>
        </div>
      </div>
    </div>
  );
}
