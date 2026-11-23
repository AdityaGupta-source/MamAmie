import { router } from 'expo-router';

// Tab key <-> route path. Keys match BottomNav's items.
export const PATHS = { home: '/', track: '/track', log: '/log', vault: '/vault', ask: '/ask', circle: '/circle', profile: '/profile' };
export const KEY_FOR_PATH = Object.fromEntries(Object.entries(PATHS).map(([k, v]) => [v, k]));

export function goTab(key) {
  router.navigate(PATHS[key] || '/');
}
