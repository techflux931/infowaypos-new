// src/components/Sales/NewRecurringPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import RecurringInvoiceForm from './RecurringInvoiceForm';

const toFrequency = (v) => (v === 'Week' ? 'WEEKLY' : 'MONTHLY'); // add YEARLY later
const buildPayload = (f) => ({
  invoiceNoPrefix: 'RI-',
  customerId: null,
  customerName: f.customerName,
  items: [],
  startDate: f.startOn,
  endDate: f.neverExpires ? null : (f.endsOn || null),
  frequency: toFrequency(f.repeatEvery),
  interval: 1,
  dayOfMonth: toFrequency(f.repeatEvery) === 'MONTHLY'
    ? Math.min(28, new Date(f.startOn).getDate() || 1)
    : null,
  nextRunDate: f.startOn,
  status: 'ACTIVE',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Dubai',
});

export default function NewRecurringPage() {
  const navigate = useNavigate();
  const onClose = () => navigate('/sales/recurring');
  const onSave = async (form) => {
    await axios.post('/sales/recurring-invoices', buildPayload(form));
    navigate('/sales/recurring');
  };
  return <RecurringInvoiceForm onClose={onClose} onSave={onSave} />;
}
