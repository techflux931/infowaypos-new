// src/components/InvoiceForm.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../api/axios';
import './InvoiceForm.css';
import { translateProductName } from '../utils/translateProductName';

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function InvoiceForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const quoteIdFromURL = new URLSearchParams(location.search).get('quoteId') || '';

  // -------- Header --------
  const [invoiceNo, setInvoiceNo] = useState('');
  const [date, setDate] = useState(todayISO());
  const [paymentType, setPaymentType] = useState('Cash');

  // -------- Customer snapshot / link --------
  const [customerId, setCustomerId] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [customerTrn, setCustomerTrn] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerOptions, setCustomerOptions] = useState([]); // datalist suggestions

  // -------- Quote link --------
  const [quoteId, setQuoteId] = useState(quoteIdFromURL);
  const [quoteNumber, setQuoteNumber] = useState('');

  // -------- Items (EN/AR stacked) --------
  const [items, setItems] = useState([
    { nameEn: '', nameAr: '', quantity: 1, price: 0, total: 0 },
  ]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingItem, setEditingItem] = useState({ nameEn: '', nameAr: '', quantity: 1, price: 0 });

  // -------- Discount (linked % & AED) --------
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAEDManual, setDiscountAEDManual] = useState(null); // when user edits AED directly

  // ===== Helpers =====
  const recalcLine = (it) => {
    const q = Number(it.quantity || 0);
    const p = Number(it.price || 0);
    return { ...it, total: q * p };
  };

  const addItem = () => {
    const it = { nameEn: '', nameAr: '', quantity: 1, price: 0, total: 0 };
    setItems((prev) => [...prev, it]);
    setEditingIndex(items.length);
    setEditingItem(it);
  };

  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  // guarantee AR even if user saves without blurring EN
  const saveEdit = (idx) => {
    setItems((prev) => {
      const copy = [...prev];
      const draft = { ...editingItem };
      if (!draft.nameAr) {
        const ar = translateProductName(draft.nameEn);
        if (ar) draft.nameAr = ar;
      }
      copy[idx] = recalcLine(draft);
      return copy;
    });
    setEditingIndex(null);
    setEditingItem({ nameEn: '', nameAr: '', quantity: 1, price: 0 });
  };

  // ===== Totals =====
  const grossTotal = useMemo(
    () => items.reduce((s, it) => s + Number(it.total || 0), 0),
    [items]
  );

  const discountAED = useMemo(() => {
    if (discountAEDManual !== null) return Number(discountAEDManual) || 0;
    return grossTotal * (Number(discountPercent || 0) / 100);
  }, [grossTotal, discountPercent, discountAEDManual]);

  const effectiveDiscountPercent = useMemo(() => {
    if (discountAEDManual !== null) {
      return grossTotal > 0 ? (discountAED / grossTotal) * 100 : 0;
    }
    return Number(discountPercent || 0);
  }, [discountAED, discountAEDManual, discountPercent, grossTotal]);

  const netTotal = useMemo(
    () => Math.max(grossTotal - discountAED, 0),
    [grossTotal, discountAED]
  );

  // ===== Customer helpers =====
  const normalizeCustomer = (c = {}) => ({
    id: c.id ?? c._id ?? c.customerId ?? null,
    name: c.name ?? c.customerName ?? '',
    trn:
      c.trn ?? c.TRN ?? c.customerTrn ?? c.customerTRN ??
      c.taxNo ?? c.taxNumber ?? c.taxRegistrationNumber ??
      c.vat ?? c.vatNo ?? c.vatNumber ?? '',
    phone: c.phone ?? c.mobileNo ?? c.phoneNo ?? '',
    address: c.address ?? '',
  });

  const normalizeOptions = (raw) => {
    const arr = Array.isArray(raw) ? raw : [];
    return arr
      .map((v) =>
        typeof v === 'string'
          ? { id: null, name: v }
          : { id: v.id ?? v._id ?? null, name: v.name ?? v.customerName ?? '' }
      )
      .filter((o) => o.name);
  };

  // suggestions while typing (debounced)
  useEffect(() => {
    let alive = true;
    const q = customerName.trim();
    if (!q) { setCustomerOptions([]); return; }

    const t = setTimeout(async () => {
      try {
        const resA = await axios.get('/customers/search', { params: { q } }).catch(() => null);
        const resB = resA || (await axios.get('/customers/search', { params: { name: q } }).catch(() => null));
        if (!alive) return;
        const list = resB?.data?.data ?? resB?.data ?? [];
        setCustomerOptions(normalizeOptions(list).slice(0, 8));
      } catch {}
    }, 250);

    return () => { alive = false; clearTimeout(t); };
  }, [customerName]);

  // exact snapshot fetch
  const fetchCustomerSnapshot = useCallback(async (name) => {
    const n = (name || '').trim();
    if (!n) {
      setCustomerId(null);
      setCustomerTrn(''); setCustomerPhone(''); setCustomerAddress('');
      return;
    }
    try {
      const resA = await axios.get('/customers/find', { params: { name: n } }).catch(() => null);
      const resB = resA || (await axios.get('/customers/find', { params: { q: n } }).catch(() => null));
      const raw = resB?.data?.data ?? resB?.data ?? null;
      if (!raw) {
        setCustomerId(null);
        setCustomerTrn(''); setCustomerPhone(''); setCustomerAddress('');
        return;
      }
      const c = normalizeCustomer(raw);
      setCustomerId(c.id);
      setCustomerTrn(c.trn);
      setCustomerPhone(c.phone);
      setCustomerAddress(c.address);
    } catch {
      setCustomerId(null);
      setCustomerTrn(''); setCustomerPhone(''); setCustomerAddress('');
    }
  }, []);

  // keep trying as user types (debounced)
  useEffect(() => {
    let alive = true;
    const q = customerName.trim();
    if (!q) return;
    const t = setTimeout(() => { if (alive) fetchCustomerSnapshot(q); }, 500);
    return () => { alive = false; clearTimeout(t); };
  }, [customerName, fetchCustomerSnapshot]);

  // if typed value exactly matches a suggestion → fill instantly
  useEffect(() => {
    const exact = customerOptions.find(
      (c) => (c.name || '').toLowerCase() === customerName.trim().toLowerCase()
    );
    if (exact) fetchCustomerSnapshot(exact.name);
  }, [customerOptions, customerName, fetchCustomerSnapshot]);

  // ===== Prefill from Quote (if provided) =====
  useEffect(() => {
    let on = true;
    if (!quoteIdFromURL) return;
    (async () => {
      try {
        const { data } = await axios.get(`/quotes/${quoteIdFromURL}`);
        if (!on) return;
        const q = data?.data || data || {};

        setCustomerName(q.customerName || '');
        setCustomerTrn(q.customerTrn || '');
        setCustomerPhone(q.customerPhone || '');
        setCustomerAddress(q.customerAddress || '');
        setQuoteId(q._id || quoteIdFromURL);
        setQuoteNumber(q.number || q.quoteNo || '');
        if (q.paymentType) setPaymentType(q.paymentType);

        const mapped = Array.isArray(q.items)
          ? q.items.map((it) =>
              recalcLine({
                nameEn: it.nameEn ?? it.englishName ?? it.name ?? '',
                nameAr: it.nameAr ?? it.arabicName ?? it.name_ar ?? '',
                quantity: Number(it.quantity ?? it.qty ?? 1),
                price: Number(it.price ?? 0),
                total: Number(it.total ?? 0),
              })
            )
          : [];
        setItems(mapped.length ? mapped : [{ nameEn: '', nameAr: '', quantity: 1, price: 0, total: 0 }]);

        if (q.discountPercent != null) {
          setDiscountPercent(Number(q.discountPercent) || 0);
          setDiscountAEDManual(null);
        }
      } catch {}
    })();
    return () => { on = false; };
  }, [quoteIdFromURL]);

  // ===== Product EN → AR + price (API + dictionary fallback) =====
  const fetchProductNames = useCallback(async (nameEn) => {
    const key = (nameEn || '').trim();
    if (!key) return;

    let arFromApi = '';
    let priceFromApi = null;

    try {
      const res = await axios.get('/products/find', { params: { name: key } });
      const p = res?.data?.data ?? res?.data ?? null;
      if (p) {
        arFromApi = p.arabicName || p.nameAr || '';
        priceFromApi = p.price != null ? Number(p.price) : null;
      }
    } catch {}

    const arFromDict = translateProductName(key);

    setEditingItem((prev) => ({
      ...prev,
      nameEn: prev.nameEn || key,
      nameAr: arFromApi || arFromDict || prev.nameAr,
      price: priceFromApi != null ? priceFromApi : prev.price,
    }));
  }, []);

  // prevent Enter from auto-submitting the whole form
  const handleFormKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (editingIndex !== null) {
      saveEdit(editingIndex);
    } else if (e.target?.name === 'customerName') {
      fetchCustomerSnapshot(customerName);
    }
  };

  // ===== Submit =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      invoiceNo,
      date,
      paymentType,
      customerId: customerId || undefined,  // link the invoice to the real customer
      customerName,
      customerTrn,
      customerPhone,
      customerAddress,
      discountPercent: Number(effectiveDiscountPercent.toFixed(2)),
      discountAmount: Number(discountAED.toFixed(2)),
      items,
      grossTotal: Number(grossTotal.toFixed(2)),
      netTotal: Number(netTotal.toFixed(2)),
      quoteId: quoteId || undefined,
      quoteNumber: quoteNumber || undefined,
    };

    try {
      await axios.post('/invoices', payload);
      alert('✅ Invoice saved successfully!');
      navigate('/invoice');
    } catch (err) {
      console.error(err);
      alert('❌ Failed to save invoice');
    }
  };

  // ===== UI =====
  return (
    <div className="invoice-form-container">
      <h2>Create Invoice</h2>
      <p className="seller-trn"><strong>Seller TRN:</strong> 100123456700003</p>

      <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} autoComplete="off">
        <div className="form-grid">
          <div className="fg">
            <label>Invoice No:</label>
            <input value={invoiceNo} onChange={(e)=>setInvoiceNo(e.target.value)} required />
          </div>

          <div className="fg">
            <label>Date:</label>
            <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} required />
          </div>

          <div className="fg">
            <label>Payment Type:</label>
            <select value={paymentType} onChange={(e)=>setPaymentType(e.target.value)}>
              <option>Cash</option>
              <option>Card</option>
              <option>Bank</option>
              <option>Paypal</option>
            </select>
          </div>

          <div className="fg">
            <label>Customer Name:</label>
            <input
              name="customerName"
              list="customer-suggest"
              value={customerName}
              onInput={(e) => {
                const val = e.currentTarget.value;
                setCustomerName(val);
                const hit = customerOptions.find(
                  (o) => o.name.toLowerCase() === val.trim().toLowerCase()
                );
                if (hit) fetchCustomerSnapshot(hit.name);
              }}
              onBlur={(e)=>fetchCustomerSnapshot(e.target.value)}
              placeholder="Start typing to search…"
              required
            />
            <datalist id="customer-suggest">
              {customerOptions.map((c, i) => (<option key={i} value={c.name} />))}
            </datalist>
          </div>

          <div className="fg">
            <label>Customer TRN:</label>
            <input value={customerTrn} onChange={(e)=>setCustomerTrn(e.target.value)} />
          </div>

          <div className="fg">
            <label>Phone:</label>
            <input value={customerPhone} onChange={(e)=>setCustomerPhone(e.target.value)} />
          </div>

          <div className="fg fg-span2">
            <label>Address:</label>
            <input value={customerAddress} onChange={(e)=>setCustomerAddress(e.target.value)} />
          </div>

          <div className="fg">
            <label>Quote ID (optional):</label>
            <input value={quoteId} onChange={(e)=>setQuoteId(e.target.value)} placeholder="link a quote" />
          </div>
          <div className="fg">
            <label>Quote No (optional):</label>
            <input value={quoteNumber} onChange={(e)=>setQuoteNumber(e.target.value)} />
          </div>

          <div className="fg">
            <label>Discount %:</label>
            <input
              type="number" min="0" max="100" step="0.01"
              value={discountAEDManual === null ? discountPercent : Number(effectiveDiscountPercent.toFixed(2))}
              onChange={(e)=>{ setDiscountPercent(parseFloat(e.target.value) || 0); setDiscountAEDManual(null); }}
            />
          </div>

          <div className="fg">
            <label>Discount (AED):</label>
            <input
              type="number" min="0" step="0.01"
              value={discountAED.toFixed(2)}
              onChange={(e)=> setDiscountAEDManual(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        <table className="invoice-item-table">
          <thead>
            <tr>
              <th style={{ minWidth: 280 }}>Item (EN / AR)</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
              <th colSpan="2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={idx}>
                <td className="item-cell">
                  {editingIndex === idx ? (
                    <div className="stacked-inputs">
                      <input
                        placeholder="English name"
                        value={editingItem.nameEn}
                        onChange={(e)=>setEditingItem({ ...editingItem, nameEn: e.target.value })}
                        onBlur={()=>fetchProductNames(editingItem.nameEn)}
                        onKeyDown={(e)=>{ if (e.key==='Enter') e.preventDefault(); }}
                      />
                      <input
                        className="ar"
                        placeholder="الاسم بالعربية"
                        value={editingItem.nameAr}
                        onChange={(e)=>setEditingItem({ ...editingItem, nameAr: e.target.value })}
                        onKeyDown={(e)=>{ if (e.key==='Enter') e.preventDefault(); }}
                      />
                    </div>
                  ) : (
                    <div>
                      <div>{it.nameEn || it.nameAr || '-'}</div>
                      {it.nameAr && it.nameAr !== it.nameEn ? <div className="ar-view">{it.nameAr}</div> : null}
                    </div>
                  )}
                </td>

                <td className="num">
                  {editingIndex === idx ? (
                    <input
                      type="number" min="1"
                      value={editingItem.quantity}
                      onChange={(e)=>setEditingItem({ ...editingItem, quantity: parseFloat(e.target.value) || 1 })}
                      onKeyDown={(e)=>{ if (e.key==='Enter') e.preventDefault(); }}
                    />
                  ) : it.quantity}
                </td>

                <td className="num">
                  {editingIndex === idx ? (
                    <input
                      type="number" min="0" step="0.01"
                      value={editingItem.price}
                      onChange={(e)=>setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })}
                      onKeyDown={(e)=>{ if (e.key==='Enter') e.preventDefault(); }}
                    />
                  ) : Number(it.price || 0).toFixed(2)}
                </td>

                <td className="num">
                  {editingIndex === idx
                    ? (Number(editingItem.quantity || 0) * Number(editingItem.price || 0)).toFixed(2)
                    : Number(it.total || 0).toFixed(2)}
                </td>

                <td>
                  {editingIndex === idx ? (
                    <>
                      <button type="button" className="save-btn" onClick={()=>saveEdit(idx)}>💾</button>
                      <button type="button" className="cancel-edit-btn" onClick={()=>setEditingIndex(null)}>❌</button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="edit-item-btn"
                      onClick={()=>{ setEditingIndex(idx); setEditingItem(it); }}
                    >
                      ✏️
                    </button>
                  )}
                </td>
                <td>
                  <button type="button" className="remove-item-btn" onClick={()=>removeItem(idx)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="invoice-summary">
          <p><strong>Gross Total:</strong> AED {grossTotal.toFixed(2)}</p>
          <p><strong>Discount:</strong> AED {discountAED.toFixed(2)} ({effectiveDiscountPercent.toFixed(2)}%)</p>
          <p><strong>Net Total:</strong> AED {netTotal.toFixed(2)}</p>
        </div>

        <div className="form-buttons">
          <button type="button" onClick={addItem}>➕ Add Item</button>
          <button type="submit">💾 Save Invoice</button>
          <button type="button" className="cancel-btn" onClick={()=>navigate('/invoice')}>❌ Cancel</button>
        </div>
      </form>
    </div>
  );
}
