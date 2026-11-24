import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Fonts } from '../../constants/theme';
import { Icon, T } from '../../components/ui';
import { ChipGroup, DateField, FieldLabel, PrimaryButton, TextField } from '../../components/forms';
import Sheet from '../../components/Sheet';
import TimeField from './TimeField';
import { categoryIconColor } from './categoryStyle';
import { useJournal } from '../../stores/journalStore';
import {
  CATEGORIES,
  CATEGORY,
  APPOINTMENT_STATUSES,
  REPORT_STATUSES,
  SEVERITIES,
  MEALS,
  makeEntry,
  makeMedicationSchedule,
} from '../../models/journal';

// Photos and attachments arrive with the Vault (Phase 6); everything else can be added here.
const ADDABLE = CATEGORIES.filter((c) => c.key !== 'photo');

function draftFrom(entry, dayKey, schedule, preset) {
  return {
    category: entry?.category || preset?.category || null,
    title: entry?.title || preset?.title || '',
    dayKey: entry?.dayKey || dayKey,
    timeMinutes: entry?.timeMinutes ?? null,
    notes: entry?.notes || '',
    clinician: entry?.appointment?.clinicianOrClinic || '',
    location: entry?.appointment?.location || '',
    questions: entry?.appointment?.questions || '',
    apptStatus: entry?.appointment?.status || 'scheduled',
    reportStatus: entry?.medicalRecord?.reportStatus || 'planned',
    severity: entry?.symptom?.severity || 'mild',
    discuss: !!entry?.symptom?.discussWithClinician,
    meal: entry?.food?.meal || 'other',
    portion: entry?.food?.portion || '',
    dose: schedule?.dose || '',
    instructions: schedule?.instructions || '',
  };
}

// Add or edit one journal entry. `entry` null = new entry on `dayKey`, optionally starting
// from `preset` ({ category, title }).
export default function EntryEditorSheet({ visible, entry, dayKey, preset, onClose }) {
  const journal = useJournal();
  const schedule = entry?.medicationId ? journal.schedulesById[entry.medicationId] : null;
  const [d, setD] = useState(() => draftFrom(entry, dayKey, schedule, preset));

  useEffect(() => {
    if (visible) setD(draftFrom(entry, dayKey, schedule, preset));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const set = (patch) => setD((x) => ({ ...x, ...patch }));
  const cat = d.category;
  const canSave = !!cat && d.title.trim().length > 0 && !!d.dayKey;

  const save = () => {
    const base = entry || makeEntry({});
    const next = {
      ...base,
      category: cat,
      title: d.title.trim(),
      dayKey: d.dayKey,
      timeMinutes: d.timeMinutes,
      notes: d.notes.trim(),
      appointment: cat === 'appointment' ? { clinicianOrClinic: d.clinician.trim(), location: d.location.trim(), questions: d.questions.trim(), status: d.apptStatus } : null,
      medicalRecord: cat === 'test' ? { reportStatus: d.reportStatus, followUpDayKey: base.medicalRecord?.followUpDayKey ?? null } : null,
      symptom: cat === 'symptom' && !base.weight ? { severity: d.severity, duration: base.symptom?.duration || '', discussWithClinician: d.discuss } : null,
      food: cat === 'food' ? { ...(base.food || {}), meal: d.meal, portion: d.portion.trim() } : null,
      journal: cat === 'journal' ? base.journal || { mood: '' } : null,
      milestone: cat === 'milestone' ? base.milestone || { isPersonal: true } : base.milestone,
      task: cat === 'task' ? base.task || { completed: false } : null,
      weight: cat === 'symptom' ? base.weight : null,
    };

    let sched = null;
    if (cat === 'medication') {
      sched = schedule
        ? { ...schedule, name: next.title, dose: d.dose.trim(), instructions: d.instructions.trim(), modifiedAt: Date.now() }
        : makeMedicationSchedule({ sourceEntryId: next.id, name: next.title, dose: d.dose.trim(), instructions: d.instructions.trim() });
      next.medicationId = sched.id;
    } else {
      next.medicationId = null;
    }
    journal.upsertEntry(next, sched);
    onClose();
  };

  return (
    <Sheet
      visible={visible}
      title={entry ? 'Edit entry' : 'Add to your journal'}
      onClose={onClose}
      footer={cat ? <PrimaryButton label={entry ? 'Save changes' : 'Add entry'} icon="check" disabled={!canSave} onPress={save} /> : null}
    >
      {!cat || !entry ? (
        <View>
          <FieldLabel>What would you like to add?</FieldLabel>
          <View style={styles.catGrid}>
            {ADDABLE.map((c) => {
              const on = c.key === cat;
              return (
                <TouchableOpacity key={c.key} onPress={() => set({ category: c.key })} style={[styles.catChip, on && styles.catChipOn]} accessibilityRole="radio" accessibilityState={{ selected: on }}>
                  <View style={[styles.catIcon, { backgroundColor: on ? Colors.primary : Colors.surfaceContainer }]}>
                    <Icon name={c.icon} size={18} color={on ? Colors.onPrimary : categoryIconColor(c.key)} />
                  </View>
                  <T v="labelMd" color={on ? Colors.onPrimaryFixed : Colors.onSurface} style={{ fontFamily: Fonts.medium, flex: 1 }} numberOfLines={2}>{c.label}</T>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : (
        <View style={styles.catBadge}>
          <Icon name={CATEGORY[cat].icon} size={16} color={Colors.primary} />
          <T v="labelMd" color={Colors.primary}>{CATEGORY[cat].title}</T>
        </View>
      )}

      {cat && (
        <>
          <TextField label={cat === 'medication' ? 'Medication or supplement' : 'Title'} value={d.title} onChangeText={(title) => set({ title })} placeholder={PLACEHOLDERS[cat]} />
          <DateField label="Date" value={d.dayKey} onChange={(k) => k && set({ dayKey: k })} />
          <TimeField value={d.timeMinutes} onChange={(timeMinutes) => set({ timeMinutes })} />

          {cat === 'appointment' && (
            <>
              <TextField label="Clinician or clinic" optional value={d.clinician} onChangeText={(clinician) => set({ clinician })} placeholder="e.g. Dr. Rao, City Maternity" />
              <TextField label="Location" optional value={d.location} onChangeText={(location) => set({ location })} />
              <View>
                <FieldLabel>Status</FieldLabel>
                <ChipGroup single options={APPOINTMENT_STATUSES} value={d.apptStatus} onToggle={(apptStatus) => set({ apptStatus })} />
              </View>
              <TextField label="Questions to ask" optional multiline value={d.questions} onChangeText={(questions) => set({ questions })} />
            </>
          )}

          {cat === 'test' && (
            <View>
              <FieldLabel>Report status</FieldLabel>
              <ChipGroup single options={REPORT_STATUSES} value={d.reportStatus} onToggle={(reportStatus) => set({ reportStatus })} />
            </View>
          )}

          {cat === 'medication' && (
            <>
              <TextField label="Dose as prescribed" optional value={d.dose} onChangeText={(dose) => set({ dose })} placeholder="As written on your prescription" />
              <TextField label="Instructions" optional value={d.instructions} onChangeText={(instructions) => set({ instructions })} placeholder="e.g. after breakfast" />
              <T v="bodySm" color={Colors.onSurfaceVariant}>MamAmie records what you were told to take. It never suggests or changes a dose.</T>
            </>
          )}

          {cat === 'symptom' && !entry?.weight && (
            <>
              <View>
                <FieldLabel>How strong?</FieldLabel>
                <ChipGroup single options={SEVERITIES} value={d.severity} onToggle={(severity) => set({ severity })} />
              </View>
              <ChipGroup options={[{ key: 'discuss', title: 'Discuss with my clinician' }]} value={d.discuss ? ['discuss'] : []} onToggle={() => set({ discuss: !d.discuss })} />
            </>
          )}

          {cat === 'food' && (
            <>
              <View>
                <FieldLabel>Meal</FieldLabel>
                <ChipGroup single options={MEALS} value={d.meal} onToggle={(meal) => set({ meal })} />
              </View>
              <TextField label="Portion" optional value={d.portion} onChangeText={(portion) => set({ portion })} />
            </>
          )}

          <TextField label="Notes" optional multiline value={d.notes} onChangeText={(notes) => set({ notes })} />
        </>
      )}
    </Sheet>
  );
}

const PLACEHOLDERS = {
  appointment: 'e.g. Routine prenatal visit',
  test: 'e.g. Glucose screening',
  medication: 'e.g. Folic acid',
  symptom: 'e.g. Heartburn after dinner',
  food: 'e.g. Spinach dal & rice',
  journal: 'e.g. Felt the first flutter',
  milestone: 'e.g. Baby shower',
  task: 'e.g. Book the anatomy scan',
};

const styles = StyleSheet.create({
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { width: '48%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, borderRadius: 16, backgroundColor: Colors.surfaceContainerLow },
  catChipOn: { backgroundColor: Colors.primaryFixed },
  catIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  catBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: Colors.primaryFixed },
});
