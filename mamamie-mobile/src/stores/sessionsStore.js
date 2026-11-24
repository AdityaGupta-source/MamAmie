// Kick-count and contraction-timing sessions, shared by Track, Home and the Log (+) sheet.
// Finished kick sessions and each day's contractions also appear in the calendar journal, so
// `useSessions()` (not the raw store) is what screens use.
import { useCallback, useMemo } from 'react';
import { createPersistedStore } from './createPersistedStore';
import { useJournal } from './journalStore';
import { makeEntry, minutesNow } from '../models/journal';
import { newId } from '../services/ids';
import { toDayKey } from '../services/dayKey';

export const KICK_GOAL = 10;

export const SESSIONS_DEFAULT = {
  kickActive: null, // { startedAt, count }
  kickSessions: [], // { id, dayKey, startedAt, endedAt, count }, newest first
  contractionStart: null, // ms timestamp while a contraction is being timed
  contractions: [], // { id, dayKey, startAt, durationSec }, newest first
};

const store = createPersistedStore('sessions', SESSIONS_DEFAULT, (setState) => ({
  setKickActive(kickActive) {
    setState((s) => ({ ...s, kickActive }));
  },
  pushKickSession(session) {
    setState((s) => ({ ...s, kickActive: null, kickSessions: [session, ...s.kickSessions].slice(0, 100) }));
  },
  setContractionStart(contractionStart) {
    setState((s) => ({ ...s, contractionStart }));
  },
  pushContraction(c) {
    setState((s) => ({ ...s, contractionStart: null, contractions: [c, ...s.contractions].slice(0, 200) }));
  },
  removeContraction(id) {
    setState((s) => ({ ...s, contractions: s.contractions.filter((c) => c.id !== id) }));
  },
}));

export const SessionsProvider = store.Provider;
export const useSessionsStore = store.useStore;

const mins = (sec) => Math.max(1, Math.round(sec / 60));

// Average length and start-to-start spacing of the contractions in the last hour.
export function contractionStats(contractions, now = Date.now()) {
  const recent = contractions.filter((c) => now - c.startAt <= 60 * 60 * 1000);
  if (!recent.length) return null;
  const avgDuration = Math.round(recent.reduce((a, c) => a + c.durationSec, 0) / recent.length);
  let avgInterval = null;
  if (recent.length > 1) {
    const starts = recent.map((c) => c.startAt).sort((a, b) => a - b);
    const gaps = starts.slice(1).map((t, i) => (t - starts[i]) / 1000);
    avgInterval = Math.round(gaps.reduce((a, g) => a + g, 0) / gaps.length);
  }
  return { count: recent.length, avgDuration, avgInterval };
}

export function useSessions() {
  const sessions = useSessionsStore();
  const journal = useJournal();
  const { state } = sessions;

  const finishKick = useCallback(
    (count, startedAt) => {
      const endedAt = Date.now();
      const durationSec = Math.round((endedAt - startedAt) / 1000);
      const dayKey = toDayKey(new Date(startedAt));
      const session = { id: newId(), dayKey, startedAt, endedAt, count };
      sessions.pushKickSession(session);
      const summary = `${count} movement${count === 1 ? '' : 's'} in ${mins(durationSec)} min`;
      journal.upsertEntry(
        makeEntry({
          id: `kicks:${session.id}`,
          title: 'Kick count session',
          category: 'symptom',
          dayKey,
          timeMinutes: minutesNow(new Date(startedAt)),
          notes: summary,
          session: { kind: 'kicks', summary },
        })
      );
      return session;
    },
    [sessions, journal]
  );

  const addKick = useCallback(() => {
    const a = state.kickActive;
    const count = (a?.count || 0) + 1;
    const startedAt = a?.startedAt || Date.now();
    if (count >= KICK_GOAL) finishKick(count, startedAt);
    else sessions.setKickActive({ startedAt, count });
  }, [state.kickActive, finishKick, sessions]);

  const endKick = useCallback(() => {
    const a = state.kickActive;
    if (!a) return;
    if (a.count > 0) finishKick(a.count, a.startedAt);
    else sessions.setKickActive(null);
  }, [state.kickActive, finishKick, sessions]);

  const cancelKick = useCallback(() => sessions.setKickActive(null), [sessions]);

  // One journal entry per day sums up that day's contractions.
  const syncContractionDay = useCallback(
    (dayKey, list) => {
      const today = list.filter((c) => c.dayKey === dayKey);
      const id = `contractions:${dayKey}`;
      if (!today.length) {
        if (journal.entriesById[id]) journal.deleteEntry(id);
        return;
      }
      const avg = Math.round(today.reduce((a, c) => a + c.durationSec, 0) / today.length);
      const summary = `${today.length} timed • average ${avg} s`;
      const first = today[today.length - 1];
      journal.upsertEntry(
        makeEntry({
          ...(journal.entriesById[id] || {}),
          id,
          title: 'Contractions timed',
          category: 'symptom',
          dayKey,
          timeMinutes: minutesNow(new Date(first.startAt)),
          notes: summary,
          session: { kind: 'contractions', summary },
        })
      );
    },
    [journal]
  );

  const toggleContraction = useCallback(() => {
    const start = state.contractionStart;
    if (!start) {
      sessions.setContractionStart(Date.now());
      return;
    }
    const c = { id: newId(), dayKey: toDayKey(new Date(start)), startAt: start, durationSec: Math.max(1, Math.round((Date.now() - start) / 1000)) };
    sessions.pushContraction(c);
    syncContractionDay(c.dayKey, [c, ...state.contractions]);
  }, [state.contractionStart, state.contractions, sessions, syncContractionDay]);

  const removeContraction = useCallback(
    (id) => {
      const c = state.contractions.find((x) => x.id === id);
      sessions.removeContraction(id);
      if (c) syncContractionDay(c.dayKey, state.contractions.filter((x) => x.id !== id));
    },
    [state.contractions, sessions, syncContractionDay]
  );

  return useMemo(
    () => ({ ...state, loaded: sessions.loaded, reset: sessions.reset, addKick, endKick, cancelKick, toggleContraction, removeContraction }),
    [state, sessions.loaded, sessions.reset, addKick, endKick, cancelKick, toggleContraction, removeContraction]
  );
}
