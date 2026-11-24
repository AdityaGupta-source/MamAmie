// Cloud sync. Local storage stays the source of truth; this mirrors it to the backend while the user is
// signed in and has sync switched on. See services/syncModel.js for the diff/merge rules.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, ApiError } from '../services/api';
import { useAuth } from './authStore';
import { useJournal } from './journalStore';
import { useSessionsStore } from './sessionsStore';
import { useHydration } from './hydrationStore';
import { useOnboarding } from './onboardingStore';
import {
  buildSnapshot,
  byNewestStart,
  computeChanges,
  groupChanges,
  hashJson,
  mergeList,
  planIncoming,
} from '../services/syncModel';

const KEY = '@mamamie_sync';
const DEFAULT = { enabled: true, userId: null, cursor: 0, meta: {}, lastSyncedAt: null };
const PUSH_BATCH = 400;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SyncContext = createContext(null);

export function SyncProvider({ children }) {
  const auth = useAuth();
  const journal = useJournal();
  const sessions = useSessionsStore();
  const hydration = useHydration();
  const onboarding = useOnboarding();

  const [persisted, setPersisted] = useState(DEFAULT);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | syncing | offline | error
  const [error, setError] = useState(null);

  // Always-current view of everything the engine reads, so async work never sees stale state.
  const live = useRef({});
  const syncNowRef = useRef(null);
  useEffect(() => {
    live.current = { journal, sessions, hydration, onboarding, persisted, auth };
  });
  const running = useRef(false);
  const again = useRef(false);
  const retryTimer = useRef(null);
  const retryDelay = useRef(30000);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => raw && setPersisted({ ...DEFAULT, ...JSON.parse(raw) }))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  // Persist, and keep the ref in step immediately so a sync loop sees its own updates.
  const save = useCallback((patch) => {
    const next = { ...live.current.persisted, ...patch };
    live.current.persisted = next;
    setPersisted(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
    return next;
  }, []);

  const storesLoaded = journal.loaded && sessions.loaded && hydration.loaded && onboarding.loaded;
  const active = ready && storesLoaded && auth.isSignedIn && persisted.enabled;

  const snapshot = useCallback(() => {
    const { journal: j, sessions: s, hydration: h, onboarding: o } = live.current;
    const js = j.state;
    return buildSnapshot({
      entries: js.entries,
      medicationSchedules: js.medicationSchedules,
      doseLogs: js.doseLogs,
      kickSessions: s.state.kickSessions,
      contractions: s.state.contractions,
      profile: o.profile,
      journalSettings: { habitsEnabled: js.habitsEnabled, habits: js.habits, weightUnit: js.weightUnit, scheduleSignature: js.scheduleSignature },
      checks: js.checks,
      hydration: h.state,
    });
  }, []);

  // Writes accepted remote changes into the stores (one update per store).
  const applyToStores = useCallback((changes) => {
    const g = groupChanges(changes);
    const { journal: j, sessions: s, hydration: h, onboarding: o } = live.current;
    const doc = (id) => (g.documents || []).find((c) => c.id === id && !c.deleted)?.data;

    const journalSettings = doc('journalSettings');
    const checks = doc('checks');
    if (g.entries || g.medicationSchedules || g.doseLogs || journalSettings || checks) {
      j.setState((st) => ({
        ...st,
        entries: g.entries ? mergeList(st.entries, g.entries) : st.entries,
        medicationSchedules: g.medicationSchedules ? mergeList(st.medicationSchedules, g.medicationSchedules) : st.medicationSchedules,
        doseLogs: g.doseLogs ? mergeList(st.doseLogs, g.doseLogs) : st.doseLogs,
        ...(journalSettings || {}),
        ...(checks ? { checks } : {}),
      }));
    }
    if (g.kickSessions || g.contractions) {
      s.setState((st) => ({
        ...st,
        kickSessions: g.kickSessions ? mergeList(st.kickSessions, g.kickSessions, byNewestStart('startedAt')).slice(0, 100) : st.kickSessions,
        contractions: g.contractions ? mergeList(st.contractions, g.contractions, byNewestStart('startAt')).slice(0, 200) : st.contractions,
      }));
    }
    const hyd = doc('hydration');
    if (hyd) h.setState(hyd);
    const profile = doc('profile');
    if (profile) o.applyRemoteProfile(profile);
  }, []);

  const mergeMeta = useCallback(
    (updates) => {
      const meta = { ...live.current.persisted.meta };
      for (const [k, v] of Object.entries(updates)) {
        if (v) meta[k] = v;
        else delete meta[k];
      }
      save({ meta });
    },
    [save]
  );

  // Pull everything after the cursor and apply it. Returns true if local data changed.
  const pull = useCallback(async () => {
    let changed = false;
    for (let guard = 0; guard < 50; guard++) {
      const res = await api.syncPull(live.current.persisted.cursor);
      if (res.changes.length) {
        const { apply, metaUpdates } = planIncoming(res.changes, snapshot(), live.current.persisted.meta);
        if (apply.length) {
          applyToStores(apply);
          changed = true;
        }
        mergeMeta(metaUpdates);
      }
      save({ cursor: res.cursor });
      if (!res.hasMore) break;
    }
    return changed;
  }, [snapshot, applyToStores, mergeMeta, save]);

  // Pushes local edits. Returns { pushed, adopted } where adopted means the server's newer copy replaced ours.
  const push = useCallback(async () => {
    const snap = snapshot();
    const changes = computeChanges(snap, live.current.persisted.meta);
    if (!changes.length) return { pushed: false, adopted: false };
    let adopted = false;
    for (let i = 0; i < changes.length; i += PUSH_BATCH) {
      const batch = changes.slice(i, i + PUSH_BATCH);
      const res = await api.syncPush(batch);
      const lost = new Set(res.conflicts.map((c) => `${c.collection}/${c.id}`));
      const updates = {};
      for (const c of batch) {
        const key = `${c.collection}/${c.id}`;
        if (lost.has(key)) continue;
        updates[key] = c.deleted ? null : { h: snap.get(key).hash, m: c.modifiedAt };
      }
      mergeMeta(updates);
      if (res.conflicts.length) {
        // The server has a newer version: take it, even over our edit.
        const apply = res.conflicts.filter((c) => !(c.deleted && c.collection === 'documents'));
        if (apply.length) {
          applyToStores(apply);
          adopted = true;
        }
        const adoptedMeta = {};
        for (const c of apply) adoptedMeta[`${c.collection}/${c.id}`] = c.deleted ? null : { h: hashJson(JSON.stringify(c.data)), m: c.modifiedAt };
        mergeMeta(adoptedMeta);
      }
    }
    return { pushed: true, adopted };
  }, [snapshot, applyToStores, mergeMeta]);

  const runOnce = useCallback(async () => {
    setStatus('syncing');
    try {
      for (let round = 0; round < 4; round++) {
        if (await pull()) {
          await sleep(500); // let React commit the stores before comparing again
          continue;
        }
        const r = await push();
        if (r.adopted) {
          await sleep(500);
          continue;
        }
        if (!r.pushed) break;
      }
      save({ lastSyncedAt: Date.now() });
      setError(null);
      setStatus('idle');
      retryDelay.current = 30000;
    } catch (e) {
      if (e instanceof ApiError && e.isNetwork) {
        setStatus('offline');
        clearTimeout(retryTimer.current);
        retryTimer.current = setTimeout(() => syncNowRef.current?.(), retryDelay.current);
        retryDelay.current = Math.min(retryDelay.current * 2, 300000);
      } else if (e instanceof ApiError && e.status === 401) {
        setStatus('idle'); // signed out by the api layer
      } else {
        setStatus('error');
        setError(e?.message || 'Sync failed');
      }
    }
  }, [pull, push, save]);

  // Single-flight: a request made while a sync is running triggers one more pass afterwards.
  const syncNow = useCallback(async () => {
    const { auth: a, persisted: p } = live.current;
    if (!a.isSignedIn || !p.enabled) return;
    // A different account on this device starts from a clean slate (its server copy is merged by id).
    if (p.userId !== a.user.id) save({ userId: a.user.id, cursor: 0, meta: {}, lastSyncedAt: null });
    if (running.current) {
      again.current = true;
      return;
    }
    running.current = true;
    try {
      do {
        again.current = false;
        await runOnce();
      } while (again.current);
    } finally {
      running.current = false;
    }
  }, [runOnce, save]);
  useEffect(() => {
    syncNowRef.current = syncNow;
  }, [syncNow]);

  // Signing out forgets what was synced, so signing in again re-merges instead of deleting.
  useEffect(() => {
    if (ready && auth.loaded && !auth.isSignedIn && (persisted.userId || persisted.cursor)) save({ userId: null, cursor: 0, meta: {}, lastSyncedAt: null });
  }, [ready, auth.loaded, auth.isSignedIn, persisted.userId, persisted.cursor, save]);

  // Sync soon after anything changes.
  const profile = onboarding.profile;
  useEffect(() => {
    if (!active) return undefined;
    const t = setTimeout(() => syncNowRef.current?.(), 3000);
    return () => clearTimeout(t);
  }, [active, journal.state, sessions.state, hydration.state, profile]);

  useEffect(() => {
    if (!active) return undefined;
    const sub = AppState.addEventListener('change', (s) => s === 'active' && syncNowRef.current?.());
    return () => {
      sub.remove();
      clearTimeout(retryTimer.current);
    };
  }, [active]);

  const setEnabled = useCallback((enabled) => save({ enabled }), [save]);

  const value = useMemo(
    () => ({ enabled: persisted.enabled, setEnabled, status, error, lastSyncedAt: persisted.lastSyncedAt, syncNow }),
    [persisted.enabled, persisted.lastSyncedAt, setEnabled, status, error, syncNow]
  );
  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used inside SyncProvider');
  return ctx;
}
