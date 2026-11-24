// Calendar journal store, ported from the iOS JournalStore (+Mutations, +Queries).
// Entries, medication schedules and dose logs live here, plus the daily checkpoint habits.
// Lookups are indexed by id and day key so a calendar cell never scans every entry.
import { useMemo } from 'react';
import { createPersistedStore } from './createPersistedStore';
import {
  CATEGORIES,
  CHECKPOINTS,
  DEFAULT_HABIT_IDS,
  makeEntry,
  makeDoseLog,
  minutesNow,
  appointmentStatusTitle,
  reportStatusTitle,
  doseStatusTitle,
  severityTitle,
  mealTitle,
} from '../models/journal';
import { newId } from '../services/ids';

const CATEGORY_ORDER = CATEGORIES.map((c) => c.key);
const UPCOMING_CATEGORIES = ['appointment', 'test', 'medication', 'task'];

export const JOURNAL_DEFAULT = {
  entries: [],
  medicationSchedules: [],
  doseLogs: [],
  // Daily checkpoints: the active habit list, and which habits were ticked on which day.
  habitsEnabled: true,
  habits: CHECKPOINTS.filter((c) => DEFAULT_HABIT_IDS.includes(c.id)),
  checks: {}, // { [dayKey]: { [habitId]: true } }
  // Profile inputs the clinical plan was last built from (see services/clinicalSchedule).
  scheduleSignature: '',
  weightUnit: 'kg',
};

// Same order as iOS sortEntries: day, then timed before untimed, then creation time.
export function sortEntries(a, b) {
  if (a.dayKey !== b.dayKey) return a.dayKey < b.dayKey ? -1 : 1;
  const at = a.timeMinutes;
  const bt = b.timeMinutes;
  if (at != null && bt != null && at !== bt) return at - bt;
  if (at != null && bt == null) return -1;
  if (at == null && bt != null) return 1;
  return a.createdAt - b.createdAt;
}

function buildIndex(state) {
  const entriesById = {};
  const entriesByDay = {};
  const categoriesByDay = {};
  for (const e of state.entries) {
    entriesById[e.id] = e;
    (entriesByDay[e.dayKey] ||= []).push(e);
    (categoriesByDay[e.dayKey] ||= new Set()).add(e.category);
  }
  for (const k in entriesByDay) entriesByDay[k].sort(sortEntries);

  const schedulesById = {};
  for (const s of state.medicationSchedules) schedulesById[s.id] = s;

  const doseLogsByDay = {};
  for (const l of state.doseLogs) {
    (doseLogsByDay[l.dayKey] ||= []).push(l);
    if (schedulesById[l.medicationId]) (categoriesByDay[l.dayKey] ||= new Set()).add('medication');
  }

  const dayCategories = {};
  for (const k in categoriesByDay) dayCategories[k] = CATEGORY_ORDER.filter((c) => categoriesByDay[k].has(c));

  return { entriesById, entriesByDay, dayCategories, schedulesById, doseLogsByDay };
}

// Replaces the entry with the same id or appends it.
function upsertInto(list, item) {
  const i = list.findIndex((x) => x.id === item.id);
  if (i === -1) return [...list, item];
  const next = list.slice();
  next[i] = item;
  return next;
}

const store = createPersistedStore(
  'journal',
  JOURNAL_DEFAULT,
  (setState) => ({
    upsertEntry(entry, medicationSchedule = null) {
      setState((s) => ({
        ...s,
        entries: upsertInto(s.entries, { ...entry, modifiedAt: Date.now() }),
        medicationSchedules: medicationSchedule ? upsertInto(s.medicationSchedules, medicationSchedule) : s.medicationSchedules,
      }));
    },

    // Bulk insert/replace in one state change (used by the clinical schedule sync).
    upsertEntries(list) {
      if (!list.length) return;
      setState((s) => {
        const byId = new Map(s.entries.map((e) => [e.id, e]));
        for (const e of list) byId.set(e.id, e);
        return { ...s, entries: [...byId.values()] };
      });
    },

    // Applies a clinical-schedule sync plan in one state change.
    applySchedule(upserts, removeIds, signature) {
      setState((s) => {
        const byId = new Map(s.entries.map((e) => [e.id, e]));
        for (const id of removeIds) byId.delete(id);
        for (const e of upserts) byId.set(e.id, e);
        return { ...s, entries: [...byId.values()], scheduleSignature: signature };
      });
    },

    deleteEntry(id) {
      setState((s) => {
        const entry = s.entries.find((e) => e.id === id);
        if (!entry) return s;
        const medId = entry.medicationId;
        return {
          ...s,
          entries: s.entries.filter((e) => e.id !== id),
          medicationSchedules: medId ? s.medicationSchedules.filter((m) => m.id !== medId) : s.medicationSchedules,
          doseLogs: medId ? s.doseLogs.filter((l) => l.medicationId !== medId) : s.doseLogs,
        };
      });
    },

    // One dose log per medication per day: logging again replaces that day's status.
    logDose(entry, status, dayKey = entry.dayKey) {
      if (!entry.medicationId) return;
      setState((s) => {
        if (!s.medicationSchedules.some((m) => m.id === entry.medicationId)) return s;
        const others = s.doseLogs.filter((l) => !(l.medicationId === entry.medicationId && l.dayKey === dayKey));
        const log = makeDoseLog({ medicationId: entry.medicationId, dayKey, scheduledTimeMinutes: entry.timeMinutes, status });
        return { ...s, doseLogs: [...others, log] };
      });
    },

    // Mood lives on the day's journal entry (one per day), as on iOS.
    setMood(dayKey, mood) {
      setState((s) => {
        const existing = s.entries.find((e) => e.dayKey === dayKey && e.category === 'journal');
        const title = `${mood.emoji} ${mood.name} mood logged`;
        const entry = existing
          ? { ...existing, title, journal: { ...existing.journal, mood: mood.id }, modifiedAt: Date.now() }
          : makeEntry({ title, category: 'journal', dayKey, timeMinutes: minutesNow(), journal: { mood: mood.id } });
        return { ...s, entries: upsertInto(s.entries, entry) };
      });
    },

    saveDayNote(dayKey, notes) {
      setState((s) => {
        const existing = s.entries.find((e) => e.dayKey === dayKey && e.category === 'journal');
        const entry = existing
          ? { ...existing, notes, modifiedAt: Date.now() }
          : makeEntry({ title: 'Personal journal reflection', category: 'journal', dayKey, timeMinutes: minutesNow(), notes, journal: { mood: '' } });
        return { ...s, entries: upsertInto(s.entries, entry) };
      });
    },

    // One weight reading per day, stored in kg.
    logWeight(dayKey, weightKg, unit = 'kg') {
      const label = unit === 'lbs' ? `${(weightKg * 2.20462).toFixed(1)} lbs` : `${weightKg.toFixed(1)} kg`;
      setState((s) => {
        const existing = s.entries.find((e) => e.dayKey === dayKey && e.weight);
        const entry = existing
          ? { ...existing, title: `Weight: ${label}`, weight: { weightKg, unit }, modifiedAt: Date.now() }
          : makeEntry({ title: `Weight: ${label}`, category: 'symptom', dayKey, timeMinutes: minutesNow(), weight: { weightKg, unit } });
        return { ...s, entries: upsertInto(s.entries, entry) };
      });
    },

    toggleCheck(dayKey, habitId) {
      setState((s) => {
        const day = { ...(s.checks[dayKey] || {}) };
        if (day[habitId]) delete day[habitId];
        else day[habitId] = true;
        return { ...s, checks: { ...s.checks, [dayKey]: day } };
      });
    },

    addHabit(habit) {
      setState((s) => {
        if (s.habits.some((h) => h.id === habit.id || h.title === habit.title)) return s;
        return { ...s, habits: [...s.habits, { id: habit.id || newId(), title: habit.title, subtitle: habit.subtitle || '', icon: habit.icon || 'check-circle-outline', minWeek: habit.minWeek }] };
      });
    },

    removeHabit(id) {
      setState((s) => ({ ...s, habits: s.habits.filter((h) => h.id !== id) }));
    },

    setWeightUnit(weightUnit) {
      setState((s) => ({ ...s, weightUnit }));
    },

    setHabitsEnabled(on) {
      setState((s) => ({ ...s, habitsEnabled: on }));
    },
  }),
  buildIndex
);

export const JournalProvider = store.Provider;
export const useJournal = store.useStore;

// ---- Queries (pure; take the index the store exposes) ----

// Day timeline: entries plus logged medication doses, ordered by time.
// A medication logged on its own day shows as one row with the dose status, not two rows.
export function timelineFor(journal, dayKey) {
  const logs = journal.doseLogsByDay[dayKey] || [];
  const shown = new Set();
  const items = (journal.entriesByDay[dayKey] || []).map((e) => {
    const log = e.medicationId ? logs.find((l) => l.medicationId === e.medicationId) : null;
    if (log) shown.add(log.id);
    return {
      id: `entry-${e.id}`,
      entryId: e.id,
      category: e.category,
      title: e.title,
      summary: summaryFor(journal, e),
      timeMinutes: e.timeMinutes,
      status: log ? doseStatusTitle(log.status) : statusFor(e),
      hasAttachment: e.attachments.length > 0,
    };
  });
  for (const log of logs) {
    const sched = journal.schedulesById[log.medicationId];
    if (!sched || shown.has(log.id)) continue;
    items.push({
      id: `dose-${log.id}`,
      entryId: sched.sourceEntryId,
      category: 'medication',
      title: sched.name,
      summary: `Dose logged as ${doseStatusTitle(log.status).toLowerCase()}`,
      timeMinutes: log.scheduledTimeMinutes,
      status: doseStatusTitle(log.status),
      hasAttachment: false,
    });
  }
  return items.sort((a, b) => {
    const at = a.timeMinutes;
    const bt = b.timeMinutes;
    if (at != null && bt != null && at !== bt) return at - bt;
    if (at != null && bt == null) return -1;
    if (at == null && bt != null) return 1;
    return a.title.localeCompare(b.title);
  });
}

// Next appointments, tests, medications and tasks from a day onward. Care-plan wellness
// routines (weekly yoga etc.) are left out so they don't push real visits off the list.
export function upcomingFrom(journal, dayKey, limit = 4) {
  return Object.keys(journal.entriesByDay)
    .filter((k) => k >= dayKey)
    .sort()
    .flatMap((k) => journal.entriesByDay[k])
    .filter((e) => UPCOMING_CATEGORIES.includes(e.category) && !isClosed(e) && !(e.category === 'task' && e.milestone?.isPersonal === false))
    .slice(0, limit);
}

// The next visit or test that is still open, for Home's appointment card.
export function nextCareEntry(journal, dayKey) {
  return Object.keys(journal.entriesByDay)
    .filter((k) => k >= dayKey)
    .sort()
    .flatMap((k) => journal.entriesByDay[k])
    .find((e) => (e.category === 'appointment' || e.category === 'test') && !isClosed(e));
}

function isClosed(e) {
  if (e.category === 'appointment') return ['completed', 'cancelled'].includes(e.appointment?.status);
  if (e.category === 'test') return ['testCompleted', 'reportReceived'].includes(e.medicalRecord?.reportStatus);
  if (e.category === 'task') return !!e.task?.completed;
  return false;
}

export function summaryFor(journal, e) {
  switch (e.category) {
    case 'medication': {
      const s = journal.schedulesById[e.medicationId];
      return s ? [s.dose, s.instructions].filter(Boolean).join(' · ') || 'Medication' : 'Medication instructions';
    }
    case 'appointment':
      return e.appointment?.clinicianOrClinic || 'Care appointment';
    case 'test':
      return reportStatusTitle(e.medicalRecord?.reportStatus) || 'Medical record';
    case 'symptom':
      if (e.weight) return 'Weight check-in';
      return severityTitle(e.symptom?.severity) || 'Personal wellbeing note';
    case 'food':
      return mealTitle(e.food?.meal) || 'Food entry';
    case 'journal':
      return e.notes || 'Personal note';
    case 'photo':
      return e.attachments.length ? 'Photo attached' : 'Attachment';
    case 'milestone':
      return 'A moment in your journey';
    case 'task':
      return e.task?.completed ? 'Completed' : 'To do';
    default:
      return '';
  }
}

export function statusFor(e) {
  if (e.category === 'appointment') return appointmentStatusTitle(e.appointment?.status) || null;
  if (e.category === 'test') return reportStatusTitle(e.medicalRecord?.reportStatus) || null;
  if (e.category === 'task' && e.task?.completed) return 'Completed';
  return null;
}

// Habits that apply on a given gestational week (null week = show all without a minWeek).
export function habitsForWeek(habits, week) {
  return habits.filter((h) => !h.minWeek || (week != null && week >= h.minWeek));
}

// A day's checkpoints. `week` is the gestational week (null when unknown) so third-trimester
// habits like kick counting only appear when they apply. Shared by Track and Home.
export function useDayCheckpoints(dayKey, week) {
  const journal = useJournal();
  const habits = useMemo(() => habitsForWeek(journal.state.habits, week), [journal.state.habits, week]);
  const checks = journal.state.checks[dayKey] || {};
  const done = habits.filter((h) => checks[h.id]).length;
  return { habits, checks, done, enabled: journal.state.habitsEnabled, toggle: (id) => journal.toggleCheck(dayKey, id) };
}

// Weight entries oldest first, for the Vitals card.
export function weightHistory(journal) {
  return Object.keys(journal.entriesByDay)
    .sort()
    .flatMap((k) => journal.entriesByDay[k].filter((e) => e.weight))
    .map((e) => ({ dayKey: e.dayKey, kg: e.weight.weightKg, unit: e.weight.unit }));
}
