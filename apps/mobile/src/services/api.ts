import axios from 'axios';
import { Platform } from 'react-native';

// Obtenha o IP da sua rede local (o mesmo que aparece no terminal do Expo)
// Para testar no emulador Android, pode-se usar 10.0.2.2.
// Como estamos usando Expo Go em um dispositivo físico na rede, o IP deve bater com a rede.
// Usaremos o IP 10.169.61.69 como padrão baseado nos logs, mas se mudar basta alterar aqui.
const API_URL = 'http://192.168.0.13:3000';

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
