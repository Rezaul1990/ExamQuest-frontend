import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const refreshTokenKey = 'examquest.refreshToken';

export async function saveRefreshToken(token: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(refreshTokenKey, token);
    return;
  }
  await SecureStore.setItemAsync(refreshTokenKey, token);
}

export async function getRefreshToken() {
  if (Platform.OS === 'web') {
    return localStorage.getItem(refreshTokenKey);
  }
  return SecureStore.getItemAsync(refreshTokenKey);
}

export async function clearRefreshToken() {
  if (Platform.OS === 'web') {
    localStorage.removeItem(refreshTokenKey);
    return;
  }
  await SecureStore.deleteItemAsync(refreshTokenKey);
}
