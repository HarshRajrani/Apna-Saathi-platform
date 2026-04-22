import API from './axios';

export const generateBatches = (radiusKm, maxBatchSize) =>
  API.post('/routes/batch', { radiusKm, maxBatchSize });

export const assignBatch = (batchId, orderIds) =>
  API.post('/routes/assign-batch', { batchId, orderIds });

export const getActiveBatches = () =>
  API.get('/routes/active');
