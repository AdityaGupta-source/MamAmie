import React, { createContext, useContext, useMemo, useState } from 'react';

// Non-persisted, app-wide UI state (the night-feed amber overlay lives above every tab).
const UiContext = createContext(null);

export function UiProvider({ children }) {
  const [amber, setAmber] = useState(false);
  const value = useMemo(() => ({ amber, setAmber }), [amber]);
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi() {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error('useUi must be used inside UiProvider');
  return ctx;
}
