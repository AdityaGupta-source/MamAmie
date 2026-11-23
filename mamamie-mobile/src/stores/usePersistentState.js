import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';

// Screen-local useState that loads from and saves to device storage (key `@mamamie_<key>`).
// Use a store from createPersistedStore instead when more than one screen shares the data.
export function usePersistentState(key, initial) {
  const [value, setValue] = useState(initial);
  const loaded = useRef(false);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem('@mamamie_' + key).then((raw) => (raw != null ? JSON.parse(raw) : initial)).catch(() => initial).then((v) => {
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
    if (loaded.current) AsyncStorage.setItem('@mamamie_' + key, JSON.stringify(value)).catch(() => {});
  }, [key, value]);

  return [value, setValue];
}
