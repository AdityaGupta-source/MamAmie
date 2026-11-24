import { toDayKey, addDays } from '../../services/dayKey';

// Date windows for each picker (day keys).
export function dateLimits(todayKey = toDayKey()) {
  return {
    dob: { min: addDays(todayKey, -365 * 60), max: addDays(todayKey, -365 * 13) },
    dueDate: { min: addDays(todayKey, -21), max: addDays(todayKey, 300) },
    lastPeriod: { min: addDays(todayKey, -300), max: todayKey },
    childbirth: { min: addDays(todayKey, -365 * 2), max: todayKey },
  };
}

// Returns an error message for the step, or null if the user can continue.
export function validateStep(step, d) {
  const lim = dateLimits();
  if (step === 'journey') {
    if (!d.stage) return 'Choose where you are in your journey.';
    if (d.stage === 'pregnant') {
      if (d.datingMethod === 'dueDate') {
        if (!d.dueDate) return 'Add your due date, or choose “I’ll add dates later”.';
        if (d.dueDate < lim.dueDate.min || d.dueDate > lim.dueDate.max) return 'That due date looks outside a typical pregnancy range.';
      }
      if (d.datingMethod === 'lastPeriod') {
        if (!d.lastPeriodDate) return 'Add the first day of your last period, or choose “I’ll add dates later”.';
        if (d.lastPeriodDate < lim.lastPeriod.min || d.lastPeriodDate > lim.lastPeriod.max) return 'That date should be within the last 300 days.';
      }
    }
    if (d.stage === 'postpartum' && d.childbirthDate && d.childbirthDate > lim.childbirth.max) return 'Date of birth can’t be in the future.';
  }
  if (step === 'history') {
    if (d.totalPregnancies != null && d.previousBirths != null && d.previousBirths > d.totalPregnancies) {
      return 'Previous births can’t be more than total pregnancies.';
    }
  }
  if (step === 'summary' && !d.privacyAcknowledgedAt) return 'Please confirm you’ve read how MamAmie handles your data.';
  return null;
}
