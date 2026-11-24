// Optional account. The app works fully without one; signing in only enables cloud backup and sync.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, ApiError, hasTokens, onAuthLost, setTokens } from '../services/api';
import { loadTokens } from '../services/tokenStorage';

const USER_KEY = '@mamamie_auth_user';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const t = await loadTokens();
      if (t) {
        // Trust the saved session while offline; refresh the user in the background.
        try {
          const raw = await AsyncStorage.getItem(USER_KEY);
          if (raw && alive) setUser(JSON.parse(raw));
        } catch {}
      }
      if (alive) setLoaded(true);
      if (t) {
        try {
          const me = await api.me();
          if (alive) setUser(me);
          AsyncStorage.setItem(USER_KEY, JSON.stringify(me)).catch(() => {});
        } catch (e) {
          if (alive && e instanceof ApiError && e.status === 401) setUser(null);
        }
      }
    })();
    const off = onAuthLost(() => {
      setUser(null);
      AsyncStorage.removeItem(USER_KEY).catch(() => {});
    });
    return () => {
      alive = false;
      off();
    };
  }, []);

  const adopt = useCallback(async (res) => {
    await setTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(res.user)).catch(() => {});
    setUser(res.user);
    return res.user;
  }, []);

  const signUp = useCallback(async (email, password, displayName) => adopt(await api.register(email.trim(), password, displayName?.trim())), [adopt]);
  const signIn = useCallback(async (email, password) => adopt(await api.login(email.trim(), password)), [adopt]);

  const clearSession = useCallback(async () => {
    await setTokens(null);
    await AsyncStorage.removeItem(USER_KEY).catch(() => {});
    setUser(null);
  }, []);

  const signOut = useCallback(async () => {
    // Drop the session locally first so nothing syncs while the server call is in flight.
    const t = await loadTokens();
    await clearSession();
    if (t?.refreshToken) api.logout(t.refreshToken).catch(() => {});
  }, [clearSession]);

  // Erases the account and everything synced to it on the server. Local data is untouched.
  const deleteAccount = useCallback(async () => {
    await api.deleteAccount();
    await clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({ user, loaded, isSignedIn: !!user, signUp, signIn, signOut, deleteAccount, hasTokens }),
    [user, loaded, signUp, signIn, signOut, deleteAccount]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
