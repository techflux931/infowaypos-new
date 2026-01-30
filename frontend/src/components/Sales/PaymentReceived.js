import React, { useEffect, useState, useCallback, useRef } from 'react';
import { FaPlus, FaHome, FaTimes, FaPrint } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../../api/axios';
import './PaymentReceived.css';

const fmtAED = new Intl.NumberFormat('en-AE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatUaeDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

export default function PaymentReceived() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  // keep latest search string without re-subscribing effects
  const searchRef = useRef('');
  useEffect(() => { searchRef.current = search; }, [search]);

  const navigate = useNavigate();
  const location = useLocation();

  const fetchPayments = useCallback(async (q, t) => {
    setLoading(true);
    try {
      const res = await axios.get('/payments', {
        params: { search: q || undefined, type: t !== 'All' ? t : undefined },
      });
      setPayments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPayments('', 'All'); }, [fetchPayments]);

  useEffect(() => { fetchPayments(searchRef.current, filter); }, [filter, fetchPayments]);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchPayments(searchRef.current, filter);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate, fetchPayments, filter]);

  const openPrint = (p) => {
    const id = p?.id || p?._id;
    if (id) window.open(`/print/payment/${id}`, '_blank');
  };

  return (
    <div className="payment-received-container full-screen">
      {/* Header */}
      <div className="payment-header">
        <button className="icon-btn home-btn" title="Home" onClick={() => navigate('/dashboard')}>
          <FaHome />
        </button>

        <h2>Payments Received</h2>

        <div className="header-actions">
          <button className="btn primary add-btn" onClick={() => navigate('/payment/new')}>
            <FaPlus /> Add Payment
          </button>
          <button className="close-square" title="Close" onClick={() => navigate('/SALES')}>
            <FaTimes />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="payment-filters">
        <input
          type="text"
          placeholder="Search by Customer Name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchPayments(search, filter)}
          aria-label="Search by Customer Name"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filter Payment Types"
        >
          <option value="All">All Payment Types</option>
          <option value="Cash">Cash</option>
          <option value="Card">Card</option>
          <option value="Bank">Bank</option>
          <option value="Paypal">Paypal</option>
          <option value="Manual">Manual / Offline</option>
        </select>
        <button className="btn" onClick={() => fetchPayments(search, filter)} disabled={loading}>
          Search
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <p className="muted">Loading payments...</p>
      ) : (
        <table className="payment-table" aria-label="Payments Received Table">
          <thead>
            <tr>
              <th>#</th>
              <th>Payment Date</th>
              <th>Customer</th>
              <th>Payment Type</th>
              <th className="amt">Amount (AED)</th>
              <th>Reference</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.length ? (
              payments.map((p, idx) => (
                <tr key={p.id || p._id || idx}>
                  <td>{idx + 1}</td>
                  <td>{formatUaeDate(p.date)}</td>
                  <td>{p.customerName}</td>
                  <td>{p.paymentType}</td>
                  <td className="amt">{fmtAED.format(Number(p.amount ?? 0))}</td>
                  <td>{p.reference || '—'}</td>
                  <td>
                    <button className="btn ghost" title="Print Receipt" onClick={() => openPrint(p)}>
                      <FaPrint /> Print
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="7" className="empty">No payments found.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
