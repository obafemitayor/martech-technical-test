import apiClient from './apiClient';
import {
  getFromLocalStorage,
  saveInLocalStorage,
  removeFromLocalStorage,
} from './local-storage';

const TOKEN_KEY = 'jwt_token';

export const setAuthToken = async (clientId: string) => {
  if (getFromLocalStorage(TOKEN_KEY)) {
    return;
  }
  const response = await apiClient.post('/auth/token', { clientId });
  const token = response.data.access_token;
  saveInLocalStorage(TOKEN_KEY, token);
  return token;
};

export const getAuthToken = () => {
  return getFromLocalStorage(TOKEN_KEY);
};

export const removeAuthToken = () => {
  removeFromLocalStorage(TOKEN_KEY);
};
