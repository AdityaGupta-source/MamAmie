import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toDayKey } from '../services/dayKey';

const KEY = '@mamamie_onboarding_profile';

const OnboardingContext = createContext(null);

export function OnboardingProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => setProfile(raw ? JSON.parse(raw) : null))
      .catch(() => setProfile(null))
      .finally(() => setLoaded(true));
  }, []);

  const complete = useCallback(async (draft) => {
    const now = toDayKey();
    const saved = {
      ...draft,
      displayName: draft.displayName.trim(),
      privacyAcknowledgedAt: draft.privacyAcknowledgedAt || now,
      completedAt: now,
    };
    setProfile(saved);
    await AsyncStorage.setItem(KEY, JSON.stringify(saved));
    return saved;
  }, []);

  // Adopts a profile pulled from the server (cloud restore or an edit made on another device).
  const applyRemoteProfile = useCallback((remote) => {
    setProfile(remote);
    AsyncStorage.setItem(KEY, JSON.stringify(remote)).catch(() => {});
  }, []);

  // Wipes the profile and every other MamAmie key on the device.
  const resetAll = useCallback(async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      await AsyncStorage.multiRemove(keys.filter((k) => k.startsWith('@mamamie')));
    } catch {}
    setProfile(null);
  }, []);

  const value = useMemo(() => ({ profile, loaded, isComplete: !!profile?.completedAt, complete, resetAll, applyRemoteProfile }), [profile, loaded, complete, resetAll, applyRemoteProfile]);

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used inside OnboardingProvider');
  return ctx;
}
