import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import appConfig from '../config';

const BASE_URL = appConfig.API_URL;

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Injeta o token em todas as requisições automaticamente
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
