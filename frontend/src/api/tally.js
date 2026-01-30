// src/api/tally.js
import api from './axios';
export const getTallySettings = () => api.get('/integrations/tally/settings');
export const saveTallySettings = (s) => api.put('/integrations/tally/settings', s);

// manual posts
export const pushLedger = (id) => api.post(`/integrations/tally/ledgers/${id}`);
export const postSales = (payload) => api.post('/integrations/tally/sales', payload);
export const postPurchase = (payload) => api.post('/integrations/tally/purchase', payload);
export const postReceipt = (payload) => api.post('/integrations/tally/receipt', payload);
export const postPayment = (payload) => api.post('/integrations/tally/payment', payload);
export const postExpense = (payload) => api.post('/integrations/tally/expense', payload);
