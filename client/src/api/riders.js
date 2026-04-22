import API from './axios';

export const getRiders = (params = {}) =>
  API.get('/riders', { params });

export const getAvailableRiders = () =>
  API.get('/riders/available');

export const getRider = (id) =>
  API.get(`/riders/${id}`);

export const createRider = (data) =>
  API.post('/riders', data);

export const updateRiderLocation = (riderId, lat, lng) =>
  API.patch(`/riders/${riderId}/location`, { lat, lng });

export const updateRiderStatus = (riderId, status) =>
  API.patch(`/riders/${riderId}/status`, { status });

export const updateRider = (riderId, data) =>
  API.put(`/riders/${riderId}`, data);
