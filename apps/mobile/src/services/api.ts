import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Obtenha o IP da sua rede local (o mesmo que aparece no terminal do Expo)
// Para testar via Expo Go (dispositivo físico Android ou iOS) na rede Wi-Fi, usamos diretamente o IP da máquina.
const API_URL = 'http://10.148.246.80:3000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export const setupInterceptors = (onLogout: () => void) => {
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response && error.response.status === 401) {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userData');
        setAuthToken(null);
        if (onLogout) onLogout();
      }
      return Promise.reject(error);
    }
  );
};
