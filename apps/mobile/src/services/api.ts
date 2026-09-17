import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Detecta o IP da rede local dinamicamente a partir do Expo Go (ou fallback para o IP obtido via ipconfig)
const getLocalIp = (): string => {
  try {
    const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.developer?.manifest?.debuggerHost;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') return ip;
    }
  } catch (e) {
    // fallback caso ocorra erro ao acessar Constants
  }
  return '10.96.220.80';
};

const DEV_IP = getLocalIp();

// Para testar via Expo Go (dispositivo físico Android ou iOS) na rede Wi-Fi local
export const API_URL = process.env.EXPO_PUBLIC_API_URL || `http://${DEV_IP}:3000`;

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
