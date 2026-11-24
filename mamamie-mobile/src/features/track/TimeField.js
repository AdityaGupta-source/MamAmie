import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Fonts, Radius } from '../../constants/theme';
import { Icon, T } from '../../components/ui';
import { FieldLabel, PrimaryButton, SecondaryButton } from '../../components/forms';
import Sheet from '../../components/Sheet';
import { formatMinutes } from '../../models/journal';

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = [0, 15, 30, 45];

// Optional time of day, stored as minutes after midnight (null = no time).
export default function TimeField({ label = 'Time', value, onChange }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value ?? 540);

  const h24 = Math.floor(draft / 60);
  const pm = h24 >= 12;
  const h12 = h24 % 12;
  const min = draft % 60;
  const set = (hour12, minute, isPm) => setDraft(((hour12 % 12) + (isPm ? 12 : 0)) * 60 + minute);

  return (
    <View>
      <FieldLabel optional>{label}</FieldLabel>
      <TouchableOpacity
        style={styles.input}
        onPress={() => {
          setDraft(value ?? 540);
          setOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={value != null ? `Time ${formatMinutes(value)}` : 'Add a time'}
      >
        <Icon name="schedule" size={18} color={Colors.primary} />
        <T v={value != null ? 'headlineSm' : 'bodyMd'} color={value != null ? Colors.onSurface : 'rgba(83,67,68,0.6)'} style={{ flex: 1 }}>
          {value != null ? formatMinutes(value) : 'Any time'}
        </T>
        {value != null ? (
          <TouchableOpacity onPress={() => onChange(null)} accessibilityLabel="Clear time" hitSlop={8}>
            <Icon name="close" size={18} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>
        ) : (
          <Icon name="expand-more" size={20} color={Colors.onSurfaceVariant} />
        )}
      </TouchableOpacity>

      <Sheet
        visible={open}
        title="Pick a time"
        onClose={() => setOpen(false)}
        footer={
          <>
            <PrimaryButton label={`Set ${formatMinutes(draft)}`} onPress={() => { onChange(draft); setOpen(false); }} />
            <SecondaryButton label="No specific time" onPress={() => { onChange(null); setOpen(false); }} />
          </>
        }
      >
        <FieldLabel>Hour</FieldLabel>
        <View style={styles.grid}>
          {HOURS.map((h) => (
            <Chip key={h} label={String(h)} on={h % 12 === h12} onPress={() => set(h, min, pm)} />
          ))}
        </View>
        <FieldLabel>Minute</FieldLabel>
        <View style={styles.grid}>
          {MINUTES.map((mm) => (
            <Chip key={mm} label={`:${String(mm).padStart(2, '0')}`} on={mm === min} onPress={() => set(h12, mm, pm)} />
          ))}
        </View>
        <View style={styles.grid}>
          <Chip label="AM" on={!pm} onPress={() => set(h12, min, false)} />
          <Chip label="PM" on={pm} onPress={() => set(h12, min, true)} />
        </View>
      </Sheet>
    </View>
  );
}

function Chip({ label, on, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.chip, on && styles.chipOn]} accessibilityRole="radio" accessibilityState={{ selected: on }}>
      <T v="labelLg" color={on ? Colors.onPrimary : Colors.onSurface} style={on && { fontFamily: Fonts.bold }}>{label}</T>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  input: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 16, borderRadius: 16, backgroundColor: Colors.surfaceContainerLow },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minWidth: 52, height: 44, paddingHorizontal: 12, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceContainerLow },
  chipOn: { backgroundColor: Colors.primary },
});
