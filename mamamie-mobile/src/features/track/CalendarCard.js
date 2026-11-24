import React, { useEffect, useMemo, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Fonts, Radius, Shadow } from '../../constants/theme';
import { Icon, T, Pill } from '../../components/ui';
import { toDayKey, fromDayKey, addDays, formatDayKey, MONTHS } from '../../services/dayKey';
import { CATEGORIES } from '../../models/journal';
import { categoryColor } from './categoryStyle';

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const mondayOf = (key) => addDays(key, -((fromDayKey(key).getDay() + 6) % 7));

// Week strip or month grid with a dot per entry category on each day.
export default function CalendarCard({ selectedKey, onSelect, dayCategories, weekPill }) {
  const todayKey = toDayKey();
  const [view, setView] = useState('week');
  const [anchor, setAnchor] = useState(selectedKey);

  // Follow the selection when it jumps outside the visible range (e.g. from Upcoming).
  useEffect(() => setAnchor(selectedKey), [selectedKey]);

  const days = useMemo(() => {
    if (view === 'week') {
      const mon = mondayOf(anchor);
      return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
    }
    const a = fromDayKey(anchor);
    const first = toDayKey(new Date(a.getFullYear(), a.getMonth(), 1));
    const lead = (fromDayKey(first).getDay() + 6) % 7;
    const count = new Date(a.getFullYear(), a.getMonth() + 1, 0).getDate();
    const cells = Array.from({ length: lead }, () => null);
    for (let i = 0; i < count; i++) cells.push(addDays(first, i));
    while (cells.length % 7) cells.push(null);
    return cells;
  }, [view, anchor]);

  const shift = (dir) => {
    if (view === 'week') setAnchor(addDays(anchor, dir * 7));
    else {
      const a = fromDayKey(anchor);
      setAnchor(toDayKey(new Date(a.getFullYear(), a.getMonth() + dir, 1)));
    }
  };

  const a = fromDayKey(view === 'week' ? addDays(mondayOf(anchor), 3) : anchor);
  const heading = `${MONTHS[a.getMonth()]} ${a.getFullYear()}`;

  // Legend shows only categories that appear in the visible range.
  const legend = useMemo(() => {
    const seen = new Set();
    for (const k of days) if (k) for (const c of dayCategories[k] || []) seen.add(c);
    return CATEGORIES.filter((c) => seen.has(c.key));
  }, [days, dayCategories]);

  return (
    <View style={styles.card}>
      <View style={[styles.rowBetween, { marginBottom: 8, paddingHorizontal: 4 }]}>
        <View style={[styles.row6, { flex: 1 }]}>
          <T v="headlineSm">{heading}</T>
          {weekPill ? <Pill label={weekPill} bg={Colors.primaryFixed} color={Colors.primary} style={{ paddingVertical: 2, paddingHorizontal: 8 }} /> : null}
        </View>
        <View style={styles.row6}>
          <TouchableOpacity onPress={() => setView(view === 'week' ? 'month' : 'week')} style={styles.viewToggle} accessibilityLabel={view === 'week' ? 'Show month' : 'Show week'}>
            <Icon name={view === 'week' ? 'calendar-month' : 'view-week'} size={16} color={Colors.primary} />
            <T v="labelSm" color={Colors.primary} style={{ fontFamily: Fonts.semibold }}>{view === 'week' ? 'Month' : 'Week'}</T>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => shift(-1)} hitSlop={6} accessibilityLabel={view === 'week' ? 'Previous week' : 'Previous month'}>
            <Icon name="chevron-left" size={22} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => shift(1)} hitSlop={6} accessibilityLabel={view === 'week' ? 'Next week' : 'Next month'}>
            <Icon name="chevron-right" size={22} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
      </View>

      {view === 'month' && (
        <View style={styles.grid}>
          {DOW.map((d, i) => (
            <View key={`h${i}`} style={styles.monthCell}><T v="labelSm" color={Colors.onSurfaceVariant}>{d}</T></View>
          ))}
        </View>
      )}

      <View style={view === 'week' ? styles.weekRow : styles.grid}>
        {days.map((k, i) => {
          if (!k) return <View key={`e${i}`} style={styles.monthCell} />;
          const sel = k === selectedKey;
          const isToday = k === todayKey;
          const dots = (dayCategories[k] || []).slice(0, 3);
          const d = fromDayKey(k);
          return (
            <TouchableOpacity
              key={k}
              onPress={() => onSelect(k)}
              activeOpacity={0.8}
              style={view === 'week' ? [styles.weekDay, sel && styles.daySel] : [styles.monthCell]}
              accessibilityLabel={`${formatDayKey(k)}${dots.length ? `, ${dots.length} kinds of entries` : ''}`}
              accessibilityState={{ selected: sel }}
            >
              {view === 'week' ? (
                <>
                  <T v="labelSm" color={sel ? 'rgba(255,255,255,0.8)' : Colors.onSurfaceVariant} style={{ marginBottom: 4 }}>{DOW[(d.getDay() + 6) % 7]}</T>
                  <T v="labelMd" color={sel ? Colors.onPrimary : isToday ? Colors.primary : Colors.onSurface} style={(sel || isToday) && { fontFamily: Fonts.bold }}>{d.getDate()}</T>
                </>
              ) : (
                <View style={[styles.monthDay, sel && styles.daySel, !sel && isToday && styles.monthToday]}>
                  <T v="labelMd" color={sel ? Colors.onPrimary : Colors.onSurface} style={(sel || isToday) && { fontFamily: Fonts.bold }}>{d.getDate()}</T>
                </View>
              )}
              <View style={[styles.row2, { marginTop: view === 'week' ? 6 : 2, minHeight: 6 }]}>
                {dots.map((c) => <View key={c} style={[styles.dot6, { backgroundColor: sel && view === 'week' ? Colors.onPrimary : categoryColor(c) }]} />)}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedKey !== todayKey && (
        <TouchableOpacity onPress={() => onSelect(todayKey)} style={styles.todayBtn} accessibilityLabel="Go to today">
          <Icon name="today" size={14} color={Colors.primary} />
          <T v="labelSm" color={Colors.primary} style={{ fontFamily: Fonts.semibold }}>Today</T>
        </TouchableOpacity>
      )}

      {legend.length > 0 && (
        <View style={styles.legend}>
          {legend.map((c) => (
            <View key={c.key} style={styles.row6}>
              <View style={[styles.dot8, { backgroundColor: categoryColor(c.key) }]} />
              <T v="labelSm" color={Colors.onSurfaceVariant}>{c.label}</T>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: 16, padding: 16, ...Shadow.sm },
  row2: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  row6: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  dot6: { width: 6, height: 6, borderRadius: 3 },
  dot8: { width: 8, height: 8, borderRadius: 4 },
  viewToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, backgroundColor: Colors.primaryFixed },
  weekRow: { flexDirection: 'row', gap: 4 },
  weekDay: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12 },
  daySel: { backgroundColor: Colors.primary, ...Shadow.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  monthCell: { width: `${100 / 7}%`, height: 46, alignItems: 'center', justifyContent: 'center' },
  monthDay: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  monthToday: { borderWidth: 1.5, borderColor: Colors.primaryFixedDim },
  todayBtn: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, backgroundColor: Colors.surfaceContainerLow },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 16, rowGap: 6, paddingTop: 12 },
});
