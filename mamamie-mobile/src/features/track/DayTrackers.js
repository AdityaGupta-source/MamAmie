// Per-day trackers under the calendar: mood, daily checkpoints and weight.
// Ported from iOS DayMoodTrackerView, DayCheckpointsView and DayWeightTrackerView.
import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Colors, Fonts, Radius, Shadow } from '../../constants/theme';
import { Icon, T } from '../../components/ui';
import { FieldLabel, PrimaryButton, SecondaryButton, TextField } from '../../components/forms';
import Sheet from '../../components/Sheet';
import { useJournal, useDayCheckpoints, weightHistory } from '../../stores/journalStore';
import { MOODS, CHECKPOINTS, moodById } from '../../models/journal';
import { formatDayKey } from '../../services/dayKey';

const LBS = 2.20462;

export function MoodCard({ dayKey }) {
  const journal = useJournal();
  const entry = (journal.entriesByDay[dayKey] || []).find((e) => e.category === 'journal');
  const active = moodById(entry?.journal?.mood);
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(entry?.notes || '');

  useEffect(() => {
    setNote(entry?.notes || '');
    setEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKey]);

  return (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <View style={styles.row6}>
          <Icon name="favorite" size={20} color={Colors.primary} />
          <T v="headlineSm">How are you feeling?</T>
        </View>
        <TouchableOpacity onPress={() => setEditing(!editing)} hitSlop={6}>
          <T v="labelMd" color={Colors.primary}>{editing ? 'Close' : entry?.notes ? 'Edit note' : 'Add note'}</T>
        </TouchableOpacity>
      </View>
      <View style={styles.moodWrap}>
        {MOODS.map((m) => {
          const on = active?.id === m.id;
          return (
            <TouchableOpacity key={m.id} onPress={() => journal.setMood(dayKey, m)} style={[styles.moodChip, on && styles.moodChipOn]} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={m.name}>
              <T v="bodyMd">{m.emoji}</T>
              <T v="labelMd" color={on ? Colors.onPrimaryFixed : Colors.onSurface} style={{ fontFamily: on ? Fonts.bold : Fonts.medium }}>{m.name}</T>
            </TouchableOpacity>
          );
        })}
      </View>
      {active && (
        <View style={styles.affirm}>
          <T v="bodySm" color={Colors.onSurfaceVariant}>{active.affirmation}</T>
        </View>
      )}
      {!editing && entry?.notes ? <T v="bodySm" style={{ marginTop: 8 }}>{entry.notes}</T> : null}
      {editing && (
        <View style={{ marginTop: 12, gap: 8 }}>
          <TextField multiline value={note} onChangeText={setNote} placeholder="A gentle reflection for this day…" />
          <TouchableOpacity
            style={[styles.smallBtn, { alignSelf: 'flex-end' }]}
            onPress={() => {
              journal.saveDayNote(dayKey, note.trim());
              setEditing(false);
            }}
          >
            <T v="labelMd" color={Colors.onPrimary}>Save note</T>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export function CheckpointsCard({ dayKey, week }) {
  const journal = useJournal();
  const { habits, checks, done, enabled, toggle } = useDayCheckpoints(dayKey, week);
  const [adding, setAdding] = useState(false);

  return (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <View style={[styles.row6, { flex: 1 }]}>
          <Icon name="checklist" size={20} color={Colors.primary} />
          <T v="headlineSm">Daily checkpoints</T>
        </View>
        {enabled && habits.length > 0 && (
          <View style={[styles.countPill, done === habits.length && { backgroundColor: Colors.secondaryContainer }]}>
            <T v="labelSm" color={done === habits.length ? Colors.onSecondaryContainer : Colors.primary} style={{ fontFamily: Fonts.bold }}>{done}/{habits.length} done</T>
          </View>
        )}
        <TouchableOpacity onPress={() => journal.setHabitsEnabled(!enabled)} hitSlop={6}>
          <T v="labelMd" color={Colors.onSurfaceVariant}>{enabled ? 'Hide' : 'Turn on'}</T>
        </TouchableOpacity>
      </View>

      {!enabled ? (
        <T v="bodySm" color={Colors.onSurfaceVariant} style={{ marginTop: 8 }}>Daily checkpoints are hidden. Turn them on any time to track your habits.</T>
      ) : (
        <>
          <View style={{ marginTop: 12, gap: 8 }}>
            {habits.map((h) => {
              const on = !!checks[h.id];
              return (
                <View key={h.id} style={styles.habitRow}>
                  <TouchableOpacity onPress={() => toggle(h.id)} style={[styles.check, on && styles.checkOn]} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={h.title}>
                    {on && <Icon name="check" size={18} color={Colors.onSecondaryContainer} />}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => toggle(h.id)} style={{ flex: 1 }} activeOpacity={0.8}>
                    <T v="labelLg" color={on ? Colors.onSurfaceVariant : Colors.onSurface} style={on && styles.struck}>{h.title}</T>
                    {h.subtitle ? <T v="bodySm" color={Colors.onSurfaceVariant} numberOfLines={1}>{h.subtitle}</T> : null}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => journal.removeHabit(h.id)} hitSlop={8} accessibilityLabel={`Remove ${h.title}`}>
                    <Icon name="close" size={16} color={Colors.outline} />
                  </TouchableOpacity>
                </View>
              );
            })}
            {habits.length === 0 && <T v="bodySm" color={Colors.onSurfaceVariant}>No checkpoints yet. Add a few gentle daily habits.</T>}
          </View>
          <TouchableOpacity style={styles.addRow} onPress={() => setAdding(true)}>
            <Icon name="add-circle" size={18} color={Colors.primary} />
            <T v="labelMd" color={Colors.primary}>Add activity</T>
          </TouchableOpacity>
        </>
      )}
      <AddHabitSheet visible={adding} onClose={() => setAdding(false)} />
    </View>
  );
}

function AddHabitSheet({ visible, onClose }) {
  const journal = useJournal();
  const [custom, setCustom] = useState('');
  const active = new Set(journal.state.habits.map((h) => h.id));
  const available = CHECKPOINTS.filter((c) => !active.has(c.id));

  return (
    <Sheet visible={visible} title="Add a daily activity" onClose={onClose}>
      {available.length > 0 && <FieldLabel>Recommended</FieldLabel>}
      {available.map((c) => (
        <TouchableOpacity key={c.id} style={styles.recRow} onPress={() => journal.addHabit(c)}>
          <Icon name={c.icon} size={20} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <T v="labelLg">{c.title}</T>
            <T v="bodySm" color={Colors.onSurfaceVariant}>{c.minWeek ? `${c.subtitle} (from week ${c.minWeek})` : c.subtitle}</T>
          </View>
          <Icon name="add" size={20} color={Colors.primary} />
        </TouchableOpacity>
      ))}
      <TextField label="Your own activity" value={custom} onChangeText={setCustom} placeholder="e.g. Coconut water, 15 min swim, meditation" />
      <PrimaryButton
        label="Add my activity"
        icon="add"
        disabled={!custom.trim()}
        onPress={() => {
          journal.addHabit({ title: custom.trim() });
          setCustom('');
          onClose();
        }}
      />
    </Sheet>
  );
}

const fmtWeight = (kg, unit) => (unit === 'lbs' ? `${(kg * LBS).toFixed(1)} lbs` : `${kg.toFixed(1)} kg`);

export function DayWeightCard({ dayKey }) {
  const journal = useJournal();
  const unit = journal.state.weightUnit;
  const entry = (journal.entriesByDay[dayKey] || []).find((e) => e.weight);
  const history = weightHistory(journal);
  const first = history[0];
  const [open, setOpen] = useState(false);
  const change = entry && first && first.dayKey < dayKey ? entry.weight.weightKg - first.kg : null;

  return (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <View style={styles.row6}>
          <Icon name="monitor-weight" size={20} color={Colors.primary} />
          <T v="headlineSm">Weight</T>
        </View>
        <TouchableOpacity style={styles.smallBtn} onPress={() => setOpen(true)}>
          <Icon name={entry ? 'edit' : 'add'} size={16} color={Colors.onPrimary} />
          <T v="labelMd" color={Colors.onPrimary}>{entry ? fmtWeight(entry.weight.weightKg, unit) : 'Log weight'}</T>
        </TouchableOpacity>
      </View>
      {entry ? (
        <View style={[styles.row8, { marginTop: 12 }]}>
          <Stat label="This day" value={fmtWeight(entry.weight.weightKg, unit)} />
          {change != null && <Stat label={`Since ${formatDayKey(first.dayKey, { short: true })}`} value={`${change >= 0 ? '+' : '−'}${fmtWeight(Math.abs(change), unit)}`} />}
        </View>
      ) : (
        <T v="bodySm" color={Colors.onSurfaceVariant} style={{ marginTop: 8 }}>Log your weight now and then to follow a steady, healthy gain.</T>
      )}
      <WeightSheet visible={open} dayKey={dayKey} current={entry?.weight?.weightKg ?? history[history.length - 1]?.kg} onClose={() => setOpen(false)} />
    </View>
  );
}

export function WeightSheet({ visible, dayKey, current, onClose }) {
  const journal = useJournal();
  const unit = journal.state.weightUnit;
  const [text, setText] = useState('');

  useEffect(() => {
    if (visible) setText(current != null ? (unit === 'lbs' ? current * LBS : current).toFixed(1) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, unit]);

  const value = parseFloat(text.replace(',', '.'));
  const valid = Number.isFinite(value) && value >= (unit === 'lbs' ? 66 : 30) && value <= (unit === 'lbs' ? 660 : 300);
  const step = (d) => setText(String(Math.max(0, (Number.isFinite(value) ? value : 0) + d).toFixed(1)));

  return (
    <Sheet
      visible={visible}
      title="Log your weight"
      onClose={onClose}
      footer={
        <PrimaryButton
          label="Save"
          icon="check"
          disabled={!valid}
          onPress={() => {
            journal.logWeight(dayKey, unit === 'lbs' ? value / LBS : value, unit);
            onClose();
          }}
        />
      }
    >
      <View style={styles.unitRow}>
        {['kg', 'lbs'].map((u) => (
          <TouchableOpacity key={u} onPress={() => journal.setWeightUnit(u)} style={[styles.unitBtn, unit === u && styles.unitBtnOn]} accessibilityRole="radio" accessibilityState={{ selected: unit === u }}>
            <T v="labelLg" color={unit === u ? Colors.onPrimary : Colors.onSurface}>{u === 'kg' ? 'Kilograms' : 'Pounds'}</T>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.weightRow}>
        <SecondaryButton label="− 0.5" onPress={() => step(-0.5)} style={{ minWidth: 72 }} />
        <View style={styles.weightInput}>
          <TextInput value={text} onChangeText={setText} keyboardType="decimal-pad" placeholder="0.0" placeholderTextColor={Colors.outline} style={styles.weightText} accessibilityLabel={`Weight in ${unit}`} />
          <T v="labelLg" color={Colors.onSurfaceVariant}>{unit}</T>
        </View>
        <SecondaryButton label="+ 0.5" onPress={() => step(0.5)} style={{ minWidth: 72 }} />
      </View>
    </Sheet>
  );
}

function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <T v="labelSm" color={Colors.onSurfaceVariant}>{label}</T>
      <T v="headlineSm" style={{ marginTop: 2 }}>{value}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: 16, padding: 16, ...Shadow.sm },
  row6: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  row8: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  moodWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  moodChip: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, paddingHorizontal: 12, borderRadius: Radius.full, backgroundColor: Colors.surfaceContainerLow },
  moodChipOn: { backgroundColor: Colors.primaryFixed, borderWidth: 1.5, borderColor: Colors.primaryFixedDim },
  affirm: { marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: Colors.surfaceContainerLow },
  smallBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 36, paddingHorizontal: 14, borderRadius: Radius.full, backgroundColor: Colors.primary },
  countPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, backgroundColor: Colors.primaryFixed },
  habitRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 12, backgroundColor: Colors.surfaceContainerLow },
  check: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surfaceContainerLowest, borderWidth: 1.5, borderColor: Colors.outlineVariant, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: Colors.secondaryContainer, borderColor: Colors.secondaryContainer },
  struck: { textDecorationLine: 'line-through' },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 12, paddingVertical: 6, paddingHorizontal: 12, borderRadius: Radius.full, backgroundColor: Colors.primaryFixed },
  recRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, backgroundColor: Colors.surfaceContainerLow },
  unitRow: { flexDirection: 'row', gap: 8 },
  unitBtn: { flex: 1, minHeight: 44, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceContainerLow },
  unitBtnOn: { backgroundColor: Colors.primary },
  weightRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  weightInput: { flex: 1, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 6, minHeight: 64, borderRadius: 16, backgroundColor: Colors.surfaceContainerLow, paddingHorizontal: 12 },
  weightText: { fontFamily: Fonts.bold, fontSize: 32, color: Colors.onSurface, width: 110, textAlign: 'center', padding: 0, outlineStyle: 'none' },
  stat: { flex: 1, padding: 10, borderRadius: 12, backgroundColor: Colors.surfaceContainerLow },
});
