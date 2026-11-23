// Onboarding profile shape and option lists, ported from the iOS
// Models/Onboarding/OnboardingProfile.swift and Views/Onboarding/*.
// All dates are local day keys ("yyyy-MM-dd").

export const STAGES = [
  { key: 'planning', title: 'Planning a pregnancy', subtitle: 'Preparation, cycle awareness, and mindful wellness.', icon: 'auto-awesome', tone: 'secondary' },
  { key: 'pregnant', title: 'Currently pregnant', subtitle: 'A calm place to follow your pregnancy week by week.', icon: 'pregnant-woman', tone: 'primary' },
  { key: 'postpartum', title: 'Postpartum', subtitle: 'Gentle support for your recovery and newborn care.', icon: 'favorite', tone: 'tertiary' },
];

export const DATING_METHODS = [
  { key: 'dueDate', title: 'I know my due date', subtitle: 'Use the date provided by your healthcare professional.' },
  { key: 'lastPeriod', title: 'I know the first day of my last period', subtitle: 'We estimate a due date using the standard 280-day calculation.' },
  { key: 'notSet', title: "I'll add dates later", subtitle: 'You can still use MamAmie without pregnancy dates.' },
];

export const CARE_STATUSES = [
  { key: 'regularOBGYN', title: 'Yes, regular OB/GYN care' },
  { key: 'midwifeOrFamily', title: 'Yes, midwife or family doctor' },
  { key: 'lookingForCare', title: 'Currently looking for care' },
  { key: 'notReceivingCare', title: 'Not receiving care right now' },
  { key: 'unspecified', title: 'Prefer not to say' },
];

export const MULTIPLE_TYPES = [
  { key: 'single', title: 'Single baby' },
  { key: 'twins', title: 'Twins' },
  { key: 'multiples', title: 'Triplets or more' },
  { key: 'unsure', title: 'Not sure yet' },
];

export const COMPLICATION_CHIPS = [
  'None', 'Gestational diabetes', 'Pre-eclampsia', 'Preterm birth (< 37 weeks)', 'C-section delivery',
  'High blood pressure', 'Low birth weight', 'Prefer not to say',
];

export const CONDITION_CHIPS = [
  'None', 'Gestational diabetes', 'Thyroid condition', 'Asthma', 'High blood pressure', 'PCOS',
  'Type 1 / 2 diabetes', 'Autoimmune condition',
];

export const ALLERGY_CHIPS = [
  'None', 'Penicillin / Antibiotics', 'Peanuts & Tree nuts', 'Lactose / Dairy', 'Gluten', 'Latex', 'Sulfa drugs', 'Iodine',
];

export const MEDICATION_CHIPS = [
  'Prenatal multivitamin', 'Folic acid', 'Iron supplement', 'Calcium / Vitamin D', 'Prescription medication', 'None',
];

export const DIETS = [
  { key: 'vegetarian', title: 'Vegetarian', subtitle: 'Plant-based with dairy, no meat or seafood.', icon: 'eco' },
  { key: 'vegan', title: 'Vegan', subtitle: '100% plant-based, no animal products.', icon: 'spa' },
  { key: 'eggetarian', title: 'Eggetarian', subtitle: 'Vegetarian with eggs included.', icon: 'egg' },
  { key: 'nonVegetarian', title: 'Non-vegetarian', subtitle: 'Includes poultry, meat, and seafood.', icon: 'restaurant' },
  { key: 'otherOrNone', title: 'No specific preference', subtitle: 'Flexible or custom eating.', icon: 'favorite-border' },
];

export const MEAL_TRACKING = [
  { key: 'both', title: 'Photo & manual' },
  { key: 'photo', title: 'Mostly photos' },
  { key: 'manual', title: 'Manual diary' },
  { key: 'skip', title: 'Decide later' },
];

export const LIFESTYLE_OPTIONS = [
  'Daily gentle walking (20–30 min)', 'Hydration goal (2.5L / day)', 'Pelvic floor & Kegels', 'Kick counts (Week 28+)',
  'Prenatal yoga & stretching', 'Mindful rest & breathing', 'Sleep monitoring',
];

export const DEVICE_OPTIONS = [
  'Smartwatch', 'Fitness tracker', 'Blood pressure monitor', 'Smart scale', 'None / phone only',
];

export const METRIC_OPTIONS = [
  'Heart rate', 'Blood oxygen (SpO2)', 'Blood pressure', 'Sleep stages', 'Activity & steps', 'Heart-rate variability (HRV)', 'Wrist temperature trends',
];

export const REMINDERS = [
  { key: 'pregnancyUpdates', title: 'Pregnancy updates', subtitle: 'Weekly developmental insights and stage tips.', icon: 'notifications-active' },
  { key: 'appointments', title: 'Appointments', subtitle: 'Prenatal visits, ultrasounds, and lab tests.', icon: 'event' },
  { key: 'medications', title: 'Medicine & supplements', subtitle: 'Reminders for schedules you enter or confirm.', icon: 'medication' },
  { key: 'dailyCheckIns', title: 'Daily check-ins', subtitle: 'Gentle hydration, rest, and mindful prompts.', icon: 'wb-sunny' },
  { key: 'weeklySummaries', title: 'Weekly summaries', subtitle: 'Resting vitals, rest, and activity trends.', icon: 'insert-chart-outlined' },
];

export function emptyDraft() {
  return {
    // About you
    displayName: '',
    dateOfBirth: null,
    country: 'India',
    preferredLanguage: 'English',
    // Journey
    stage: null,
    datingMethod: 'dueDate',
    dueDate: null,
    lastPeriodDate: null,
    trackCycle: false,
    childbirthDate: null,
    clinicalCareStatus: 'unspecified',
    // History
    isFirstPregnancy: null,
    totalPregnancies: null,
    previousBirths: null,
    multiplePregnancyType: 'single',
    previousComplications: [],
    previousComplicationsNotes: '',
    // Health
    medicalConditions: [],
    medicalConditionsNotes: '',
    allergies: [],
    allergiesNotes: '',
    medicationsAndSupplements: [],
    clinicalInstructions: '',
    // Nutrition & lifestyle
    dietaryPreference: null,
    dietaryRestrictionsNotes: '',
    mealTrackingPreference: 'both',
    lifestyleTrackingPriorities: [],
    // Connected health
    connectedDevices: [],
    measurementsOfInterest: [],
    // Reminders
    selectedReminders: ['appointments', 'medications'],
    // Admin
    privacyAcknowledgedAt: null,
    completedAt: null,
  };
}

// "None" is exclusive in multi-select chip groups.
export function toggleChip(list, value) {
  if (list.includes(value)) return list.filter((v) => v !== value);
  if (value === 'None' || value === 'None / phone only' || value === 'Prefer not to say') return [value];
  return [...list.filter((v) => v !== 'None' && v !== 'None / phone only' && v !== 'Prefer not to say'), value];
}
