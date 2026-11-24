// The centre (+) button's action sheet: one tap to log water, food, kicks, contractions,
// symptoms, medication doses, journal notes or weight. Everything writes to the shared
// stores, so Home and Track update straight away.
import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Fonts, Radius } from '../../constants/theme';
import { Icon, T, Pill } from '../../components/ui';
import { PrimaryButton } from '../../components/forms';
import Sheet from '../../components/Sheet';
import { useHydration } from '../../stores/hydrationStore';
import { useJournal, weightHistory } from '../../stores/journalStore';
import { useSessions } from '../../stores/sessionsStore';
import { toDayKey } from '../../services/dayKey';
import { DOSE_STATUSES } from '../../models/journal';
import EntryEditorSheet from '../track/EntryEditorSheet';
import { WeightSheet } from '../track/DayTrackers';
import { KickCounterCard, ContractionTimerCard } from '../sessions/SessionCards';

const ACTIONS = [
  { key: 'water', title: 'Water', sub: 'Hydration log', icon: 'water-drop', bg: Colors.surfaceContainer, fg: Colors.primary },
  { key: 'food', title: 'Food', sub: 'Meal note', icon: 'restaurant', bg: '#fbe6d3', fg: '#a8642a' },
  { key: 'kicks', title: 'Kick session', sub: 'Count to 10', icon: 'child-care', bg: Colors.tertiaryFixed, fg: Colors.tertiary },
  { key: 'contraction', title: 'Contraction', sub: 'Time a wave', icon: 'timer', bg: Colors.primaryFixed, fg: Colors.primary },
  { key: 'symptom', title: 'Symptom', sub: 'How you feel', icon: 'healing', bg: Colors.primaryFixed, fg: Colors.primaryContainer },
  { key: 'dose', title: 'Medication dose', sub: 'Taken or skipped', icon: 'medication', bg: Colors.secondaryContainer, fg: Colors.onSecondaryContainer },
  { key: 'journal', title: 'Journal note', sub: 'A moment to keep', icon: 'menu-book', bg: Colors.surfaceContainerHigh, fg: '#5a6f93' },
  { key: 'weight', title: 'Weight', sub: 'Today’s reading', icon: 'monitor-weight', bg: Colors.secondaryFixed, fg: Colors.secondary },
];

const EDITOR_PRESETS = {
  food: { category: 'food' },
  symptom: { category: 'symptom' },
  journal: { category: 'journal' },
  medication: { category: 'medication' },
};

export default function QuickActionsSheet({ visible, onClose, onOpenHydration }) {
  const [open, setOpen] = useState(null); // which follow-up sheet is showing
  const { log: logWater } = useHydration();
  const journal = useJournal();
  const sessions = useSessions();
  const todayKey = toDayKey();
  const [toast, setToast] = useState(null);

  const pick = (key) => {
    onClose();
    if (key === 'water') onOpenHydration();
    else setOpen(key);
  };
  const quickWater = (ml) => {
    logWater(ml, ml === 250 ? 'Standard Mug' : 'Sports Tumbler');
    setToast(`Logged ${ml} mL of water`);
    setTimeout(() => setToast(null), 1800);
  };

  const lastWeight = weightHistory(journal).slice(-1)[0]?.kg;
  const kickLive = sessions.kickActive ? `${sessions.kickActive.count}/10` : null;

  return (
    <>
      <Sheet visible={visible} title="Quick log" onClose={onClose}>
        <View style={styles.waterRow}>
          <Icon name="water-drop" size={18} color={Colors.primary} />
          <T v="labelLg" style={{ flex: 1 }}>Quick water</T>
          {[250, 500].map((ml) => (
            <TouchableOpacity key={ml} style={styles.waterBtn} onPress={() => quickWater(ml)} accessibilityLabel={`Log ${ml} millilitres of water`}>
              <T v="labelMd" color={Colors.onPrimary}>+{ml} mL</T>
            </TouchableOpacity>
          ))}
        </View>
        {toast && <Pill label={toast} icon="check" bg={Colors.secondaryContainer} color={Colors.onSecondaryContainer} />}

        <View style={styles.grid}>
          {ACTIONS.map((a) => (
            <TouchableOpacity key={a.key} style={styles.tile} onPress={() => pick(a.key)} activeOpacity={0.85} accessibilityLabel={a.title}>
              <View style={[styles.tileIcon, { backgroundColor: a.bg }]}>
                <Icon name={a.icon} size={22} color={a.fg} />
              </View>
              <View style={{ flex: 1 }}>
                <T v="labelLg">{a.title}</T>
                <T v="bodySm" color={a.key === 'kicks' && kickLive ? Colors.secondary : Colors.onSurfaceVariant} style={a.key === 'kicks' && kickLive && { fontFamily: Fonts.semibold }}>
                  {a.key === 'kicks' && kickLive ? `In progress • ${kickLive}` : a.key === 'contraction' && sessions.contractionStart ? 'Timing now…' : a.sub}
                </T>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Sheet>

      <Sheet visible={open === 'kicks'} title="Kick session" onClose={() => setOpen(null)}>
        <KickCounterCard flat />
      </Sheet>
      <Sheet visible={open === 'contraction'} title="Contractions" onClose={() => setOpen(null)}>
        <ContractionTimerCard flat />
      </Sheet>
      <MedicationDoseSheet visible={open === 'dose'} onClose={() => setOpen(null)} onAddMedication={() => setOpen('medication')} />
      <WeightSheet visible={open === 'weight'} dayKey={todayKey} current={lastWeight} onClose={() => setOpen(null)} />
      <EntryEditorSheet visible={!!EDITOR_PRESETS[open]} entry={null} preset={EDITOR_PRESETS[open]} dayKey={todayKey} onClose={() => setOpen(null)} />
    </>
  );
}

// Today's dose for every medication the user has added.
function MedicationDoseSheet({ visible, onClose, onAddMedication }) {
  const journal = useJournal();
  const todayKey = toDayKey();
  const todayLogs = journal.doseLogsByDay[todayKey] || [];
  const meds = journal.state.medicationSchedules
    .map((m) => ({ schedule: m, entry: journal.entriesById[m.sourceEntryId] }))
    .filter((m) => m.entry);

  return (
    <Sheet visible={visible} title="Medication dose" onClose={onClose}>
      {meds.length === 0 ? (
        <View style={{ gap: 12 }}>
          <T v="bodyMd" color={Colors.onSurfaceVariant}>No medications or supplements yet. Add one as your clinician prescribed it, then log each dose here.</T>
          <PrimaryButton label="Add a medication" icon="add" onPress={onAddMedication} />
        </View>
      ) : (
        meds.map(({ schedule, entry }) => {
          const status = todayLogs.find((l) => l.medicationId === schedule.id)?.status;
          return (
            <View key={schedule.id} style={styles.medCard}>
              <T v="labelLg">{schedule.name}</T>
              {schedule.dose || schedule.instructions ? (
                <T v="bodySm" color={Colors.onSurfaceVariant}>{[schedule.dose, schedule.instructions].filter(Boolean).join(' · ')}</T>
              ) : null}
              <View style={styles.doseRow}>
                {DOSE_STATUSES.map((d) => {
                  const on = status === d.key;
                  return (
                    <TouchableOpacity key={d.key} style={[styles.doseBtn, on && styles.doseBtnOn]} onPress={() => journal.logDose(entry, d.key, todayKey)} accessibilityRole="radio" accessibilityState={{ selected: on }}>
                      <T v="labelMd" color={on ? Colors.onPrimary : Colors.onSurface} style={{ textAlign: 'center' }}>{d.title}</T>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  waterRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 16, backgroundColor: Colors.surfaceContainerLow },
  waterBtn: { minHeight: 36, paddingHorizontal: 12, borderRadius: Radius.full, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { width: '48%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16, backgroundColor: Colors.surfaceContainerLow },
  tileIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  medCard: { gap: 4, padding: 12, borderRadius: 16, backgroundColor: Colors.surfaceContainerLow },
  doseRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  doseBtn: { flex: 1, minHeight: 40, paddingHorizontal: 4, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceContainerLowest },
  doseBtnOn: { backgroundColor: Colors.primary },
});
