import React, { useEffect, useMemo, useState, useCallback } from 'react';
import api from '../api/axios';
import './ExpenseForm.css';

const TABS = [
  { key: 'other',       label: 'Other Details' },
  { key: 'address',     label: 'Address' },
  { key: 'attachments', label: 'Attachments' },
  { key: 'list',        label: 'Expense List' },
];

const INITIAL = {
  expenseName: '',
  amount: '',
  date: '',
  paymentMethod: '',
  description: '',
  street: '',
  city: '',
  state: '',
  zip: '',
  country: '',
  files: [],
};

const getId = (x) => x?._id ?? x?.id ?? x?.uuid ?? null;
const AED = new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' });
const fmtDate = (v) =>
  v ? new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

export default function ExpenseForm() {
  const [activeTab, setActiveTab] = useState('list'); // start on list since that's your UX
  const [form, setForm]           = useState(INITIAL);
  const [errors, setErrors]       = useState({});
  const [saving, setSaving]       = useState(false);
  const [serverError, setSrvErr]  = useState('');

  // track current edit target; null means "create"
  const [editId, setEditId]       = useState(null);

  // list state (kept here so we can refresh after save/delete)
  const [rows, setRows]   = useState([]);
  const [loading, setLoad] = useState(true);
  const [error, setError]  = useState('');
  const [search, setSearch] = useState('');

  const tabIndex = useMemo(() => TABS.findIndex(t => t.key === activeTab), [activeTab]);
  const isFirst  = tabIndex === 0;
  const isLast   = tabIndex === TABS.length - 1;

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // ------------------- List fetch / delete -------------------
  const fetchRows = useCallback(async () => {
    try {
      setLoad(true);
      setError('');
      const { data } = await api.get('/expenses');
      setRows(Array.isArray(data) ? data : (data?.items ?? []));
    } catch (e) {
      console.error(e);
      setError('Failed to fetch expenses.');
    } finally {
      setLoad(false);
    }
  }, []);

  useEffect(() => { void fetchRows(); }, [fetchRows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(e => {
      const name = (e?.name || e?.expenseName || '').toLowerCase();
      const cat  = (e?.category || '').toLowerCase();
      const ven  = (e?.vendor || '').toLowerCase();
      return name.includes(q) || cat.includes(q) || ven.includes(q);
    });
  }, [rows, search]);

  const handleDelete = async (id) => {
    if (!id || !window.confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      await fetchRows();
    } catch (e) {
      console.error(e);
      setError('Delete failed. Please try again.');
    }
  };

  // ------------------- Edit from list -------------------
  const handleEditRow = (r) => {
    const id = getId(r);
    setEditId(id);

    // prefill
    setForm({
      expenseName: r?.name ?? r?.expenseName ?? '',
      amount: r?.amount ?? '',
      date: r?.date ? String(r.date).substring(0, 10) : '',
      paymentMethod: r?.paymentMethod ?? '',
      description: r?.description ?? '',
      street: r?.address?.street ?? '',
      city: r?.address?.city ?? '',
      state: r?.address?.state ?? '',
      zip: r?.address?.zip ?? '',
      country: r?.address?.country ?? '',
      files: [],
    });

    setActiveTab('other'); // jump to form tab
    setSrvErr('');
    setErrors({});
  };

  // ------------------- Validation -------------------
  const validate = () => {
    const e = {};
    if (!form.expenseName.trim()) e.expenseName = 'Required';
    const amt = Number(form.amount);
    if (!form.amount || Number.isNaN(amt) || amt <= 0) e.amount = 'Enter a valid amount';
    return e;
  };

  // ------------------- Build payloads -------------------
  const buildJson = () => ({
    name: form.expenseName.trim(),
    expenseName: form.expenseName.trim(), // keep both for DTO flexibility
    amount: Number(form.amount),
    date: form.date || null,
    paymentMethod: form.paymentMethod || null,
    description: form.description?.trim() || '',
    address: {
      street: form.street || '',
      city: form.city || '',
      state: form.state || '',
      zip: form.zip || '',
      country: form.country || '',
    },
    attachments: form.files.map(f => ({ name: f.name, size: f.size })),
  });

  const buildMultipart = () => {
    const fd = new FormData();
    const name = form.expenseName.trim();
    fd.append('name', name);
    fd.append('expenseName', name);
    fd.append('amount', String(Number(form.amount)));
    if (form.date)           fd.append('date', form.date);
    if (form.paymentMethod)  fd.append('paymentMethod', form.paymentMethod);
    if (form.description)    fd.append('description', form.description.trim());
    if (form.street)  fd.append('address.street',  form.street);
    if (form.city)    fd.append('address.city',    form.city);
    if (form.state)   fd.append('address.state',   form.state);
    if (form.zip)     fd.append('address.zip',     form.zip);
    if (form.country) fd.append('address.country', form.country);
    form.files.forEach(f => fd.append('files', f, f.name));
    return fd;
  };

  // ------------------- Submit (create/update) -------------------
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setSrvErr('');

    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    const isEdit = Boolean(editId);
    setSaving(true);
    try {
      if (form.files.length > 0) {
        const body = buildMultipart();
        const cfg  = { headers: { 'Content-Type': 'multipart/form-data' } };
        if (isEdit) await api.put(`/expenses/${editId}`, body, cfg);
        else        await api.post('/expenses', body, cfg);
      } else {
        const body = buildJson();
        if (isEdit) await api.put(`/expenses/${editId}`, body);
        else        await api.post('/expenses', body);
      }

      // after success: reset form (or keep it), go back to list, refresh
      setForm(INITIAL);
      setEditId(null);
      setActiveTab('list');
      await fetchRows();
    } catch (err) {
      console.error('Failed to save expense', err);
      setSrvErr(err?.response?.data?.message || 'Server error');
    } finally {
      setSaving(false);
    }
  };

  const handleFiles = (e) => setField('files', Array.from(e.target.files || []));
  const next = () => !isLast && setActiveTab(TABS[tabIndex + 1].key);
  const prev = () => !isFirst && setActiveTab(TABS[tabIndex - 1].key);

  return (
    <div className="expense-form-page">
      <header className="expense-form-header">
        <button type="button" className="home-button" title="Home" aria-label="Home" onClick={() => window.history.back()}>
          🏠
        </button>
        <h2>Expense Details</h2>
        <button type="button" className="close-button" aria-label="Close" onClick={() => window.history.back()}>
          ×
        </button>
      </header>

      {serverError && <div className="alert-error">{serverError}</div>}

      <div className="expense-tabs" role="tablist" aria-label="Expense sections">
        {TABS.map(t => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={activeTab === t.key}
            className={activeTab === t.key ? 'active' : ''}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* --------- FORM TABS --------- */}
      <form className="expense-form" onSubmit={handleSubmit}>
        {activeTab === 'other' && (
          <div className="tab-content">
            <label htmlFor="expenseName">Expense Name *</label>
            <input
              id="expenseName" type="text" value={form.expenseName}
              onChange={(e) => setField('expenseName', e.target.value)} required
            />
            {errors.expenseName && <small className="error">{errors.expenseName}</small>}

            <label htmlFor="amount">Amount *</label>
            <input
              id="amount" type="number" min="0" step="0.01" value={form.amount}
              onChange={(e) => setField('amount', e.target.value)} required
            />
            {errors.amount && <small className="error">{errors.amount}</small>}

            <label htmlFor="date">Date</label>
            <input id="date" type="date" value={form.date} onChange={(e) => setField('date', e.target.value)} />

            <label htmlFor="paymentMethod">Payment Method</label>
            <select id="paymentMethod" value={form.paymentMethod} onChange={(e) => setField('paymentMethod', e.target.value)}>
              <option value="">Select method</option>
              <option value="cash">Cash</option>
              <option value="credit">Credit Card</option>
              <option value="bank">Bank Transfer</option>
            </select>

            <label htmlFor="description">Description</label>
            <textarea id="description" rows={3} value={form.description} onChange={(e) => setField('description', e.target.value)} />
          </div>
        )}

        {activeTab === 'address' && (
          <div className="tab-content">
            <label htmlFor="street">Street</label>
            <input id="street" value={form.street} onChange={e => setField('street', e.target.value)} />

            <label htmlFor="city">City</label>
            <input id="city" value={form.city} onChange={e => setField('city', e.target.value)} />

            <label htmlFor="state">State</label>
            <input id="state" value={form.state} onChange={e => setField('state', e.target.value)} />

            <label htmlFor="zip">ZIP/Postal Code</label>
            <input id="zip" value={form.zip} onChange={e => setField('zip', e.target.value)} />

            <label htmlFor="country">Country</label>
            <input id="country" value={form.country} onChange={e => setField('country', e.target.value)} />
          </div>
        )}

        {activeTab === 'attachments' && (
          <div className="tab-content">
            <p>Upload your receipts or related documents here…</p>
            <input id="files" type="file" multiple onChange={handleFiles} />
            {form.files.length > 0 && (
              <ul className="file-list">
                {form.files.map((f, i) => <li key={`${f.name}-${i}`}>{f.name}</li>)}
              </ul>
            )}
          </div>
        )}

        {activeTab !== 'list' && (
          <div className="form-buttons">
            {!isFirst && <button type="button" className="btn-secondary" onClick={prev} disabled={saving}>Back</button>}
            {!isLast  && <button type="button" className="btn-secondary" onClick={next} disabled={saving}>Next</button>}
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Saving…' : (editId ? 'Update' : 'Save')}
            </button>
            <button type="button" className="btn-cancel" onClick={() => { setForm(INITIAL); setEditId(null); setActiveTab('list'); }} disabled={saving}>
              Cancel
            </button>
          </div>
        )}
      </form>

      {/* --------- LIST TAB --------- */}
      {activeTab === 'list' && (
        <div className="tab-content">
          <div className="expense-list-header">
            <h3>Expense List</h3>
            <div className="header-actions">
              <input
                type="text" placeholder="Search"
                value={search} onChange={(e) => setSearch(e.target.value)}
                aria-label="Search expenses"
              />
              <button className="btn-secondary" onClick={fetchRows}>Refresh</button>
              <button
                className="btn-add"
                onClick={() => { setEditId(null); setForm(INITIAL); setActiveTab('other'); }}
              >
                + Add Expense
              </button>
            </div>
          </div>

          {error && <div className="error-banner">{error}</div>}

          {loading ? (
            <p>Loading expenses…</p>
          ) : (
            <table className="expense-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Payment</th>
                  <th>Description</th>
                  <th style={{ width: 140 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center' }}>No expenses found.</td></tr>
                ) : (
                  filtered.map(r => {
                    const id = getId(r);
                    const amt = Number(r?.amount || 0);
                    return (
                      <tr key={id}>
                        <td>{r?.name || r?.expenseName || '-'}</td>
                        <td>{Number.isFinite(amt) ? AED.format(amt) : AED.format(0)}</td>
                        <td>{fmtDate(r?.date)}</td>
                        <td>{r?.paymentMethod || '-'}</td>
                        <td>{r?.description || '-'}</td>
                        <td>
                          <button className="btn-edit" onClick={() => handleEditRow(r)}>Edit</button>
                          <button className="btn-delete" onClick={() => handleDelete(id)}>Delete</button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
