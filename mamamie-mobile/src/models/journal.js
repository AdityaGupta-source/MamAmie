// Calendar journal shapes and option lists, ported from the iOS Models/CalendarEntry.swift,
// EntryCategory.swift, EntryStatus.swift and MedicationModels.swift.
// Every record has a stable string id; dates are local day keys ("yyyy-MM-dd").
import { newId } from '../services/ids';

// Order matters: it is the order of the dots on a calendar day and in the legend.
export const CATEGORIES = [
  { key: 'appointment', label: 'Appointment', title: 'Doctor appointment', icon: 'stethoscope' },
  { key: 'test', label: 'Test or report', title: 'Medical test or report', icon: 'biotech' },
  { key: 'medication', label: 'Medication', title: 'Medication or supplement', icon: 'medication' },
  { key: 'symptom', label: 'Wellbeing', title: 'Symptoms and wellbeing', icon: 'healing' },
  { key: 'food', label: 'Food', title: 'Food and nutrition', icon: 'restaurant' },
  { key: 'journal', label: 'Journal', title: 'Personal journal', icon: 'menu-book' },
  { key: 'photo', label: 'Photo', title: 'Photograph or attachment', icon: 'photo' },
  { key: 'milestone', label: 'Milestone', title: 'Pregnancy milestone', icon: 'star' },
  { key: 'task', label: 'Task', title: 'Task or reminder', icon: 'checklist' },
];
export const CATEGORY = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));

export const APPOINTMENT_STATUSES = [
  { key: 'planned', title: 'Planned' },
  { key: 'scheduled', title: 'Scheduled' },
  { key: 'completed', title: 'Completed' },
  { key: 'rescheduled', title: 'Rescheduled' },
  { key: 'cancelled', title: 'Cancelled' },
];

export const REPORT_STATUSES = [
  { key: 'planned', title: 'Planned' },
  { key: 'testCompleted', title: 'Test completed' },
  { key: 'reportPending', title: 'Report pending' },
  { key: 'reportReceived', title: 'Report received' },
  { key: 'followUpNeeded', title: 'Follow-up needed' },
];

export const SEVERITIES = [
  { key: 'mild', title: 'Mild' },
  { key: 'moderate', title: 'Moderate' },
  { key: 'severe', title: 'Severe' },
];

export const MEALS = [
  { key: 'breakfast', title: 'Breakfast' },
  { key: 'lunch', title: 'Lunch' },
  { key: 'dinner', title: 'Dinner' },
  { key: 'snack', title: 'Snack' },
  { key: 'other', title: 'Other' },
];

export const DOSE_STATUSES = [
  { key: 'taken', title: 'Taken' },
  { key: 'skipped', title: 'Skipped' },
  { key: 'notConfirmed', title: 'Not yet confirmed' },
];

const titleOf = (list, key) => list.find((s) => s.key === key)?.title;
export const appointmentStatusTitle = (k) => titleOf(APPOINTMENT_STATUSES, k);
export const reportStatusTitle = (k) => titleOf(REPORT_STATUSES, k);
export const doseStatusTitle = (k) => titleOf(DOSE_STATUSES, k);
export const severityTitle = (k) => titleOf(SEVERITIES, k);
export const mealTitle = (k) => titleOf(MEALS, k);

// Mood options from iOS DayMoodTrackerView. `id` is what gets stored.
export const MOODS = [
  { id: 'Radiant', name: 'Radiant', emoji: '🌸', affirmation: 'Embrace this glowing energy! You and your little one are thriving today.' },
  { id: 'Calm', name: 'Calm', emoji: '🌿', affirmation: "Peaceful moments nourish your heart and your baby's developing nervous system." },
  { id: 'Tired', name: 'Tired', emoji: '😴', affirmation: 'Rest is vital productive work. Your body is building a whole human life.' },
  { id: 'Emotional', name: 'Sensitive', emoji: '🌊', affirmation: 'Hormone shifts and deep emotions are natural. Give yourself gentle grace.' },
  { id: 'Anxious', name: 'Anxious', emoji: '🌧️', affirmation: 'Take a slow, deep breath. One moment at a time, you have everything it takes.' },
  { id: 'Nauseous', name: 'Nauseous', emoji: '🤢', affirmation: 'Sip cool water or ginger tea. Remember, this intense phase is temporary.' },
];
export const moodById = (id) => (id ? MOODS.find((m) => m.id.toLowerCase() === String(id).toLowerCase()) : null);

// Daily checkpoint suggestions from iOS DayCheckpointsView. `minWeek` hides an item
// until that gestational week (kick counting is a third-trimester habit).
export const CHECKPOINTS = [
  { id: 'water_goal', title: 'Drink 2.5 L water (8–10 cups)', subtitle: 'Maintains amniotic fluid & prevents contractions', icon: 'water-drop' },
  { id: 'steps_goal', title: 'Walk 4,000 gentle steps (20–30 min)', subtitle: 'ACOG moderate aerobic movement goal', icon: 'directions-walk' },
  { id: 'prenatal_vitamin', title: 'Take prenatal vitamin & iron', subtitle: 'Supports neural tube & red blood cells', icon: 'medication' },
  { id: 'sunlight_vit_d', title: '15 min morning sunlight', subtitle: 'Aids fetal bone & teeth mineralisation', icon: 'wb-sunny' },
  { id: 'leg_elevation', title: 'Elevate legs for 15 min', subtitle: 'Eases ankle swelling & venous return', icon: 'airline-seat-legroom-extra' },
  { id: 'kegels', title: 'Pelvic floor (Kegel) exercises', subtitle: 'Strengthens pelvic floor for labour & recovery', icon: 'self-improvement' },
  { id: 'left_side_sleep', title: 'Left-side sleep with knee pillow', subtitle: 'Maximises placental blood & oxygen flow', icon: 'bedtime' },
  { id: 'kick_counts', title: "Count 10 kicks in baby's active window", subtitle: 'Third-trimester daily movement check', icon: 'child-care', minWeek: 28 },
  { id: 'prenatal_stretch', title: '10 min hip-opening stretches', subtitle: 'Relieves lower back tension', icon: 'accessibility-new' },
];
export const DEFAULT_HABIT_IDS = ['water_goal', 'steps_goal', 'prenatal_vitamin', 'sunlight_vit_d'];

// Builds a new entry with defaults for everything not supplied.
export function makeEntry(fields) {
  const now = Date.now();
  return {
    id: newId(),
    title: '',
    category: 'journal',
    dayKey: null,
    timeMinutes: null,
    notes: '',
    createdAt: now,
    modifiedAt: now,
    attachments: [],
    medicationId: null,
    appointment: null,
    medicalRecord: null,
    symptom: null,
    food: null,
    journal: null,
    milestone: null,
    task: null,
    weight: null,
    ...fields,
  };
}

export function makeMedicationSchedule({ sourceEntryId, name, dose = '', instructions = '', recurrence = 'daily' }) {
  const now = Date.now();
  return { id: newId(), sourceEntryId, name, dose, instructions, recurrence, createdAt: now, modifiedAt: now };
}

export function makeDoseLog({ medicationId, dayKey, scheduledTimeMinutes = null, status, notes = '' }) {
  return { id: newId(), medicationId, dayKey, scheduledTimeMinutes, actualLoggedAt: Date.now(), status, notes };
}

// "9:30 AM" from minutes after midnight.
export function formatMinutes(m) {
  if (m == null) return '';
  const h = Math.floor(m / 60);
  const min = m % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(min).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

export function minutesNow(date = new Date()) {
  return date.getHours() * 60 + date.getMinutes();
}
