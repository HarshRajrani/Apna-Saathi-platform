import API from './axios';

export const getOrders = (params = {}) =>
  API.get('/orders', { params });

export const getOrderStats = () =>
  API.get('/orders/stats');

export const getOrder = (id) =>
  API.get(`/orders/${id}`);

export const createOrder = (data) =>
  API.post('/orders', data);

export const assignRider = (orderId, riderId) =>
  API.patch(`/orders/${orderId}/assign`, { riderId });

export const updateOrderStatus = (orderId, status, note) =>
  API.patch(`/orders/${orderId}/status`, { status, note });

export const cancelOrder = (id) =>
  API.delete(`/orders/${id}`);
