// src/components/InvoicePage.js
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { FaTimes, FaHome } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import './InvoicePage.css';

const two = (n) => Number(n || 0).toFixed(2);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '-');

/* ---------- payment helpers ---------- */
// normalize label
const normalizePayment = (raw) => {
  if (raw == null) return 'N/A';

  // support number codes too (adjust if your API uses different codes)
  if (typeof raw === 'number') {
    const byCode = ['Cash', 'Card', 'Bank', 'Paypal', 'Credit'];
    return byCode[raw] || 'N/A';
  }

  const v = String(raw).trim().toLowerCase();
  const map = {
    cash: 'Cash',
    card: 'Card',
    creditcard: 'Card',
    visa: 'Card',
    mastercard: 'Card',
    bank: 'Bank',
    transfer: 'Bank',
    banktransfer: 'Bank',
    wire: 'Bank',
    paypal: 'Paypal',
    credit: 'Credit',
  };
  return map[v] || (v ? v.charAt(0).toUpperCase() + v.slice(1) : 'N/A');
};

// deep scan for any key that *looks* like payment/mode/method
const findPaymentDeep = (obj) => {
  const stack = [obj];
  while (stack.length) {
    const cur = stack.pop();
    if (!cur || typeof cur !== 'object') continue;

    for (const [k, v] of Object.entries(cur)) {
      if (/^payment(Type|Mode)?$|payment|mode|method/i.test(k)) {
        // found something promising
        if (v != null && v !== '') return v;
      }
      if (v && typeof v === 'object') stack.push(v);
    }
  }
  return null;
};

const getPayment = (inv = {}) => {
  const raw =
    inv.paymentType ??
    inv.payment_type ??
    inv.paymentMode ??
    inv.payment_mode ??
    inv.payment ??
    inv.mode ??
    inv.method ??
    findPaymentDeep(inv); // final fallback (nested)
  return normalizePayment(raw);
};
/* ------------------------------------- */

const calcTotal = (inv) => {
  const quick = Number(
    inv.total ?? inv.totalAmount ?? inv.grandTotal ?? inv.netTotal ?? 0
  );
  if (!isNaN(quick) && quick > 0) return quick;

  if (Array.isArray(inv.items)) {
    return inv.items.reduce((sum, it) => {
      const line = Number(it.total) || (Number(it.price) || 0) * (Number(it.quantity) || 0);
      return sum + line;
    }, 0);
  }
  return 0;
};

export default function InvoicePage() {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchName, setSearchName] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get('/invoices');
        const list = Array.isArray(res.data) ? res.data : [];
        setInvoices(list);
        // Uncomment to inspect what the API actually sends:
        // console.debug('Sample invoice:', list[0]);
      } catch (err) {
        console.error('Error fetching invoices:', err);
        alert('Failed to load invoices.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // fixed filter options
  const paymentOptions = ['All', 'Cash', 'Card', 'Bank', 'Paypal', 'Credit'];

  const filtered = useMemo(() => {
    let list = invoices;

    if (searchName.trim()) {
      const q = searchName.toLowerCase();
      list = list.filter((inv) => (inv.customerName || '').toLowerCase().includes(q));
    }

    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      list = list.filter((inv) => {
        const d = inv.date ? new Date(inv.date) : null;
        return d && d >= from && d <= to;
      });
    }

    if (paymentFilter !== 'All') {
      list = list.filter((inv) => getPayment(inv) === paymentFilter);
    }

    return list;
  }, [invoices, searchName, fromDate, toDate, paymentFilter]);

  const totalAED = useMemo(
    () => filtered.reduce((s, inv) => s + calcTotal(inv), 0),
    [filtered]
  );

  const handlePrintA4 = (id) => {
    if (!id) return alert('Missing invoice ID');
    const url = `${window.location.origin}/invoice/a4/${encodeURIComponent(id)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleExportExcel = () => {
    const rows = filtered.map((inv) => ({
      'Invoice No': inv.invoiceNo,
      Date: fmtDate(inv.date),
      Customer: inv.customerName || 'N/A',
      'Payment Type': getPayment(inv),
      'Total (AED)': two(calcTotal(inv)),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoices');
    XLSX.writeFile(wb, 'invoice_list.xlsx');
  };

  return (
    <div className="invoice-page">
      <div className="invoice-page-header">
        <button className="home-btn" onClick={() => navigate('/dashboard')} title="Home" aria-label="Home">
          <FaHome />
        </button>

        <h2>🧾 <b>Invoice List</b></h2>

        <button className="create-btn" onClick={() => navigate('/invoice/form')}>➕ Create Invoice</button>
        <button className="btn-export" onClick={handleExportExcel}>📥 Export to Excel</button>

        <button className="btn-close" title="Close" onClick={() => navigate('/sales')} aria-label="Close">
          <FaTimes />
        </button>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search by Customer Name"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
          {paymentOptions.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="invoice-summary-row">
        <span><strong>Total Invoices: {filtered.length}</strong></span>
        <span><strong>Total AED: {two(totalAED)}</strong></span>
      </div>

      {loading ? (
        <p className="loading-text">Loading invoices...</p>
      ) : (
        <table className="invoice-table">
          <thead>
            <tr>
              <th>#</th><th>Invoice No</th><th>Date</th><th>Customer</th>
              <th>Payment Type</th><th>Total (AED)</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="7" className="no-data">No invoices found.</td></tr>
            ) : (
              filtered.map((inv, idx) => {
                const id = inv._id || inv.id || `${inv.invoiceNo}-${idx}`;
                return (
                  <tr key={id}>
                    <td>{idx + 1}</td>
                    <td>{inv.invoiceNo}</td>
                    <td>{fmtDate(inv.date)}</td>
                    <td>{inv.customerName || 'N/A'}</td>
                    <td>{getPayment(inv)}</td>
                    <td>{two(calcTotal(inv))}</td>
                    <td>
                      <button className="btn-a4" onClick={() => handlePrintA4(id)}>🖨️ A4</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
