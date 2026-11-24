import React, { useMemo, useState } from 'react';
import { View, TouchableOpacity, TextInput, StyleSheet, Modal, Pressable } from 'react-native';
import { Colors, Fonts, Radius, Shadow } from '../constants/theme';
import { Icon, T } from './ui';
import { toDayKey, fromDayKey, formatDayKey, MONTHS } from '../services/dayKey';

const TONES = {
  primary: { bg: Colors.primaryFixed, fg: Colors.primary },
  secondary: { bg: Colors.secondaryContainer, fg: Colors.onSecondaryContainer },
  tertiary: { bg: Colors.tertiaryFixed, fg: Colors.tertiary },
};

// Large selectable card: icon in tinted circle, title, subtitle, check when selected.
export function ChoiceCard({ title, subtitle, icon, tone = 'primary', selected, onPress }) {
  const t = TONES[tone] || TONES.primary;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.choice, selected && styles.choiceSelected]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      {icon ? (
        <View style={[styles.choiceIcon, { backgroundColor: selected ? Colors.primary : t.bg }]}>
          <Icon name={icon} size={22} color={selected ? Colors.onPrimary : t.fg} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <T v="labelLg" color={selected ? Colors.onPrimaryFixed : Colors.onSurface}>{title}</T>
        {subtitle ? <T v="bodySm" color={Colors.onSurfaceVariant} style={{ marginTop: 2 }}>{subtitle}</T> : null}
      </View>
      <View style={[styles.radio, selected && styles.radioOn]}>
        {selected && <Icon name="check" size={14} color={Colors.onPrimary} />}
      </View>
    </TouchableOpacity>
  );
}

// Compact radio row (inside a card).
export function RadioRow({ title, subtitle, selected, onPress, tag }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.radioRow, selected && { backgroundColor: Colors.primaryFixed }]} accessibilityRole="radio" accessibilityState={{ selected }}>
      <View style={[styles.radioDot, selected && styles.radioDotOn]}>{selected && <View style={styles.radioDotInner} />}</View>
      <View style={{ flex: 1 }}>
        <T v="labelLg" color={selected ? Colors.onPrimaryFixed : Colors.onSurface}>{title}</T>
        {subtitle ? <T v="bodySm" color={Colors.onSurfaceVariant}>{subtitle}</T> : null}
      </View>
      {tag ? (
        <View style={styles.tag}><T v="labelSm" color={Colors.primary} style={{ fontFamily: Fonts.semibold }}>{tag}</T></View>
      ) : null}
    </TouchableOpacity>
  );
}

// Multi- or single-select pill chips.
export function ChipGroup({ options, value, onToggle, single = false }) {
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const key = typeof o === 'string' ? o : o.key;
        const label = typeof o === 'string' ? o : o.title;
        const on = single ? value === key : value.includes(key);
        return (
          <TouchableOpacity key={key} onPress={() => onToggle(key)} activeOpacity={0.85} style={[styles.chip, on && styles.chipOn]} accessibilityRole={single ? 'radio' : 'checkbox'} accessibilityState={{ checked: on }}>
            {on && <Icon name="check" size={14} color={Colors.onPrimaryFixed} />}
            <T v="labelMd" color={on ? Colors.onPrimaryFixed : Colors.onSurface} style={{ fontFamily: Fonts.medium }}>{label}</T>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function FieldLabel({ children, optional }) {
  return (
    <T v="labelSm" color={Colors.onSurfaceVariant} style={styles.fieldLabel}>
      {children}
      {optional ? <T v="labelSm" color={Colors.outline}>  · optional</T> : null}
    </T>
  );
}

export function TextField({ label, optional, value, onChangeText, placeholder, multiline, keyboardType, icon }) {
  return (
    <View>
      {label ? <FieldLabel optional={optional}>{label}</FieldLabel> : null}
      <View style={[styles.input, multiline && { minHeight: 88, alignItems: 'flex-start' }]}>
        {icon ? <Icon name={icon} size={18} color={Colors.primary} style={{ marginTop: multiline ? 2 : 0 }} /> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(83,67,68,0.6)"
          multiline={multiline}
          keyboardType={keyboardType}
          style={[styles.inputText, multiline && { textAlignVertical: 'top', minHeight: 64 }]}
        />
      </View>
    </View>
  );
}

// Small −/+ counter for counts (pregnancies, births).
export function CountStepper({ label, value, onChange, min = 0, max = 20 }) {
  const v = value ?? 0;
  return (
    <View style={styles.counterRow}>
      <T v="labelLg" style={{ flex: 1 }}>{label}</T>
      <View style={styles.counter}>
        <TouchableOpacity style={styles.counterBtn} onPress={() => onChange(Math.max(min, v - 1))} accessibilityLabel={`Decrease ${label}`}>
          <Icon name="remove" size={18} />
        </TouchableOpacity>
        <T v="headlineSm" style={{ minWidth: 28, textAlign: 'center' }}>{value == null ? '–' : v}</T>
        <TouchableOpacity style={styles.counterBtn} onPress={() => onChange(Math.min(max, v + 1))} accessibilityLabel={`Increase ${label}`}>
          <Icon name="add" size={18} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Date field that opens a month-grid sheet. value/min/max are day keys.
export function DateField({ label, optional, value, onChange, minKey, maxKey, placeholder = 'Select a date', hint }) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      {label ? <FieldLabel optional={optional}>{label}</FieldLabel> : null}
      <TouchableOpacity style={styles.input} onPress={() => setOpen(true)} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel={label || 'Pick a date'}>
        <Icon name="event" size={18} color={Colors.primary} />
        <View style={{ flex: 1 }}>
          <T v={value ? 'headlineSm' : 'bodyMd'} color={value ? Colors.onSurface : 'rgba(83,67,68,0.6)'}>
            {value ? formatDayKey(value) : placeholder}
          </T>
          {value && hint ? <T v="bodySm" color={Colors.onSurfaceVariant}>{hint}</T> : null}
        </View>
        {value && optional ? (
          <TouchableOpacity onPress={() => onChange(null)} accessibilityLabel="Clear date" hitSlop={8}>
            <Icon name="close" size={18} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>
        ) : (
          <Icon name="expand-more" size={20} color={Colors.onSurfaceVariant} />
        )}
      </TouchableOpacity>
      <DatePickerSheet
        visible={open}
        title={label}
        value={value}
        minKey={minKey}
        maxKey={maxKey}
        onClose={() => setOpen(false)}
        onPick={(k) => {
          onChange(k);
          setOpen(false);
        }}
      />
    </View>
  );
}

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function DatePickerSheet({ visible, title, value, minKey, maxKey, onClose, onPick }) {
  const start = fromDayKey(value) || fromDayKey(maxKey && maxKey < toDayKey() ? maxKey : null) || new Date();
  const [cursor, setCursor] = useState({ y: start.getFullYear(), m: start.getMonth() });

  // Re-anchor each time the sheet opens.
  React.useEffect(() => {
    if (visible) {
      const s = fromDayKey(value) || (maxKey && maxKey < toDayKey() ? fromDayKey(maxKey) : new Date());
      setCursor({ y: s.getFullYear(), m: s.getMonth() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const cells = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const lead = (first.getDay() + 6) % 7; // Monday first
    const days = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const out = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= days; d++) out.push(toDayKey(new Date(cursor.y, cursor.m, d)));
    return out;
  }, [cursor]);

  const shift = (months) => {
    const d = new Date(cursor.y, cursor.m + months, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  };
  const today = toDayKey();
  const inRange = (k) => (!minKey || k >= minKey) && (!maxKey || k <= maxKey);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet}>
          <View style={styles.sheetHead}>
            <T v="headlineMd">{title || 'Pick a date'}</T>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close"><Icon name="close" size={22} color={Colors.onSurfaceVariant} /></TouchableOpacity>
          </View>

          <View style={styles.monthNav}>
            <TouchableOpacity style={styles.navBtn} onPress={() => shift(-12)} accessibilityLabel="Previous year"><Icon name="keyboard-double-arrow-left" size={20} color={Colors.primary} /></TouchableOpacity>
            <TouchableOpacity style={styles.navBtn} onPress={() => shift(-1)} accessibilityLabel="Previous month"><Icon name="chevron-left" size={22} color={Colors.primary} /></TouchableOpacity>
            <T v="headlineSm" style={{ flex: 1, textAlign: 'center' }}>{MONTHS[cursor.m]} {cursor.y}</T>
            <TouchableOpacity style={styles.navBtn} onPress={() => shift(1)} accessibilityLabel="Next month"><Icon name="chevron-right" size={22} color={Colors.primary} /></TouchableOpacity>
            <TouchableOpacity style={styles.navBtn} onPress={() => shift(12)} accessibilityLabel="Next year"><Icon name="keyboard-double-arrow-right" size={20} color={Colors.primary} /></TouchableOpacity>
          </View>

          <View style={styles.grid}>
            {DOW.map((d, i) => (
              <View key={`h${i}`} style={styles.cell}><T v="labelSm" color={Colors.onSurfaceVariant}>{d}</T></View>
            ))}
            {cells.map((k, i) => {
              if (!k) return <View key={`e${i}`} style={styles.cell} />;
              const sel = k === value;
              const ok = inRange(k);
              return (
                <View key={k} style={styles.cell}>
                  <TouchableOpacity
                    disabled={!ok}
                    onPress={() => onPick(k)}
                    style={[styles.day, sel && styles.daySel, !sel && k === today && styles.dayToday]}
                    accessibilityLabel={formatDayKey(k)}
                  >
                    <T v="labelMd" color={sel ? Colors.onPrimary : ok ? Colors.onSurface : Colors.outlineVariant} style={{ fontFamily: sel ? Fonts.bold : Fonts.medium }}>
                      {Number(k.slice(8))}
                    </T>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function PrimaryButton({ label, icon, onPress, disabled, style }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.85} style={[styles.primaryBtn, disabled && { opacity: 0.45 }, style]} accessibilityRole="button" accessibilityState={{ disabled }}>
      <T v="labelLg" color={Colors.onPrimary} style={{ fontSize: 15 }}>{label}</T>
      {icon ? <Icon name={icon} size={20} color={Colors.onPrimary} /> : null}
    </TouchableOpacity>
  );
}

export function SecondaryButton({ label, icon, onPress, style }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.secondaryBtn, style]} accessibilityRole="button">
      {icon ? <Icon name={icon} size={18} color={Colors.primary} /> : null}
      <T v="labelLg" color={Colors.primary}>{label}</T>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerLowest,
    ...Shadow.sm,
  },
  choiceSelected: { backgroundColor: Colors.primaryFixed },
  choiceIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  radio: { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  radioOn: { backgroundColor: Colors.primary },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, backgroundColor: Colors.surfaceContainerLow },
  radioDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: Colors.primaryFixed },
  radioDotOn: { backgroundColor: Colors.surfaceContainerLowest, borderWidth: 2, borderColor: Colors.primary },
  radioDotInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerLowest,
    ...Shadow.sm,
  },
  chipOn: { backgroundColor: Colors.primaryFixed },
  fieldLabel: { marginBottom: 6, fontFamily: Fonts.semibold, letterSpacing: 0.5 },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerLow,
  },
  inputText: { flex: 1, fontFamily: Fonts.regular, fontSize: 15, color: Colors.onSurface, padding: 0, outlineStyle: 'none' },
  counterRow: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingLeft: 16, borderRadius: 16, backgroundColor: Colors.surfaceContainerLow },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  counterBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceContainerLowest, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  overlay: { flex: 1, backgroundColor: 'rgba(15,29,41,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surfaceContainerLowest, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 32 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  monthNav: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8, padding: 4, borderRadius: Radius.full, backgroundColor: Colors.surfaceContainerLow },
  navBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, height: 44, alignItems: 'center', justifyContent: 'center' },
  day: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  daySel: { backgroundColor: Colors.primary, ...Shadow.primary },
  dayToday: { borderWidth: 1.5, borderColor: Colors.primaryFixedDim },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    paddingHorizontal: 24,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    ...Shadow.primary,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 52,
    paddingHorizontal: 20,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerHigh,
  },
});
