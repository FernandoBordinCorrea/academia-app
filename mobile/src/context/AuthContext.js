import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const token = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      if (token && storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      // token inválido, ignora
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const res = await api.post('/users/login', { email, password });
    await AsyncStorage.setItem('token', res.data.access_token);
    await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
  }

  async function register(name, email, phone, password, confirmpassword, weight, gender) {
    const res = await api.post('/users/register', { name, email, phone, password, confirmpassword, weight, gender });
    await AsyncStorage.setItem('token', res.data.access_token);
    await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
  }

  async function logout() {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
