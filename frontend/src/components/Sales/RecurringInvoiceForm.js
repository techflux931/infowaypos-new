// src/components/Sales/RecurringInvoiceForm.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import './RecurringInvoiceForm.css';

const ymd = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

const freqToUI = (f = 'WEEKLY') =>
  ({ DAILY: 'Day', WEEKLY: 'Week', MONTHLY: 'Month', YEARLY: 'Year' }[
    String(f).toUpperCase()
  ] || 'Week');

export default function RecurringInvoiceForm({
  mode = 'add',
  title,
  initialData = null,
  onClose = () => {},
  onSave,
  asModal = true,
}) {
  const navigate = useNavigate();

  const todayStr = useMemo(() => ymd(new Date()), []);
  const [form, setForm] = useState({
    customerName: '',
    profileName: '',
    itemNameEn: '',
    itemNameAr: '',
    orderNumber: '',
    repeatEvery: 'Week', // Day | Week | Month | Year
    startOn: todayStr,
    endsOn: '',
    neverExpires: true,
    paymentTerms: 'Due on Receipt',
    salesperson: '',
    subject: '',
  });

  const goSales = useCallback(() => {
    try {
      onClose?.();
    } catch {}
    navigate('/sales');
  }, [navigate, onClose]);

  useEffect(() => {
    if (!initialData) return;

    const uiRepeat = initialData.repeatEvery || freqToUI(initialData.frequency);
    const start = ymd(initialData.startDate || initialData.startOn) || todayStr;
    const end = ymd(initialData.endDate || initialData.endsOn) || '';

    setForm((prev) => ({
      ...prev,
      customerName: initialData.customerName || '',
      profileName: initialData.profileName || '',
      itemNameEn: initialData.itemNameEn || '',
      itemNameAr: initialData.itemNameAr || '',
      orderNumber: initialData.orderNumber || '',
      repeatEvery: uiRepeat,
      startOn: start,
      endsOn: end,
      neverExpires: !Boolean(initialData.endDate || initialData.endsOn),
      paymentTerms: initialData.paymentTerms || 'Due on Receipt',
      salesperson: initialData.salesperson || '',
      subject: initialData.subject || '',
    }));
  }, [initialData, todayStr]);

  useEffect(() => {
    if (!asModal) return;
    const onKey = (e) => {
      if (e.key === 'Escape') goSales();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [asModal, goSales]);

  const set = (name, value) => setForm((p) => ({ ...p, [name]: value }));

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      set(name, checked);
      if (name === 'neverExpires' && checked) set('endsOn', '');
    } else {
      set(name, value);
    }
  };

  const isDateOrderValid = useMemo(() => {
    if (form.neverExpires || !form.endsOn) return true;
    try {
      return new Date(form.endsOn) >= new Date(form.startOn);
    } catch {
      return false;
    }
  }, [form.neverExpires, form.endsOn, form.startOn]);

  const requiredOk =
    form.customerName.trim() !== '' &&
    form.startOn &&
    (form.neverExpires || form.endsOn);

  const formValid = requiredOk && isDateOrderValid;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formValid) return;

    const payload = {
      ...form,
      customerName: form.customerName.trim(),
      profileName: form.profileName.trim(),
      itemNameEn: form.itemNameEn.trim(),
      itemNameAr: form.itemNameAr.trim(),
      orderNumber: form.orderNumber.trim(),
      salesperson: form.salesperson.trim(),
      subject: form.subject.trim(),
      endsOn: form.neverExpires ? '' : form.endsOn,
    };

    if (typeof onSave === 'function') onSave(payload);
    else onClose();
  };

  const onOverlayMouseDown = (e) => {
    if (!asModal) return;
    if (e.target.classList.contains('recurring-invoice-form-overlay')) goSales();
  };

  const heading = title || (mode === 'edit' ? 'Edit Recurring Invoice' : 'New Recurring Invoice');

  const FormShell = (
    <div
      className="recurring-invoice-form-container"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="form-header">
        <h2 id="rif-title">{heading}</h2>
        <button className="close-btn" onClick={goSales} aria-label="Close">
          ❌
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          {/* Row 1 */}
          <label htmlFor="rif-customer">Customer Name*</label>
          <label htmlFor="rif-profile">Profile Name</label>

          <input
            id="rif-customer"
            type="text"
            name="customerName"
            value={form.customerName}
            onChange={handleChange}
            required
            placeholder="Select Customer"
          />
          <input
            id="rif-profile"
            type="text"
            name="profileName"
            value={form.profileName}
            onChange={handleChange}
          />

          {/* Row 2: Item Name EN/AR */}
          <label htmlFor="rif-item-en">Item Name (English)</label>
          <label htmlFor="rif-item-ar">Item Name (Arabic)</label>

          <input
            id="rif-item-en"
            type="text"
            name="itemNameEn"
            value={form.itemNameEn}
            onChange={handleChange}
            placeholder="Enter Item Name (EN)"
          />
          <input
            id="rif-item-ar"
            type="text"
            name="itemNameAr"
            value={form.itemNameAr}
            onChange={handleChange}
            dir="rtl"
            placeholder="أدخل اسم الصنف"
          />

          {/* Row 3 */}
          <label htmlFor="rif-order">Order Number</label>
          <label htmlFor="rif-repeat">Repeat Every*</label>

          <input
            id="rif-order"
            type="text"
            name="orderNumber"
            value={form.orderNumber}
            onChange={handleChange}
            inputMode="numeric"
          />
          <select
            id="rif-repeat"
            name="repeatEvery"
            value={form.repeatEvery}
            onChange={handleChange}
            required
          >
            <option value="Day">Day</option>
            <option value="Week">Week</option>
            <option value="Month">Month</option>
            <option value="Year">Year</option>
          </select>

          {/* Row 4 */}
          <label htmlFor="rif-start">Start On*</label>
          <label htmlFor="rif-ends">Ends On</label>

          <input
            id="rif-start"
            type="date"
            name="startOn"
            value={form.startOn}
            onChange={handleChange}
            required
          />
          <input
            id="rif-ends"
            type="date"
            name="endsOn"
            value={form.endsOn}
            onChange={handleChange}
            disabled={form.neverExpires}
            min={form.startOn}
          />

          {/* Row 5: Never Expires */}
          <div className="span-2 checkbox-row">
            <input
              id="rif-never"
              type="checkbox"
              name="neverExpires"
              checked={form.neverExpires}
              onChange={handleChange}
            />
            <label htmlFor="rif-never">Never Expires</label>
          </div>

          {/* Row 6: Payment Terms */}
          <div></div>
          <div>
            <label htmlFor="rif-terms">Payment Terms</label>
            <select
              id="rif-terms"
              name="paymentTerms"
              value={form.paymentTerms}
              onChange={handleChange}
            >
              <option value="Due on Receipt">Due on Receipt</option>
              <option value="Net 15">Net 15</option>
              <option value="Net 30">Net 30</option>
              <option value="Net 60">Net 60</option>
            </select>
          </div>

          {/* Row 7: Salesperson */}
          <div className="span-2">
            <label htmlFor="rif-sales">Salesperson</label>
            <input
              id="rif-sales"
              type="text"
              name="salesperson"
              value={form.salesperson}
              onChange={handleChange}
              placeholder="Select or Add Salesperson"
            />
          </div>

          {/* Row 8: Subject */}
          <div className="span-2">
            <label htmlFor="rif-subject">Subject</label>
            <textarea
              id="rif-subject"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              placeholder="Let your customer know what this Recurring Invoice is for"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="span-2 form-actions">
            <button type="submit" className="save-btn" disabled={!formValid}>
              Save
            </button>
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );

  if (asModal === false) {
    return (
      <div className="recurring-invoice-form-plain" role="region" aria-labelledby="rif-title">
        {FormShell}
      </div>
    );
  }

  return (
    <div
      className="recurring-invoice-form-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rif-title"
      onMouseDown={onOverlayMouseDown}
    >
      {FormShell}
    </div>
  );
}

RecurringInvoiceForm.propTypes = {
  mode: PropTypes.oneOf(['add', 'edit']),
  title: PropTypes.string,
  initialData: PropTypes.object,
  onClose: PropTypes.func,
  onSave: PropTypes.func,
  asModal: PropTypes.bool,
};
