// src/components/AddCustomerModal.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from '../api/axios';
import './AddCustomerModal.css';

function normalizeCustomer(obj = {}) {
  // Map whatever the API returns to a consistent shape
  const c = obj.data ?? obj; // many APIs wrap under { data }
  return {
    id: c.id || c._id || '',
    code: c.code || '',
    name: c.firstName || c.name || '',
    type: c.customerType || c.type || 'Cash',
    mobileNo: c.mobileNo || c.mobile || c.phone || '',
    phoneNo: c.phoneNo || '',
    address: c.address || '',
    email: c.email || '',
    trn: c.trn || c.trnNumber || c.taxNumber || '', // if your API has TRN
  };
}

const initialForm = {
  type: 'Cash',
  code: '',
  name: '',
  mobileNo: '',
  phoneNo: '',
  address: '',
  email: '',
};

export default function AddCustomerModal({ onClose, onCustomerAdded, editData = null }) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  // Prefill when editing
  useEffect(() => {
    if (editData) {
      const n = normalizeCustomer(editData);
      setForm({
        type: n.type || 'Cash',
        code: n.code || '',
        name: n.name || '',
        mobileNo: n.mobileNo || '',
        phoneNo: n.phoneNo || '',
        address: n.address || '',
        email: n.email || '',
      });
    } else {
      setForm(initialForm);
    }
  }, [editData]);

  // Close on ESC
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const canSave = useMemo(() => {
    const { code, name, mobileNo, address } = form;
    return Boolean(code.trim() && name.trim() && mobileNo.trim() && address.trim());
  }, [form]);

  const handleSubmit = useCallback(async () => {
    if (!canSave) {
      alert('Please fill all required fields (Code, Name, Mobile, Address).');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim(),
        firstName: form.name.trim(),       // your API seems to accept firstName
        name: form.name.trim(),            // fallback if backend expects name
        mobileNo: form.mobileNo.trim(),
        phoneNo: form.phoneNo.trim(),
        address: form.address.trim(),
        email: form.email.trim(),
        customerType: form.type,
        type: form.type,                   // some APIs use "type"
      };

      // Support id or _id on editData
      const id = editData?.id || editData?._id;
      const res = id
        ? await axios.put(`/customers/${id}`, payload)
        : await axios.post('/customers', payload);

      const saved = normalizeCustomer(res?.data);
      onCustomerAdded(saved); // hand back normalized object
      onClose();
    } catch (error) {
      console.error('Error saving customer:', error);
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to save customer';
      alert(msg);
    } finally {
      setSaving(false);
    }
  }, [canSave, editData, form, onClose, onCustomerAdded]);

  return (
    <div className="customer-modal" role="dialog" aria-modal="true" aria-label="Customer Entry">
      <div className="customer-header">
        <h2>{editData ? 'Edit Customer' : 'Customer Entry'}</h2>
        <button className="close-btn" onClick={onClose} title="Close (Esc)">✖</button>
      </div>

      <div className="customer-body">
        <div className="radio-group">
          <label>
            <input
              type="radio"
              value="Cash"
              checked={form.type === 'Cash'}
              onChange={() => handleChange('type', 'Cash')}
            />
            {' '}Cash
          </label>
        <label>
            <input
              type="radio"
              value="Credit"
              checked={form.type === 'Credit'}
              onChange={() => handleChange('type', 'Credit')}
            />
            {' '}Credit
          </label>
        </div>

        <input
          type="text"
          placeholder="Customer Code *"
          value={form.code}
          onChange={(e) => handleChange('code', e.target.value)}
        />
        <input
          type="text"
          placeholder="Customer Name *"
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
        />
        <input
          type="text"
          placeholder="Mobile Number *"
          value={form.mobileNo}
          onChange={(e) => handleChange('mobileNo', e.target.value)}
        />
        <input
          type="text"
          placeholder="Phone Number"
          value={form.phoneNo}
          onChange={(e) => handleChange('phoneNo', e.target.value)}
        />
        <input
          type="text"
          placeholder="Address *"
          value={form.address}
          onChange={(e) => handleChange('address', e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => handleChange('email', e.target.value)}
        />

        <button
          className="add-btn"
          onClick={handleSubmit}
          disabled={!canSave || saving}
          title={!canSave ? 'Fill required fields' : 'Save customer'}
        >
          {saving ? 'Saving…' : editData ? 'Update' : 'Add'}
        </button>
      </div>
    </div>
  );
}

AddCustomerModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onCustomerAdded: PropTypes.func,     // make optional to avoid warnings if not passed
  editData: PropTypes.object,
};

AddCustomerModal.defaultProps = {
  onCustomerAdded: () => {},           // no-op fallback
  editData: null,
};
