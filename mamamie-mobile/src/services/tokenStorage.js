// Access + refresh tokens. Native: the OS keystore via expo-secure-store. Web preview: AsyncStorage
// (secure-store has no web implementation; the web build is for development only).
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'mamamie_tokens';
const isWeb = Platform.OS === 'web';

export async function loadTokens() {
  try {
    const raw = isWeb ? await AsyncStorage.getItem(KEY) : await SecureStore.getItemAsync(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveTokens(tokens) {
  const raw = JSON.stringify({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
  if (isWeb) await AsyncStorage.setItem(KEY, raw);
  else await SecureStore.setItemAsync(KEY, raw);
}

export async function clearTokens() {
  try {
    if (isWeb) await AsyncStorage.removeItem(KEY);
    else await SecureStore.deleteItemAsync(KEY);
  } catch {}
}
