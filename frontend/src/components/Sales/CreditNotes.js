// src/components/Sales/CreditNotes.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../../api/axios';
import './CreditNotes.css';
import { FaHome, FaTimes } from 'react-icons/fa';
import { translateProductName } from '../../utils/translateProductName';

const LIST_PATH = '/sales/creditnotes';
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const todayISO = () => new Date().toISOString().slice(0, 10);

// split "EN | AR" -> { en, ar }
const splitBilingual = (s = '') => {
  if (!s || typeof s !== 'string') return { en: '', ar: '' };
  const [en, ar] = s.split('|').map((x) => (x || '').trim());
  return { en: en || '', ar: ar || '' };
};

// join to "EN | AR"
const joinBilingual = (en = '', ar = '') =>
  [en?.trim(), ar?.trim()].filter(Boolean).join(' | ');

export default function CreditNotes() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  // --- state ---
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [creditNoteNo, setCreditNoteNo] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [creditNoteDate, setCreditNoteDate] = useState(todayISO());
  const [salesperson, setSalesperson] = useState('');
  const [subject, setSubject] = useState('');
  const [items, setItems] = useState([
    { _rowId: uid(), itemEn: '', itemAr: '', account: '', quantity: 1, rate: 0, discount: 0, amount: 0 },
  ]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  const itemInputRefs = useRef({});

  // --- effects ---
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get('/customers');
        setCustomers(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to fetch customers', err);
      }
    })();
  }, []);

  // edit mode: load existing note
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`/credit-notes/${id}`);
        setSelectedCustomerId(data.customerId || '');
        setCreditNoteNo(data.creditNoteNo || '');
        setReferenceNo(data.referenceNo || '');
        setCreditNoteDate(data.creditNoteDate || todayISO());
        setSalesperson(data.salesperson || '');
        setSubject(data.subject || '');

        // map line items -> bilingual fields (prefer itemEn/itemAr; fallback to legacy "item")
        const mapped = (Array.isArray(data.items) ? data.items : []).map((it) => {
          const { en, ar } = splitBilingual(it.item || '');
          const itemEn = (it.itemEn ?? '').toString().trim() || en;
          const itemAr = (it.itemAr ?? '').toString().trim() || ar;
          return {
            _rowId: uid(),
            itemEn,
            itemAr,
            account: it.account || '',
            quantity: Number(it.quantity ?? 0),
            rate: Number(it.rate ?? 0),
            discount: Number(it.discount ?? 0),
            amount: Number(it.amount ?? 0),
          };
        });

        setItems(
          mapped.length
            ? mapped
            : [{ _rowId: uid(), itemEn: '', itemAr: '', account: '', quantity: 1, rate: 0, discount: 0, amount: 0 }]
        );
      } catch (err) {
        console.error('Failed to load credit note:', err?.response?.data || err.message);
        alert(`Failed to load credit note: ${err?.response?.data?.message || err.message}`);
        navigate(LIST_PATH);
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, id, navigate]);

  // --- helpers ---
  const calcAmount = (q, r, d) => {
    const qty = Number(q) || 0;
    const rate = Number(r) || 0;
    const disc = Math.min(100, Math.max(0, Number(d) || 0));
    return Number((qty * (rate - (rate * disc) / 100)).toFixed(2));
  };

  const subTotal = useMemo(() => {
    const rows = items
      .filter((r) => (r.itemEn || r.itemAr || '').toString().trim() !== '')
      .map((r) => ({
        quantity: Number(r.quantity) || 0,
        rate: Number(r.rate) || 0,
        discount: Number(r.discount) || 0,
      }));
    return Number(rows.reduce((sum, r) => sum + calcAmount(r.quantity, r.rate, r.discount), 0).toFixed(2));
  }, [items]);

  // sanitize items for payload (send both new fields and legacy "item")
  const sanitizeItems = (rows) =>
    rows
      .filter((r) => (r.itemEn || r.itemAr || '').toString().trim() !== '')
      .map(({ _rowId, itemEn, itemAr, account, quantity, rate, discount }) => ({
        itemEn: (itemEn || '').trim(),
        itemAr: (itemAr || '').trim(),
        item: joinBilingual(itemEn, itemAr),               // legacy for compatibility
        account: account || '',
        quantity: Number(quantity) || 0,
        rate: Number(rate) || 0,
        discount: Number(discount) || 0,
        amount: calcAmount(quantity, rate, discount),
      }));

  // --- row actions ---
  const updateItem = (_rowId, field, value) => {
    setItems((prev) =>
      prev.map((row) => {
        if (row._rowId !== _rowId) return row;
        const next = { ...row, [field]: value };

        // auto-fill Arabic from dictionary when English changes
        if (field === 'itemEn') {
          const auto = translateProductName(value);
          if (!next.itemAr && auto) next.itemAr = auto;
        }

        if (['quantity', 'rate', 'discount'].includes(field)) {
          next.amount = calcAmount(next.quantity, next.rate, next.discount);
        }
        return next;
      })
    );
  };

  const addNewRow = () => {
    setItems((p) => [
      ...p,
      { _rowId: uid(), itemEn: '', itemAr: '', account: '', quantity: 1, rate: 0, discount: 0, amount: 0 },
    ]);
  };

  const bulkAddRows = () => {
    const val = window.prompt('How many rows do you want to add?', '5');
    if (val == null) return;
    const n = Math.max(0, Math.min(100, parseInt(val, 10) || 0));
    if (!n) return;
    const rows = Array.from({ length: n }, () => ({
      _rowId: uid(),
      itemEn: '',
      itemAr: '',
      account: '',
      quantity: 1,
      rate: 0,
      discount: 0,
      amount: 0,
    }));
    setItems((p) => [...p, ...rows]);
  };

  const focusRowItem = (_rowId) => {
    const el = itemInputRefs.current[_rowId];
    if (el) el.focus();
  };

  const removeRow = (_rowId) => {
    setItems((p) => p.filter((r) => r._rowId !== _rowId));
    delete itemInputRefs.current[_rowId];
  };

  // --- navigation ---
  const goToList = () => navigate(LIST_PATH);

  // --- build payload for backend DTO ---
  const buildPayload = () => {
    const customer = customers.find((c) => (c.id || c._id) === selectedCustomerId);
    return {
      customerId: selectedCustomerId || '',
      customerName: customer?.name || '',

      creditNoteNo: creditNoteNo?.trim() || null, // null => auto
      referenceNo: referenceNo?.trim() || null,
      creditNoteDate, // yyyy-MM-dd

      salesperson: salesperson?.trim() || null,
      subject: subject?.trim() || null,

      items: sanitizeItems(items),
      subTotal,
      total: subTotal,

      invoiceId: null,
      amount: subTotal,
    };
  };

  // --- save handlers ---
  const save = async (status = 'Draft') => {
    if (!selectedCustomerId) {
      alert('Please select a customer');
      return;
    }
    if (sanitizeItems(items).length === 0) {
      alert('Add at least one item row');
      return;
    }

    try {
      setSaving(true);
      const user = localStorage.getItem('username') || 'system';
      const payload = buildPayload();

      if (isEdit) {
        await axios.put(`/credit-notes/${id}`, payload);
      } else {
        await axios.post('/credit-notes', payload, {
          params: { status },
          headers: { 'X-User': user },
        });
      }

      goToList();
    } catch (err) {
      console.error('Credit note save failed:', err?.response?.data || err.message);
      alert(`Save failed: ${err?.response?.data?.message || err?.response?.data || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!saving) save(isEdit ? undefined : 'Draft');
  };

  // --- render ---
  return (
    <div className="credit-notes-container">
      <div className="header-bar">
        <div className="header-left">
          <button type="button" className="icon-button" title="Home" onClick={goToList}>
            <FaHome size={24} />
          </button>
        </div>

        <div className="header-title">{isEdit ? 'Edit Credit Note' : 'New Credit Note'}</div>

        <div className="header-right">
          <button type="button" className="icon-button close-button" title="Close" onClick={goToList}>
            <FaTimes size={24} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading…</div>
      ) : (
        <form onSubmit={onSubmit}>
          {/* Form fields */}
          <div className="form-grid">
            <div className="form-row">
              <label>Customer Name*</label>
              <select required value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)}>
                <option value="" disabled>
                  Select or add a customer
                </option>
                {customers.map((cust) => {
                  const idv = cust.id || cust._id;
                  return (
                    <option key={idv} value={idv}>
                      {cust.name}
                      {cust.email ? ` - ${cust.email}` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-row">
              <label>Credit Note#*</label>
              <input
                type="text"
                value={creditNoteNo || ''}
                onChange={(e) => setCreditNoteNo(e.target.value)}
                placeholder="Leave blank for auto"
              />
            </div>

            <div className="form-row">
              <label>Reference#</label>
              <input type="text" value={referenceNo || ''} onChange={(e) => setReferenceNo(e.target.value)} />
            </div>

            <div className="form-row">
              <label>Credit Note Date*</label>
              <input type="date" required value={creditNoteDate} onChange={(e) => setCreditNoteDate(e.target.value)} />
            </div>

            <div className="form-row">
              <label>Salesperson</label>
              <input
                type="text"
                placeholder="Select or Add Salesperson"
                value={salesperson || ''}
                onChange={(e) => setSalesperson(e.target.value)}
              />
            </div>

            <div className="form-row full-span">
              <label>Subject</label>
              <textarea
                placeholder="Let your customer know what this Credit Note is for"
                value={subject || ''}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
          </div>

          {/* Items table */}
          <table className="credit-notes-table">
            <thead>
              <tr>
                <th>Item Details (EN / AR)</th>
                <th>Account</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Discount %</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(({ _rowId, itemEn, itemAr, account, quantity, rate, discount }) => (
                <tr key={_rowId}>
                  <td>
                    <div className="item-cell">
                      <input
                        type="text"
                        value={itemEn}
                        onChange={(e) => updateItem(_rowId, 'itemEn', e.target.value)}
                        placeholder="Type item in English"
                        ref={(el) => {
                          itemInputRefs.current[_rowId] = el;
                        }}
                      />
                      <input
                        type="text"
                        dir="rtl"
                        className="arabic-line"
                        value={itemAr}
                        onChange={(e) => updateItem(_rowId, 'itemAr', e.target.value)}
                        placeholder="الصنف (العربية)"
                      />
                    </div>
                  </td>
                  <td>
                    <input
                      type="text"
                      value={account}
                      onChange={(e) => updateItem(_rowId, 'account', e.target.value)}
                      placeholder="Select an account"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={quantity}
                      onChange={(e) => updateItem(_rowId, 'quantity', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={rate}
                      onChange={(e) => updateItem(_rowId, 'rate', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={discount}
                      onChange={(e) => updateItem(_rowId, 'discount', e.target.value)}
                    />
                  </td>
                  <td>{calcAmount(quantity, rate, discount).toFixed(2)}</td>
                  <td>
                    <button type="button" className="edit-row-btn" onClick={() => focusRowItem(_rowId)} title="Edit row">
                      ✎
                    </button>
                    <button type="button" className="remove-row-btn" onClick={() => removeRow(_rowId)} title="Remove row">
                      ✖
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="table-actions">
            <button type="button" onClick={addNewRow} className="add-row-btn">
              + Add New Row
            </button>
            <button type="button" className="bulk-add-btn" onClick={bulkAddRows} title="Add multiple blank rows">
              + Add Items in Bulk
            </button>
          </div>

          <div className="form-actions">
            <button type="submit" className="save-draft-btn" disabled={saving}>
              {saving ? 'Saving…' : (isEdit ? 'Save' : 'Save as Draft')}
            </button>
            {!isEdit && (
              <button type="button" className="save-open-btn" onClick={() => save('Open')} disabled={saving}>
                {saving ? 'Saving…' : 'Save as Open'}
              </button>
            )}
            <button type="button" className="cancel-btn" onClick={goToList} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
