import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Fonts, Radius } from '../../constants/theme';
import { Icon, T } from '../../components/ui';
import { ChipGroup, FieldLabel, PrimaryButton, SecondaryButton } from '../../components/forms';
import Sheet from '../../components/Sheet';
import { categoryIconColor } from './categoryStyle';
import { useJournal, summaryFor } from '../../stores/journalStore';
import { isScheduleEntry } from '../../services/clinicalSchedule';
import { formatDayKey } from '../../services/dayKey';
import { CATEGORY, APPOINTMENT_STATUSES, REPORT_STATUSES, DOSE_STATUSES, formatMinutes, doseStatusTitle, moodById } from '../../models/journal';

// Read view of one entry with the quick actions that matter for its category.
export default function EntryDetailSheet({ entryId, onClose, onEdit }) {
  const journal = useJournal();
  const entry = entryId ? journal.entriesById[entryId] : null;
  const [confirmDelete, setConfirmDelete] = useState(false);

  const close = () => {
    setConfirmDelete(false);
    onClose();
  };

  if (!entry) return <Sheet visible={false} onClose={close} />;

  const cat = CATEGORY[entry.category];
  const schedule = entry.medicationId ? journal.schedulesById[entry.medicationId] : null;
  const doseToday = (journal.doseLogsByDay[entry.dayKey] || []).find((l) => l.medicationId === entry.medicationId);
  const history = schedule ? journal.state.doseLogs.filter((l) => l.medicationId === schedule.id).sort((a, b) => b.actualLoggedAt - a.actualLoggedAt).slice(0, 5) : [];
  const mood = moodById(entry.journal?.mood);
  const update = (patch) => journal.upsertEntry({ ...entry, ...patch });

  return (
    <Sheet
      visible
      title={cat?.label || 'Entry'}
      onClose={close}
      footer={
        confirmDelete ? (
          <>
            <T v="bodySm" color={Colors.onSurfaceVariant} style={{ textAlign: 'center' }}>Delete this entry? This can’t be undone.</T>
            <PrimaryButton
              label="Yes, delete"
              icon="delete-outline"
              style={{ backgroundColor: Colors.error, shadowColor: Colors.error }}
              onPress={() => {
                journal.deleteEntry(entry.id);
                close();
              }}
            />
            <SecondaryButton label="Keep it" onPress={() => setConfirmDelete(false)} />
          </>
        ) : (
          <View style={styles.row8}>
            <SecondaryButton label="Delete" icon="delete-outline" onPress={() => setConfirmDelete(true)} style={{ flex: 1 }} />
            <PrimaryButton label="Edit" icon="edit" onPress={() => onEdit(entry)} style={{ flex: 1 }} />
          </View>
        )
      }
    >
      <View style={styles.head}>
        <View style={styles.iconWrap}><Icon name={cat?.icon || 'event-note'} size={22} color={categoryIconColor(entry.category)} /></View>
        <View style={{ flex: 1 }}>
          <T v="headlineSm">{entry.title}</T>
          <T v="bodySm" color={Colors.onSurfaceVariant}>
            {formatDayKey(entry.dayKey)}{entry.timeMinutes != null ? ` • ${formatMinutes(entry.timeMinutes)}` : ''}
          </T>
          {isScheduleEntry(entry) && <T v="labelSm" color={Colors.secondary} style={{ marginTop: 2, fontFamily: Fonts.semibold }}>From your clinical care plan</T>}
        </View>
      </View>

      {entry.category === 'appointment' && (
        <View>
          <FieldLabel>Status</FieldLabel>
          <ChipGroup single options={APPOINTMENT_STATUSES} value={entry.appointment?.status} onToggle={(status) => update({ appointment: { ...entry.appointment, status } })} />
          {entry.appointment?.clinicianOrClinic ? <Detail icon="person" text={entry.appointment.clinicianOrClinic} /> : null}
          {entry.appointment?.location ? <Detail icon="place" text={entry.appointment.location} /> : null}
        </View>
      )}

      {entry.category === 'test' && (
        <View>
          <FieldLabel>Report status</FieldLabel>
          <ChipGroup single options={REPORT_STATUSES} value={entry.medicalRecord?.reportStatus} onToggle={(reportStatus) => update({ medicalRecord: { ...entry.medicalRecord, reportStatus } })} />
        </View>
      )}

      {entry.category === 'medication' && schedule && (
        <View style={{ gap: 8 }}>
          <T v="bodyMd">{summaryFor(journal, entry)}</T>
          <FieldLabel>Dose on {formatDayKey(entry.dayKey, { short: true })}</FieldLabel>
          <View style={styles.row8}>
            {DOSE_STATUSES.map((s) => {
              const on = doseToday?.status === s.key;
              return (
                <TouchableOpacity key={s.key} onPress={() => journal.logDose(entry, s.key)} style={[styles.doseBtn, on && styles.doseBtnOn]} accessibilityRole="radio" accessibilityState={{ selected: on }}>
                  <T v="labelMd" color={on ? Colors.onPrimary : Colors.onSurface} style={{ textAlign: 'center' }}>{s.title}</T>
                </TouchableOpacity>
              );
            })}
          </View>
          {history.length > 0 && (
            <View style={{ gap: 4 }}>
              <FieldLabel>Recent doses</FieldLabel>
              {history.map((l) => (
                <View key={l.id} style={styles.rowBetween}>
                  <T v="bodySm" color={Colors.onSurfaceVariant}>{formatDayKey(l.dayKey, { short: true })}</T>
                  <T v="labelMd">{doseStatusTitle(l.status)}</T>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {entry.category === 'task' && (
        <TouchableOpacity onPress={() => update({ task: { completed: !entry.task?.completed } })} style={styles.taskToggle} accessibilityRole="checkbox" accessibilityState={{ checked: !!entry.task?.completed }}>
          <Icon name={entry.task?.completed ? 'check-circle' : 'radio-button-unchecked'} size={22} color={entry.task?.completed ? Colors.secondary : Colors.outline} />
          <T v="labelLg">{entry.task?.completed ? 'Done' : 'Mark as done'}</T>
        </TouchableOpacity>
      )}

      {entry.category === 'symptom' && entry.symptom && (
        <Detail icon="speed" text={`Severity: ${entry.symptom.severity}${entry.symptom.discussWithClinician ? ' • discuss with clinician' : ''}`} />
      )}
      {entry.weight && <Detail icon="monitor-weight" text={`${entry.weight.weightKg.toFixed(1)} kg`} />}
      {mood && <Detail icon="mood" text={`${mood.emoji} ${mood.name}`} />}

      {entry.notes ? (
        <View style={styles.notes}>
          <T v="bodySm" color={Colors.onSurface}>{entry.notes}</T>
        </View>
      ) : null}
      {/* Care-plan notes already list the questions. */}
      {entry.appointment?.questions && !isScheduleEntry(entry) ? (
        <View style={styles.notes}>
          <FieldLabel>Questions to ask</FieldLabel>
          <T v="bodySm">{entry.appointment.questions}</T>
        </View>
      ) : null}
    </Sheet>
  );
}

function Detail({ icon, text }) {
  return (
    <View style={[styles.row8, { marginTop: 8 }]}>
      <Icon name={icon} size={16} color={Colors.onSurfaceVariant} />
      <T v="bodySm" color={Colors.onSurfaceVariant} style={{ flex: 1 }}>{text}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  row8: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  doseBtn: { flex: 1, minHeight: 44, paddingHorizontal: 6, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceContainerLow },
  doseBtnOn: { backgroundColor: Colors.primary },
  taskToggle: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16, backgroundColor: Colors.surfaceContainerLow },
  notes: { padding: 12, borderRadius: 16, backgroundColor: Colors.surfaceContainerLow },
});
