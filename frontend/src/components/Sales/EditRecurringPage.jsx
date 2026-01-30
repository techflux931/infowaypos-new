// src/components/Sales/EditRecurringPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../../api/axios';
import RecurringInvoiceForm from './RecurringInvoiceForm';
import './EditRecurringPage.css';

/* ---------- helpers ---------- */
const toUIFreq = (f = '') => {
  const x = String(f).toUpperCase();
  if (x === 'DAILY') return 'Day';
  if (x === 'WEEKLY') return 'Week';
  if (x === 'MONTHLY') return 'Month';
  if (x === 'YEARLY') return 'Year';
  return 'Week';
};
const toAPIFreq = (ui = '') => {
  const x = String(ui).toLowerCase();
  if (x === 'day') return 'DAILY';
  if (x === 'week') return 'WEEKLY';
  if (x === 'month') return 'MONTHLY';
  if (x === 'year') return 'YEARLY';
  return 'WEEKLY';
};
const ymd = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

/** first non-empty value among candidate keys (dot-paths allowed) */
const pick = (obj, keys = [], fallback = '') => {
  for (const k of keys) {
    const v = k.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), obj);
    if (v !== undefined && v !== null && String(v).trim() !== '') return v;
  }
  return fallback;
};

export default function EditRecurringPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setErr('');

        const res = await axios.get(`/sales/recurring-invoices/${id}`);
        const d = res.data || {};

        // If Order/Profile still don't appear, open console and check this object:
        // console.log('GET recurring invoice:', d);

        const normalized = {
          id: d.id || d._id || id,
          customerName: pick(d, ['customerName', 'customer.name', 'customer'], ''),
          profileName: pick(
            d,
            ['profileName', 'profile', 'profile_name', 'recurringProfileName', 'profile.profileName'],
            ''
          ),
          orderNumber: pick(
            d,
            ['orderNumber', 'orderNo', 'order_number', 'order_num', 'reference', 'referenceNumber', 'poNumber', 'po_no'],
            ''
          ),
          // form hydration expects UI-friendly frequency and ISO dates (YYYY-MM-DD)
          frequency: toUIFreq(pick(d, ['frequency', 'repeatEvery'], 'WEEKLY')),
          startDate: ymd(pick(d, ['startDate', 'startOn'], '')),
          endDate: ymd(pick(d, ['endDate', 'endsOn'], '')) || '',
          paymentTerms: pick(d, ['paymentTerms', 'terms'], 'Due on Receipt'),
          salesperson: pick(d, ['salesperson', 'salesPerson'], ''),
          subject: pick(d, ['subject'], ''),
        };

        if (!ignore) setInitialData(normalized);
      } catch (e) {
        console.error(e);
        if (!ignore) setErr('Failed to load recurring invoice.');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [id]);

  const backToList = () => navigate('/sales/recurring');

  const handleSave = async (formValues) => {
    try {
      // map UI -> API
      const body = {
        customerName: formValues.customerName?.trim() || '',
        profileName: formValues.profileName?.trim() || '',
        orderNumber: formValues.orderNumber?.trim() || '',
        frequency: toAPIFreq(formValues.repeatEvery),
        startDate: formValues.startOn,
        endDate: formValues.neverExpires ? null : (formValues.endsOn || null),
        paymentTerms: formValues.paymentTerms || 'Due on Receipt',
        salesperson: formValues.salesperson?.trim() || '',
        subject: formValues.subject?.trim() || '',
      };

      await axios.put(`/sales/recurring-invoices/${id}`, body);
      backToList();
      // or: navigate('/sales/creditnotes', { replace: true, state: { fromRecurringId: id } });
    } catch (e) {
      console.error(e);
      alert(`Update failed. Please check required fields and formats.\n\n${e?.response?.data?.message || e.message}`);
    }
  };

  return (
    <div className="erp-page">
      <div className="erp-header">
        <button className="erp-icon" onClick={backToList} aria-label="Back to list">🏠</button>
        <h2 className="erp-title">Edit Recurring Invoice</h2>
        <button className="erp-icon" onClick={backToList} aria-label="Close">✖</button>
      </div>

      {loading && <div className="erp-state">Loading…</div>}
      {!loading && err && <div className="erp-error">{err}</div>}

      {!loading && !err && initialData && (
        <div className="erp-content">
          <RecurringInvoiceForm
            mode="edit"
            title="Edit Recurring Invoice"
            asModal={false}
            initialData={{
              customerName: initialData.customerName,
              profileName: initialData.profileName,
              orderNumber: initialData.orderNumber,
              frequency: initialData.frequency,
              startDate: initialData.startDate,
              endDate: initialData.endDate || '',
              paymentTerms: initialData.paymentTerms,
              salesperson: initialData.salesperson,
              subject: initialData.subject,
            }}
            onSave={handleSave}
            onClose={backToList}
          />
        </div>
      )}
    </div>
  );
}
