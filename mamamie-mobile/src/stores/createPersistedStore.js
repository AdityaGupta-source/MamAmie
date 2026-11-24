import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Builds a Context-backed store whose state is saved to AsyncStorage under `@mamamie_<key>`.
//   const { Provider, useStore } = createPersistedStore('hydration', initial, (state, set) => ({ ...actions }));
// Screens call useStore() and get { state, loaded, ...actions, reset }; they never touch storage directly.
// Optional `derive(state)` returns lookup indexes; they are rebuilt only when state changes and
// spread into the store value next to `state`.
export function createPersistedStore(key, initial, buildActions = () => ({}), derive = null) {
  const storageKey = `@mamamie_${key}`;
  const Ctx = createContext(null);

  function Provider({ children }) {
    const [state, setState] = useState(initial);
    const [loaded, setLoaded] = useState(false);
    const ready = useRef(false);

    useEffect(() => {
      AsyncStorage.getItem(storageKey)
        .then((raw) => {
          if (raw == null) return;
          const saved = JSON.parse(raw);
          // Fill fields added in newer versions from the defaults.
          const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
          setState(isObj(initial) && isObj(saved) ? { ...initial, ...saved } : saved);
        })
        .catch(() => {})
        .finally(() => {
          ready.current = true;
          setLoaded(true);
        });
    }, []);

    useEffect(() => {
      if (ready.current) AsyncStorage.setItem(storageKey, JSON.stringify(state)).catch(() => {});
    }, [state]);

    const reset = useCallback(() => setState(initial), []);
    const actions = useMemo(() => buildActions(setState), []);
    const derived = useMemo(() => (derive ? derive(state) : null), [state]);
    const value = useMemo(() => ({ state, loaded, setState, reset, ...derived, ...actions }), [state, loaded, reset, actions, derived]);

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
  }

  function useStore() {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error(`use ${key} store inside its Provider`);
    return ctx;
  }

  return { Provider, useStore };
}
