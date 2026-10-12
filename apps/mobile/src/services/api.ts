import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const getLocalHost = () => {
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip) return ip;
  }
  if (Platform.OS === 'android') return '10.0.2.2';
  return 'localhost';
};

const localHost = getLocalHost();

export const API_URL = __DEV__ ? `http://${localHost}:3000` : 'https://teko.raed.world';
export const API_TWO_URL = 'http://osor03kc2dy6lkyazdhydnwz.62.171.175.197.sslip.io';


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
