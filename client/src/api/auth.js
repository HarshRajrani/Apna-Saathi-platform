import API from './axios';

export const login = (email, password) =>
  API.post('/auth/login', { email, password });

export const signup = (data) =>
  API.post('/auth/signup', data);

export const getMe = () =>
  API.get('/auth/me');
