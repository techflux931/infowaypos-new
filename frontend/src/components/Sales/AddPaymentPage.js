import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaTimes, FaSave } from 'react-icons/fa';
import axios from '../../api/axios';
import './AddPaymentPage.css';

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function AddPaymentPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: todayISO(),
    customerName: '',
    paymentType: 'Cash',
    amount: '',
    reference: '',
    invoiceId: '',
    notes: '',
  });

  const onChange = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  const cancel = () => navigate('/payment');

  const save = async (e) => {
    e.preventDefault();
    if (!form.customerName || !form.amount) {
      alert('Customer and Amount are required.'); return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        date: new Date(form.date + 'T00:00:00').toISOString(),
      };
      await axios.post('/payments', payload);
      navigate('/payment', { replace: true, state: { refresh: true } });
    } catch (err) {
      console.error('Save payment failed:', err);
      alert('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const uaeDateLabel = new Date(form.date).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });

  return (
    <div className="addpay-page">
      <div className="addpay-topbar">
        <button className="icon-btn" title="Home" onClick={() => navigate('/dashboard')}><FaHome /></button>
        <h2>Add Payment</h2>
        <button className="close-square" title="Close" onClick={cancel}><FaTimes /></button>
      </div>

      <form className="addpay-form" onSubmit={save}>
        <div className="row">
          <label>Date <span className="muted">(UAE)</span></label>
          <div className="date-inline">
            <input type="date" value={form.date} onChange={(e)=>onChange('date', e.target.value)} />
            <span className="uae-date">{uaeDateLabel}</span>
          </div>
        </div>

        <div className="row">
          <label>Customer</label>
          <input
            type="text"
            placeholder="Customer name"
            value={form.customerName}
            onChange={(e)=>onChange('customerName', e.target.value)}
          />
        </div>

        <div className="row two">
          <div>
            <label>Payment Type</label>
            <select value={form.paymentType} onChange={(e)=>onChange('paymentType', e.target.value)}>
              <option>Cash</option><option>Card</option><option>Bank</option>
              <option>Paypal</option><option>Manual</option>
            </select>
          </div>
          <div>
            <label>Amount (AED)</label>
            <input type="number" step="0.01" min="0"
              value={form.amount}
              onChange={(e)=>onChange('amount', e.target.value)} />
          </div>
        </div>

        <div className="row two">
          <div>
            <label>Reference</label>
            <input placeholder="Txn / Cheque / Ref no."
              value={form.reference}
              onChange={(e)=>onChange('reference', e.target.value)} />
          </div>
          <div>
            <label>Invoice ID (optional)</label>
            <input value={form.invoiceId} onChange={(e)=>onChange('invoiceId', e.target.value)} />
          </div>
        </div>

        <div className="row">
          <label>Notes</label>
          <textarea rows="3" value={form.notes} onChange={(e)=>onChange('notes', e.target.value)} />
        </div>

        <div className="actions">
          <button type="button" className="btn ghost" onClick={cancel}>Cancel</button>
          <button type="submit" className="btn primary" disabled={saving}>
            <FaSave /> {saving ? 'Saving…' : 'Save Payment'}
          </button>
        </div>
      </form>
    </div>
  );
}
