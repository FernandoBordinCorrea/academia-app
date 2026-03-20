import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Troque pelo IP da sua máquina quando testar no celular físico
// Ex: 'http://192.168.1.10:8000'
const BASE_URL = 'http://192.168.0.248:8000'; // IP da máquina na rede local

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
