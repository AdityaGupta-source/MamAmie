import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';

const PREFIX = '@mamamie_';

export const StorageService = {
  async get(key, fallback) {
    try {
      const raw = await AsyncStorage.getItem(PREFIX + key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  async set(key, value) {
    try {
      await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {}
  },
};

// useState that loads from and saves to device storage.
export function usePersistentState(key, initial) {
  const [value, setValue] = useState(initial);
  const loaded = useRef(false);

  useEffect(() => {
    let alive = true;
    StorageService.get(key, initial).then((v) => {
      if (alive) {
        setValue(v);
        loaded.current = true;
      }
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (loaded.current) StorageService.set(key, value);
  }, [key, value]);

  return [value, setValue];
}
