// Deterministic pregnancy dating, ported from the iOS OnboardingProfile and the backend
// PregnancyCalculatorService (Naegele's rule: due date = first day of last period + 280 days).
// Never invents dates: every function returns null when the user hasn't supplied them.
import { toDayKey, addDays, daysBetween } from './dayKey';

const PREGNANCY_DAYS = 280;

// Baby-size table from backend/app/services/pregnancy_calculator.py (nearest week wins).
const WEEK_METRICS = {
  4: { fruit: 'Poppy seed', length: '< 1 mm', weight: '< 1 g', symptoms: ['Mild cramping', 'Fatigue', 'Missed period'] },
  8: { fruit: 'Raspberry', length: '~1.6 cm', weight: '~1 g', symptoms: ['Morning sickness', 'Heightened sense of smell', 'Frequent urination'] },
  12: { fruit: 'Plum', length: '~5.4 cm', weight: '~14 g', symptoms: ['Restoring energy', 'Skin changes', 'Decreasing nausea'] },
  16: { fruit: 'Avocado', length: '~11.6 cm', weight: '~100 g', symptoms: ['Nasal congestion', 'Glowing skin', 'Appetite increase'] },
  20: { fruit: 'Banana', length: '~16.4 cm', weight: '~300 g', symptoms: ['First fetal flutters (quickening)', 'Mild backache', 'Heartburn'] },
  24: { fruit: 'Ear of Corn', length: '~30 cm', weight: '~600 g', symptoms: ['Active baby kicks', 'Braxton Hicks contractions', 'Leg cramps'] },
  28: { fruit: 'Eggplant', length: '~37 cm', weight: '~1 kg', symptoms: ['Mild shortness of breath', 'Trouble sleeping', 'Swollen ankles'] },
  32: { fruit: 'Squash', length: '~42 cm', weight: '~1.7 kg', symptoms: ['Frequent bathroom trips', 'Pelvic pressure', 'Colostrum leakage'] },
  36: { fruit: 'Papaya', length: '~47 cm', weight: '~2.6 kg', symptoms: ['Nesting instinct', 'Baby descending into pelvis', 'Waddling gait'] },
  40: { fruit: 'Watermelon', length: '~51 cm', weight: '~3.4 kg', symptoms: ['Cervical effacement', 'Strong contractions', 'Burst of energy'] },
};

export function estimatedDueDate(profile) {
  if (!profile) return null;
  if (profile.datingMethod === 'dueDate') return profile.dueDate || null;
  if (profile.datingMethod === 'lastPeriod' && profile.lastPeriodDate) return addDays(profile.lastPeriodDate, PREGNANCY_DAYS);
  return null;
}

export function trimesterForWeek(week) {
  if (week == null) return null;
  if (week < 14) return 1;
  if (week < 28) return 2;
  return 3;
}

export const TRIMESTER_NAMES = { 1: 'First Trimester', 2: 'Second Trimester', 3: 'Third Trimester' };

export function babySizeForWeek(week) {
  if (week == null) return null;
  const nearest = Object.keys(WEEK_METRICS)
    .map(Number)
    .reduce((best, w) => (Math.abs(w - week) < Math.abs(best - week) ? w : best), 4);
  return WEEK_METRICS[nearest];
}

// Full pregnancy snapshot, or null when not pregnant / no dates.
export function pregnancyStatus(profile, todayKey = toDayKey()) {
  if (!profile || profile.stage !== 'pregnant') return null;
  const edd = estimatedDueDate(profile);
  if (!edd) return null;
  const lmp = addDays(edd, -PREGNANCY_DAYS);
  const elapsed = Math.max(0, Math.min(daysBetween(lmp, todayKey), 300));
  const week = Math.min(Math.floor(elapsed / 7), 42);
  return {
    dueDate: edd,
    isEstimated: profile.datingMethod !== 'dueDate',
    week,
    day: elapsed % 7,
    trimester: trimesterForWeek(week),
    daysToGo: daysBetween(todayKey, edd),
    progress: Math.min(1, elapsed / PREGNANCY_DAYS),
    baby: babySizeForWeek(week),
  };
}

export function postpartumStatus(profile, todayKey = toDayKey()) {
  if (!profile || profile.stage !== 'postpartum' || !profile.childbirthDate) return null;
  const days = Math.max(0, daysBetween(profile.childbirthDate, todayKey));
  return { days, week: Math.floor(days / 7), childbirthDate: profile.childbirthDate };
}

// Short label for the header pill.
export function stagePillLabel(profile) {
  if (!profile) return 'Set up';
  if (profile.stage === 'pregnant') {
    const p = pregnancyStatus(profile);
    return p ? `Pregnancy W${p.week}` : 'Pregnancy';
  }
  if (profile.stage === 'postpartum') {
    const pp = postpartumStatus(profile);
    return pp ? `Postpartum W${pp.week}` : 'Postpartum';
  }
  return 'Planning';
}

export function ageFromDob(dobKey, todayKey = toDayKey()) {
  if (!dobKey) return null;
  const [y, m, d] = dobKey.split('-').map(Number);
  const [ty, tm, td] = todayKey.split('-').map(Number);
  let age = ty - y;
  if (tm < m || (tm === m && td < d)) age -= 1;
  return age;
}
