import API from './axios';

export const getInvoices = (params = {}) =>
  API.get('/billing/invoices', { params });

export const getInvoice = (id) =>
  API.get(`/billing/invoices/${id}`);

export const generateInvoice = (businessId, from, to) =>
  API.post('/billing/generate', { businessId, from, to });

export const markInvoicePaid = (id) =>
  API.patch(`/billing/invoices/${id}/pay`);

export const getBillingSummary = () =>
  API.get('/billing/summary');
