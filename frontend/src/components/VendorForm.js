// src/components/VendorForm.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './VendorForm.css';

const LIST_ROUTE = '/vendors';
const DASH_ROUTE = '/dashboard';
const BACK_ROUTE  = '/total-purchase';

const TABS = ['other', 'address', 'contacts'];

const BLANK = {
  // other
  code: '', name: '', displayName: '',
  contactPerson: '', email: '', phone: '',
  whatsapp: '', website: '', trn: '', category: '',
  paymentTerms: 'Immediate',
  creditLimit: '', openingBalance: '',
  active: true,
  // address
  attention: '', addressLine: '', street: '',
  city: '', state: '', postalCode: '', country: '', poBox: '',
  // contacts (FIFO – we preserve insertion order)
  contacts: [],
};

export default function VendorForm() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const [activeTab, setActiveTab] = useState('other');
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null); // id/_id for update

  // ---------- Prefill for edit ----------
  useEffect(() => {
    const v = state?.edit;
    if (!v) return;
    const id = v.id || v._id || null;
    setEditingId(id);

    const addr = v.address || {};
    setForm({
      ...BLANK,
      // other
      code: v.code || '',
      name: v.name || '',
      displayName: v.displayName || '',
      contactPerson: v.contactPerson || '',
      email: v.email || '',
      phone: v.phone || '',
      whatsapp: v.whatsapp || '',
      website: v.website || '',
      trn: v.trn || '',
      category: v.category || '',
      paymentTerms: v.paymentTerms || 'Immediate',
      creditLimit: String(v.creditLimit ?? ''),
      openingBalance: String(v.openingBalance ?? ''),
      active: v.active !== false,
      // address
      attention: addr.attention || '',
      addressLine: addr.addressLine || '',
      street: addr.street || '',
      city: addr.city || '',
      state: addr.state || '',
      postalCode: addr.postalCode || '',
      country: addr.country || '',
      poBox: addr.poBox || '',
      // contacts — keep array order as-is (FIFO)
      contacts: Array.isArray(v.contacts)
        ? v.contacts.map(c => ({
            name: c.name || '',
            phone: c.phone || '',
            email: c.email || '',
            role: c.role || '',
            primary: !!c.primary,
          }))
        : [],
    });
  }, [state]);

  const tabIndex = useMemo(() => TABS.indexOf(activeTab), [activeTab]);
  const isFirst = tabIndex === 0;
  const isLast  = tabIndex === TABS.length - 1;

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  // ---------- Contacts helpers (FIFO) ----------
  const addContact = () =>
    setForm(f => ({
      ...f,
      // push at the END to preserve FIFO
      contacts: [...(f.contacts || []), { name: '', phone: '', email: '', role: '', primary: false }],
    }));

  const updateContact = (i, key, val) =>
    setForm(f => {
      const copy = [...(f.contacts || [])];
      copy[i] = { ...copy[i], [key]: val };
      return { ...f, contacts: copy };
    });

  const removeContact = (i) =>
    setForm(f => ({ ...f, contacts: (f.contacts || []).filter((_, idx) => idx !== i) }));

  const setPrimary = (i) =>
    setForm(f => ({
      ...f,
      contacts: (f.contacts || []).map((c, idx) => ({ ...c, primary: idx === i })),
    }));

  // ---------- Validation ----------
  const validateOther = () => {
    const errs = [];
    if (!form.code.trim())  errs.push('Vendor Code is required');
    if (!form.name.trim())  errs.push('Vendor Name is required');
    if (!form.phone.trim()) errs.push('Phone is required');
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.push('Email is invalid');
    return errs;
  };
  const validateAddress  = () => []; // optional
  const validateContacts = () => []; // optional

  const next = () => {
    const errs =
      activeTab === 'other'   ? validateOther()   :
      activeTab === 'address' ? validateAddress() : validateContacts();
    if (errs.length) return alert(errs.join('\n'));
    if (!isLast) setActiveTab(TABS[tabIndex + 1]);
  };

  const back = () => !isFirst && setActiveTab(TABS[tabIndex - 1]);

  // ---------- Build payload ----------
  const buildPayload = () => {
    const addressLines = [
      form.attention, form.addressLine, form.street, form.city,
      form.state, form.postalCode, form.country,
      form.poBox ? `P.O. Box: ${form.poBox}` : '',
    ].map(s => (s || '').trim()).filter(Boolean);

    const contactsClean = (form.contacts || [])
      // keep original order (FIFO) and drop empty rows
      .filter(c => (c.name || '').trim() || (c.phone || '').trim() || (c.email || '').trim());

    return {
      code: form.code.trim(),
      name: form.name.trim(),
      displayName: form.displayName?.trim() || '',
      contactPerson: form.contactPerson?.trim() || '',
      email: form.email?.trim() || '',
      phone: form.phone.trim(),
      whatsapp: form.whatsapp?.trim() || '',
      website: form.website?.trim() || '',
      trn: form.trn?.trim() || '',
      category: form.category?.trim() || '',
      paymentTerms: form.paymentTerms,
      creditLimit: Number(form.creditLimit || 0),
      openingBalance: Number(form.openingBalance || 0),
      active: !!form.active,
      // for compatibility
      notes: addressLines.join(', '),

      address: {
        attention: form.attention,
        addressLine: form.addressLine,
        street: form.street,
        city: form.city,
        state: form.state,
        postalCode: form.postalCode,
        country: form.country,
        poBox: form.poBox,
      },

      // send `primary`, not `isPrimary`
      contacts: contactsClean,
    };
  };

  // ---------- Submit ----------
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!isLast) return next();

    const errs = validateOther();
    if (errs.length) return alert(errs.join('\n'));

    const payload = buildPayload();

    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/vendors/${editingId}`, { ...payload, id: editingId });
        alert('✅ Vendor updated successfully');
        navigate(LIST_ROUTE, { state: { justUpdated: payload } });
      } else {
        await api.post('/vendors', payload);
        alert('✅ Vendor saved successfully');
        navigate(LIST_ROUTE, { state: { justAdded: payload } });
      }
    } catch (err) {
      const status = err?.response?.status;
      const data   = err?.response?.data;
      const msg =
        data?.message || data?.error || (typeof data === 'string' ? data : null) ||
        err.message || 'Server error';
      const details = Array.isArray(data?.errors)
        ? '\n - ' + data.errors.map(e2 => e2.defaultMessage || e2).join('\n - ')
        : '';
      alert(`Save failed (${status || 'no status'}): ${msg}${details}`);
      console.error('Save vendor failed', err);
    } finally {
      setSaving(false);
    }
  };

  // Enter should advance on non-final tabs
  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !isLast) {
      e.preventDefault();
      next();
    }
  };

  // ---------- Render ----------
  return (
    <div className="vendor-form-page">
      {/* Header */}
      <header className="vendor-form-header">
        <div className="header-left">
          <button type="button" className="home-button" onClick={() => navigate(DASH_ROUTE)} title="Home">🏠</button>
        </div>
        <h2 className="header-title">{editingId ? 'Edit Vendor' : 'Vendor Details'}</h2>
        <div className="header-right">
          <button type="button" className="close-button" onClick={() => navigate(BACK_ROUTE)} title="Close">✖</button>
        </div>
      </header>

      {/* Tabs */}
      <div className="vendor-tabs">
        <button type="button" className={activeTab === 'other' ? 'active' : ''}   onClick={() => setActiveTab('other')}>Other Details</button>
        <button type="button" className={activeTab === 'address' ? 'active' : ''} onClick={() => setActiveTab('address')}>Address</button>
        <button type="button" className={activeTab === 'contacts' ? 'active' : ''} onClick={() => setActiveTab('contacts')}>Contact Persons</button>
        <button type="button" onClick={() => navigate(LIST_ROUTE)}>Vendor List</button>
      </div>

      {/* Form */}
      <form className="vendor-form" onSubmit={onSubmit} onKeyDown={onKeyDown}>
        {activeTab === 'other' && (
          <div className="tab-content two-col">
            <label>Vendor Code *</label>
            <input name="code" value={form.code} onChange={onChange} placeholder="e.g. V001" required />

            <label>Vendor Name *</label>
            <input name="name" value={form.name} onChange={onChange} placeholder="Enter vendor name" required />

            <label>Display Name</label>
            <input name="displayName" value={form.displayName} onChange={onChange} placeholder="Shown on documents" />

            <label>Contact Person</label>
            <input name="contactPerson" value={form.contactPerson} onChange={onChange} placeholder="Contact person" />

            <label>Phone *</label>
            <input name="phone" type="tel" value={form.phone} onChange={onChange} placeholder="+971 50 123 4567" required />

            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={onChange} placeholder="example@domain.com" />

            <label>WhatsApp</label>
            <input name="whatsapp" value={form.whatsapp} onChange={onChange} placeholder="+971 50 123 4567" />

            <label>Website</label>
            <input name="website" value={form.website} onChange={onChange} placeholder="https://vendor.com" />

            <label>TRN (VAT)</label>
            <input name="trn" value={form.trn} onChange={onChange} placeholder="1002 3456 7800 003" />

            <label>Category</label>
            <input name="category" value={form.category} onChange={onChange} placeholder="Groceries / Packaging / etc." />

            <label>Payment Terms</label>
            <select name="paymentTerms" value={form.paymentTerms} onChange={onChange}>
              <option>Immediate</option>
              <option>7 days</option>
              <option>15 days</option>
              <option>30 days</option>
              <option>45 days</option>
              <option>60 days</option>
            </select>

            <label>Credit Limit (AED)</label>
            <input name="creditLimit" type="number" step="0.01" value={form.creditLimit} onChange={onChange} />

            <label>Opening Balance (AED)</label>
            <input name="openingBalance" type="number" step="0.01" value={form.openingBalance} onChange={onChange} />

            <div className="inline full">
              <input id="active" name="active" type="checkbox" checked={form.active} onChange={onChange} />
              <label htmlFor="active">Active</label>
            </div>
          </div>
        )}

        {activeTab === 'address' && (
          <div className="tab-content two-col">
            <label>Attention</label>
            <input name="attention" value={form.attention} onChange={onChange} placeholder="Attn. name" />

            <label>Address (Line)</label>
            <input name="addressLine" value={form.addressLine} onChange={onChange} placeholder="Building / Area" />

            <label>Street</label>
            <input name="street" value={form.street} onChange={onChange} placeholder="Street" />

            <label>City</label>
            <input name="city" value={form.city} onChange={onChange} placeholder="City" />

            <label>State</label>
            <input name="state" value={form.state} onChange={onChange} placeholder="State / Emirate" />

            <label>ZIP/Postal Code</label>
            <input name="postalCode" value={form.postalCode} onChange={onChange} placeholder="Postal code" />

            <label>Country</label>
            <input name="country" value={form.country} onChange={onChange} placeholder="Country" />

            <label>P.O. Box</label>
            <input name="poBox" value={form.poBox} onChange={onChange} placeholder="P.O. Box" />

            <p className="hint full">
              (Address is saved as a structured object and also concatenated into <b>notes</b> for compatibility.)
            </p>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="tab-content">
            {(form.contacts || []).length === 0 && <div className="empty-row">No contact persons added.</div>}

            {(form.contacts || []).map((c, i) => (
              <div className="contact-row" key={i}>
                <input placeholder="Name"  value={c.name  || ''} onChange={(e) => updateContact(i, 'name',  e.target.value)} />
                <input placeholder="Phone" value={c.phone || ''} onChange={(e) => updateContact(i, 'phone', e.target.value)} />
                <input type="email" placeholder="Email" value={c.email || ''} onChange={(e) => updateContact(i, 'email', e.target.value)} />
                <input placeholder="Role (Sales, Accounts...)" value={c.role || ''} onChange={(e) => updateContact(i, 'role', e.target.value)} />
                <label className="primary-box">
                  <input type="checkbox" checked={!!c.primary} onChange={() => setPrimary(i)} /> Primary
                </label>
                <button type="button" className="btn-del" onClick={() => removeContact(i)}>Delete</button>
              </div>
            ))}

            <div className="contact-actions">
              <button type="button" className="btn-add" onClick={addContact}>+ Add Contact Person</button>
            </div>
          </div>
        )}

        {/* bottom bar */}
        <div className="form-buttons wizard">
          <button type="button" className="btn-secondary" onClick={() => navigate(BACK_ROUTE)}>Cancel</button>
          <div className="spacer" />
          <button type="button" className="btn-secondary" onClick={back} disabled={isFirst}>Back</button>
          {!isLast ? (
            <button type="button" className="btn-next" onClick={next}>Next</button>
          ) : (
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Saving…' : (editingId ? 'Update' : 'Save')}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
