import { createPersistedStore } from './createPersistedStore';

// Shared by Home's hydration card and the Quick Log screen.
export const HYDRATION_DEFAULT = {
  intake: 1750,
  target: 2500,
  logs: [],
  byKind: { water: 1250, electrolyte: 250, tea: 250 },
};

const store = createPersistedStore('hydration', HYDRATION_DEFAULT, (setState) => ({
  log(ml, label, kind = 'water') {
    setState((d) => {
      const bk = d.byKind || HYDRATION_DEFAULT.byKind;
      return {
        ...d,
        intake: d.intake + ml,
        byKind: { ...bk, [kind]: (bk[kind] || 0) + ml },
        logs: [{ ml, label, kind, at: Date.now() }, ...(d.logs || [])].slice(0, 50),
      };
    });
  },
  setTarget(target) {
    setState((d) => ({ ...d, target }));
  },
  startNewDay() {
    setState((d) => ({ ...d, intake: 0, logs: [], byKind: { water: 0, electrolyte: 0, tea: 0 } }));
  },
}));

export const HydrationProvider = store.Provider;
export const useHydration = store.useStore;
