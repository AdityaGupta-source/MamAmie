// Clinical care plan, ported from the iOS Services/MaternalSchedulePlanner.swift.
// Builds calendar entries for routine visits, scans, tests and wellness routines from the
// onboarding profile. Ids are derived from the milestone key, so re-syncing never duplicates.
//
// Differences from iOS, on purpose:
// - No dates are invented: with no due date / last period (or no birth date postpartum) the
//   plan is empty, instead of assuming "week 12 today".
// - Milestones already in the past when the plan is built are not marked completed or
//   "report received"; they stay planned and are not reported as missed. Only items that
//   were upcoming when added and then passed count as missed.
import { addDays, toDayKey, daysBetween, formatDayKey } from './dayKey';
import { estimatedDueDate } from './pregnancyDating';
import { makeEntry } from '../models/journal';

const m = (id, week, title, category, purpose, questions, time, window, recurrenceWeeks) => ({
  id, week, title, category, purpose, questions, time, window, recurrenceWeeks,
});

// Routine care (ACOG / WHO standard schedule), as in iOS `allMilestones`.
export const CLINICAL_MILESTONES = [
  // First trimester
  m('maternal_week_08_dating_scan', 8, 'First Trimester Dating & Viability Scan', 'test',
    'Confirm a viable intrauterine pregnancy, detect the heartbeat, measure crown-rump length (CRL) and confirm the estimated due date.',
    ['Is the gestational sac and fetal heartbeat developing normally?', 'Does the crown-rump length match my calculated due date?'], 570, [6, 10]),
  m('maternal_week_08_first_ob_visit', 8, 'Initial Comprehensive Prenatal Consultation', 'appointment',
    'Baseline blood pressure, medical and obstetric history review, prenatal vitamins check (folic acid, iron) and emergency contact plans.',
    ['Are my current prenatal vitamins and medications safe?', 'Which local hospital or birth centre are you affiliated with?'], 630, [6, 10]),
  m('maternal_week_10_blood_panel', 10, 'First Trimester Blood Panel & Urinalysis', 'test',
    'CBC (anaemia screening), blood group & Rh factor, rubella immunity, hepatitis B, HIV and syphilis screening, and urine culture.',
    ['What is my blood type and Rh factor?', 'Are my iron and haemoglobin levels in the normal range?'], 540, [8, 12]),
  m('maternal_week_12_nt_scan', 12, 'Nuchal Translucency (NT) & Early Anatomy Scan', 'test',
    "Ultrasound measuring the fluid behind baby's neck (NT) to screen for trisomy 21 and 18, and early heart formation.",
    ['Is the NT measurement within the normal range?', 'Did you see the nasal bone and early skull structures?'], 600, [11, 13]),
  m('maternal_week_12_prenatal_visit', 12, 'Routine 12-Week Prenatal Checkup', 'appointment',
    'First Doppler listen for the heartbeat, review of blood panel and NT results, weight and blood pressure.',
    ["Can we listen to the baby's heartbeat on Doppler today?", 'How are my blood panel results looking?'], 660, [11, 14]),
  // Second trimester
  m('maternal_week_16_quad_screen', 16, 'Second Trimester Quad Marker Screen (MSAFP)', 'test',
    'MSAFP, hCG, estriol and inhibin-A blood test screening for neural tube and abdominal wall defects.',
    ['Does my MSAFP result indicate healthy neural tube development?'], 570, [15, 18]),
  m('maternal_week_16_prenatal_visit', 16, 'Routine 16-Week Prenatal Visit', 'appointment',
    "Fundal height, Doppler heart rate, blood pressure, and talking about first movements ('quickening').",
    ["When should I expect to feel baby's first flutters?", 'What stretches can ease lower back and round ligament discomfort?'], 630, [15, 18]),
  m('maternal_week_20_anatomy_scan', 20, 'Fetal Anatomy Scan (Level II)', 'test',
    'Mid-pregnancy ultrasound of brain, heart, spine, kidneys, limbs and face, plus placenta position and amniotic fluid.',
    ['Are the organs, heart chambers and spine developing normally?', 'Where is the placenta (is it clear of the cervix)?', 'Is the amniotic fluid level normal?'], 570, [18, 22]),
  m('maternal_week_20_mid_review', 20, 'Mid-Pregnancy Doctor Consultation', 'appointment',
    'Review of the anatomy scan, fundal height, swelling and blood pressure.',
    ['Are there any scan findings that need follow-up?', 'How is my fundal height tracking for week 20?'], 645, [19, 22]),
  m('maternal_week_24_prenatal_visit', 24, 'Routine 24-Week Prenatal Visit', 'appointment',
    'Viability milestone, fundal height, movement check, pre-eclampsia screening and glucose test preparation.',
    ["How should I prepare for next month's glucose test?", 'What pattern of movements is typical now?'], 630, [23, 25]),
  m('maternal_week_26_glucose_screen', 26, 'Gestational Diabetes Glucose Screen (OGTT) & CBC', 'test',
    'Oral glucose challenge test to screen for gestational diabetes, plus a repeat CBC for anaemia.',
    ['What is my glucose test reading?', 'Do my iron levels show any signs of anaemia?'], 540, [24, 28]),
  // Third trimester
  m('maternal_week_28_prenatal_visit', 28, 'Third Trimester Prenatal Visit', 'appointment',
    'Visits move to every two weeks. Review glucose results, start daily kick counts, check swelling and blood pressure.',
    ['How should I track daily kick counts?', 'Are my glucose and iron results clear?'], 630, [27, 29]),
  m('maternal_week_28_tdap_rhogam', 28, 'Tdap Vaccination & Anti-D (if Rh-negative)', 'test',
    'Tdap creates antibodies that cross the placenta to protect your newborn from whooping cough. Anti-D is given if you are Rh-negative.',
    ['Will I get the Tdap booster today?', 'Do I need anti-D based on my blood type?'], 660, [27, 36]),
  m('maternal_week_30_prenatal_visit', 30, 'Routine 30-Week Prenatal Checkup', 'appointment',
    'Blood pressure, urine protein and glucose, fundal height, and comfortable left-side sleeping.',
    ['Is my fundal growth on track?', 'Which pre-eclampsia signs should I watch for at home?'], 630, [29, 31]),
  m('maternal_week_32_growth_scan', 32, 'Third Trimester Growth & Wellbeing Scan', 'test',
    'Ultrasound of growth, estimated fetal weight, amniotic fluid and presentation (head-down or breech).',
    ["What is baby's estimated weight and percentile?", 'Is baby head-down?', 'Is the amniotic fluid volume healthy?'], 570, [30, 34]),
  m('maternal_week_32_prenatal_visit', 32, 'Routine 32-Week Prenatal Visit', 'appointment',
    'Review the growth scan and presentation, and preterm labour warning signs (regular contractions, leaking fluid, bleeding).',
    ['Did the growth scan look healthy?', 'What contraction pattern should make me call the labour ward?'], 645, [31, 33]),
  m('maternal_week_34_prenatal_visit', 34, 'Routine 34-Week Visit & Birth Plan Review', 'appointment',
    'Check presentation, discuss pain relief options and finalise hospital admission documents.',
    ["Is baby's head down toward the pelvis?", 'Can we review my birth plan and pain relief preferences?'], 630, [33, 35]),
  m('maternal_week_36_gbs_swab', 36, 'Group B Streptococcus (GBS) Swab', 'test',
    'A swab to screen for Group B Strep. If positive, IV antibiotics during labour protect baby.',
    ['How will I get my GBS result?', 'What happens in labour if my swab is positive?'], 570, [35, 37]),
  m('maternal_week_36_prenatal_visit', 36, '36-Week Prenatal Visit (Weekly Visits Begin)', 'appointment',
    "Weekly checkups start. Head engagement, blood pressure, and making sure the hospital bag and car seat are ready.",
    ["Has baby's head dropped into the pelvis?", 'When in labour should I leave for the hospital?'], 630, [35, 37]),
  m('maternal_week_37_full_term_visit', 37, '37-Week Full Term Checkup', 'appointment',
    'Early full term. Cervical check if indicated, heart tones, and what to do if your waters break.',
    ['Are there signs of effacement or dilation?', 'What should I do if my waters break before contractions?'], 630, [36, 38]),
  m('maternal_week_38_prenatal_visit', 38, '38-Week Prenatal Checkup', 'appointment',
    'Weekly check: blood pressure, urine protein, heart rate, and the 5-1-1 contraction rule.',
    ['Is baby still moving strongly?', 'Can you confirm the hospital triage phone number?'], 630, [37, 39]),
  m('maternal_week_39_prenatal_visit', 39, '39-Week Prenatal Checkup', 'appointment',
    'Weekly check: cervical readiness, head station and signs of spontaneous labour.',
    ["What is baby's station?", 'Which natural techniques are safe to encourage labour?'], 630, [38, 40]),
  m('maternal_week_40_due_date_visit', 40, 'Due Date Consultation & Non-Stress Test', 'appointment',
    'Non-stress test and biophysical profile if needed to check fluid and wellbeing if labour has not started.',
    ["How is baby's heart rate responding on the NST?", 'What is the monitoring plan for the coming days?'], 600, [39, 41]),
];

// Optional wellness routines, as in iOS `wellnessMilestones`.
export const WELLNESS_MILESTONES = [
  m('maternal_wellness_walking', 12, 'Gentle Prenatal Walk (20–30 min)', 'task',
    'ACOG recommends 150 minutes of moderate activity a week. Walking helps circulation, blood glucose, sleep and back tension.',
    ['Are there heart rate or exertion limits I should follow?'], 480, [4, 41]),
  m('maternal_wellness_yoga', 10, 'Prenatal Yoga & Hip-Opening Stretches', 'task',
    'Cat-cow, supported squats and butterfly stretches to keep pelvic ligaments flexible.',
    ['Which stretches are best for round ligament tension?'], 600, [8, 41], 1),
  m('maternal_wellness_vit_d', 13, 'Morning Sunlight & Vitamin D (15–20 min)', 'task',
    'Sunlight supports vitamin D for fetal bone and tooth development and a steady body clock.',
    ['Should my vitamin D level be checked with routine labs?'], 510, [4, 41], 2),
  m('maternal_wellness_hydration', 14, 'Daily Hydration Target (2.5 L)', 'task',
    'Supports amniotic fluid and expanding blood volume, and helps prevent dehydration-triggered Braxton Hicks.',
    ['How much water do you recommend for my stage?'], 540, [4, 41]),
  m('maternal_wellness_magnesium', 16, 'Warm Epsom Salt Soak for Leg Cramps', 'task',
    'A warm soak relaxes tense calves and can ease night-time leg cramps.',
    ['Are warm magnesium foot soaks safe for me?'], 1230, [14, 41], 2),
  m('maternal_wellness_kegels', 18, 'Pelvic Floor (Kegel) & Gentle Core Care', 'task',
    'Gentle pelvic floor contractions (3 sets of 10) support bladder control, labour and recovery.',
    ['Can you check I am using the right pelvic floor muscles?'], 1140, [12, 41]),
  m('maternal_wellness_side_sleep', 20, 'Left-Side Sleeping & Pillow Check', 'task',
    'Sleeping on your left side with a knee pillow keeps the uterus off the vena cava and helps placental blood flow.',
    ['What pillow setup helps hip and back pain at night?'], 1320, [18, 41]),
  m('maternal_wellness_leg_elevation', 24, '15-Minute Leg Elevation for Swelling', 'task',
    'Resting with feet above heart level helps fluid return and eases ankle swelling.',
    ['Is my ankle swelling within the expected range?'], 1020, [20, 41]),
  m('maternal_wellness_kick_counts', 28, 'Daily Kick Count (10 movements in 2 h)', 'task',
    "Count 10 distinct movements (kicks, rolls, flutters) during baby's active time each evening.",
    ['What should I do if I notice fewer movements?'], 1200, [28, 41]),
  m('maternal_wellness_perineal_massage', 34, 'Perineal Massage & Labour Prep Stretching', 'task',
    'Gentle perineal massage from 34–35 weeks can improve tissue elasticity before birth.',
    ['Do you recommend perineal massage for me?'], 1260, [34, 41], 2),
  m('maternal_wellness_hospital_bag', 35, 'Pack Hospital Bag & Newborn Essentials', 'task',
    "Labour comfort items, car seat, maternity records, postpartum supplies and baby's going-home outfit.",
    ['What documents or supplies does your maternity ward need?'], 600, [34, 38]),
];

const POSTPARTUM = [
  { id: 'postpartum_week_02', offset: 14, time: 600, title: '2-Week Newborn & Maternal Healing Checkup', clinician: 'Pediatrician & Maternity Clinic',
    notes: 'Newborn feeding, weight gain and cord healing, plus your own recovery.', questions: 'How is feeding and latch? Are after-birth pains easing?' },
  { id: 'postpartum_week_06', offset: 42, time: 630, title: '6-Week Postpartum OB/GYN Exam', clinician: 'OB/GYN Clinic',
    notes: 'Uterine recovery, pelvic floor, wellbeing screening (EPDS) and contraception advice.', questions: 'How is pelvic floor recovery? When can I safely return to exercise?' },
];

const PLAN_VERSION = 2;
export const SCHEDULE_ID_PREFIX = 'schedule:';
export const isScheduleEntry = (e) => typeof e?.id === 'string' && e.id.startsWith(SCHEDULE_ID_PREFIX);

// Who the visit is with, from the onboarding care answer (the answer text itself reads oddly here).
const CARE_PROVIDER = { regularOBGYN: 'Your OB/GYN', midwifeOrFamily: 'Your midwife or family doctor' };
const careTitle = (key) => CARE_PROVIDER[key] || 'Your care team';

function notesFor(ms) {
  return `${ms.purpose}\n\nQuestions for your clinician:\n• ${ms.questions.join('\n• ')}`;
}

// Inputs that change the generated plan; when this changes, dates are re-synced.
export function scheduleSignature(profile) {
  if (!profile) return '';
  // Bump PLAN_VERSION when the generated text changes so existing plans refresh.
  return [PLAN_VERSION, profile.stage, estimatedDueDate(profile) || '', profile.childbirthDate || '', profile.clinicalCareStatus || ''].join('|');
}

export function generateSchedule(profile) {
  if (!profile) return [];
  if (profile.stage === 'postpartum') {
    if (!profile.childbirthDate) return [];
    return POSTPARTUM.map((p) =>
      makeEntry({
        id: SCHEDULE_ID_PREFIX + p.id,
        title: p.title,
        category: 'appointment',
        dayKey: addDays(profile.childbirthDate, p.offset),
        timeMinutes: p.time,
        notes: p.notes,
        appointment: { clinicianOrClinic: p.clinician, location: 'Clinic', questions: p.questions, status: 'scheduled' },
        milestone: { isPersonal: false },
      })
    );
  }
  if (profile.stage !== 'pregnant') return [];
  const edd = estimatedDueDate(profile);
  if (!edd) return [];
  const start = addDays(edd, -280);

  const out = [];
  for (const ms of [...CLINICAL_MILESTONES, ...WELLNESS_MILESTONES]) {
    const weeks = [];
    if (ms.recurrenceWeeks) for (let w = ms.window[0]; w <= ms.window[1]; w += ms.recurrenceWeeks) weeks.push(w);
    else weeks.push(ms.week);

    for (const w of weeks) {
      const instance = ms.recurrenceWeeks ? `${ms.id}_w${w}` : ms.id;
      out.push(
        makeEntry({
          id: SCHEDULE_ID_PREFIX + instance,
          title: ms.title,
          category: ms.category,
          dayKey: addDays(start, w * 7),
          timeMinutes: ms.time,
          notes: notesFor(ms),
          appointment:
            ms.category === 'appointment'
              ? { clinicianOrClinic: careTitle(profile.clinicalCareStatus), location: 'Hospital / OB clinic', questions: ms.questions.join('\n'), status: 'scheduled' }
              : null,
          medicalRecord: ms.category === 'test' ? { reportStatus: 'planned', followUpDayKey: null } : null,
          task: ms.category === 'task' ? { completed: false } : null,
          milestone: { isPersonal: false },
        })
      );
    }
  }
  return out;
}

// Work the user has done on an entry that a re-sync must never overwrite.
function isProtected(e) {
  return (
    e.appointment?.status === 'completed' ||
    e.appointment?.status === 'rescheduled' ||
    e.medicalRecord?.reportStatus === 'testCompleted' ||
    e.medicalRecord?.reportStatus === 'reportReceived' ||
    e.task?.completed ||
    e.attachments?.length > 0
  );
}

// Returns { upserts, removeIds } to bring the journal in line with the profile.
// New milestones are added; when the profile's dates changed (`redate`), untouched generated
// entries move to their new days and ones no longer in the plan are removed.
export function planScheduleSync(entriesById, profile, redate) {
  const generated = generateSchedule(profile);
  const wanted = new Set(generated.map((g) => g.id));
  const upserts = [];
  for (const g of generated) {
    const existing = entriesById[g.id];
    if (!existing) upserts.push(g);
    else if (
      redate &&
      !isProtected(existing) &&
      (existing.dayKey !== g.dayKey || existing.title !== g.title || existing.appointment?.clinicianOrClinic !== g.appointment?.clinicianOrClinic)
    ) {
      upserts.push({ ...existing, dayKey: g.dayKey, title: g.title, notes: g.notes, appointment: g.appointment ?? existing.appointment, modifiedAt: Date.now() });
    }
  }
  const removeIds = redate
    ? Object.values(entriesById).filter((e) => isScheduleEntry(e) && !wanted.has(e.id) && !isProtected(e)).map((e) => e.id)
    : [];
  return { upserts, removeIds };
}

// ---- Missed visits and tests ----

// An appointment or test that was still open when its day passed. Items that were already
// in the past when they were added (backfilled plan, or a visit logged after the fact) are skipped.
export function detectMissed(entries, todayKey = toDayKey()) {
  return entries
    .filter((e) => {
      if (e.dayKey >= todayKey) return false;
      if (toDayKey(new Date(e.createdAt)) > e.dayKey) return false;
      const apptOpen = e.category === 'appointment' && ['planned', 'scheduled'].includes(e.appointment?.status);
      const testOpen = e.category === 'test' && ['planned', 'followUpNeeded'].includes(e.medicalRecord?.reportStatus);
      return apptOpen || testOpen;
    })
    .map((e) => ({ entry: e, daysOverdue: Math.max(1, daysBetween(e.dayKey, todayKey)) }))
    .sort((a, b) => b.daysOverdue - a.daysOverdue);
}

// Moves a missed item forward ("revise"), marking appointments as rescheduled.
export function reviseEntry(entry, targetKey) {
  const from = formatDayKey(entry.dayKey, { short: true });
  return {
    ...entry,
    dayKey: targetKey,
    appointment: entry.appointment ? { ...entry.appointment, status: 'rescheduled' } : entry.appointment,
    notes: `${entry.notes}\n\n[Moved by MamAmie from ${from}.]`.trim(),
    modifiedAt: Date.now(),
  };
}

// Revises every missed item, staggered over the next 1–4 days so they don't land on one day.
export function reviseAllMissed(missed, todayKey = toDayKey()) {
  return missed.map((r, i) => reviseEntry(r.entry, addDays(todayKey, (i % 4) + 1)));
}
