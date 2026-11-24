import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Fonts, Radius, Shadow } from '../../constants/theme';
import { Icon, T, Pill } from '../../components/ui';
import { categoryColor, categoryIconColor } from './categoryStyle';
import { CATEGORY, formatMinutes } from '../../models/journal';
import { toDayKey, fromDayKey, formatDayKey, daysBetween } from '../../services/dayKey';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function dayHeading(key) {
  const diff = daysBetween(toDayKey(), key);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return WEEKDAYS[fromDayKey(key).getDay()];
}

// The selected day's entries and dose logs, in time order.
export function DayTimeline({ dayKey, items, onOpen, onAdd }) {
  return (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <View style={{ flex: 1 }}>
          <T v="headlineSm">{dayHeading(dayKey)}</T>
          <T v="bodySm" color={Colors.onSurfaceVariant}>{formatDayKey(dayKey)}</T>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={onAdd} accessibilityLabel="Add an entry for this day">
          <Icon name="add" size={18} color={Colors.onPrimary} />
          <T v="labelMd" color={Colors.onPrimary}>Add</T>
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="event-available" size={28} color={Colors.outlineVariant} />
          <T v="bodySm" color={Colors.onSurfaceVariant} style={{ textAlign: 'center' }}>
            Nothing logged for this day yet. Add a visit, symptom, medication or note.
          </T>
        </View>
      ) : (
        <View style={{ marginTop: 12 }}>
          {items.map((it, i) => (
            <TouchableOpacity key={it.id} onPress={() => onOpen(it.entryId)} activeOpacity={0.8} style={styles.item} accessibilityLabel={`${it.title}${it.status ? `, ${it.status}` : ''}`}>
              <View style={styles.timeCol}>
                <T v="labelSm" color={Colors.onSurfaceVariant}>{it.timeMinutes != null ? formatMinutes(it.timeMinutes) : 'Any time'}</T>
              </View>
              <View style={styles.rail}>
                <View style={[styles.railDot, { backgroundColor: categoryColor(it.category) }]} />
                {i < items.length - 1 && <View style={styles.railLine} />}
              </View>
              <View style={styles.itemBody}>
                <View style={styles.row6}>
                  <Icon name={CATEGORY[it.category]?.icon || 'event-note'} size={16} color={categoryIconColor(it.category)} />
                  <T v="labelLg" style={{ flex: 1 }} numberOfLines={2}>{it.title}</T>
                </View>
                {it.summary ? <T v="bodySm" color={Colors.onSurfaceVariant} numberOfLines={2}>{it.summary}</T> : null}
                {it.status ? <Pill label={it.status} bg={Colors.surfaceContainer} color={Colors.onSurfaceVariant} style={{ marginTop: 4, paddingVertical: 2 }} /> : null}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// Next open appointments, tests, medications and tasks.
export function UpcomingCard({ entries, onOpen }) {
  if (!entries.length) return null;
  const todayKey = toDayKey();
  return (
    <View style={styles.card}>
      <View style={[styles.row6, { marginBottom: 8 }]}>
        <Icon name="upcoming" size={20} color={Colors.primary} />
        <T v="headlineSm">Coming up</T>
      </View>
      {entries.map((e) => {
        const diff = daysBetween(todayKey, e.dayKey);
        const when = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `In ${diff} days`;
        return (
          <TouchableOpacity key={e.id} onPress={() => onOpen(e)} style={styles.upRow} activeOpacity={0.8}>
            <View style={[styles.upIcon, { backgroundColor: Colors.surfaceContainerLow }]}>
              <Icon name={CATEGORY[e.category]?.icon || 'event'} size={18} color={categoryIconColor(e.category)} />
            </View>
            <View style={{ flex: 1 }}>
              <T v="labelLg" numberOfLines={1}>{e.title}</T>
              <T v="bodySm" color={Colors.onSurfaceVariant}>
                {formatDayKey(e.dayKey, { short: true })}{e.timeMinutes != null ? ` • ${formatMinutes(e.timeMinutes)}` : ''}
              </T>
            </View>
            <T v="labelSm" color={Colors.secondary} style={{ fontFamily: Fonts.semibold }}>{when}</T>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Banner for visits and tests whose day passed while still open, with a one-tap "revise".
export function MissedBanner({ missed, onReviseAll, onOpen }) {
  if (!missed.length) return null;
  const n = missed.length;
  return (
    <View style={[styles.card, { backgroundColor: Colors.primaryFixed }]}>
      <View style={styles.row6}>
        <Icon name="event-busy" size={20} color={Colors.primary} />
        <T v="headlineSm" color={Colors.onPrimaryFixed} style={{ flex: 1 }}>
          {n} missed visit{n > 1 ? 's' : ''} or test{n > 1 ? 's' : ''}
        </T>
      </View>
      <T v="bodySm" color={Colors.onPrimaryFixed} style={{ marginTop: 4 }}>
        These were planned but not marked as done. Move them to the next few days, or open one to update it.
      </T>
      {missed.slice(0, 3).map((r) => (
        <TouchableOpacity key={r.entry.id} onPress={() => onOpen(r.entry)} style={[styles.rowBetween, { marginTop: 8 }]}>
          <T v="labelMd" color={Colors.onPrimaryFixed} numberOfLines={1} style={{ flex: 1 }}>{r.entry.title}</T>
          <T v="labelSm" color={Colors.primary}>{r.daysOverdue} day{r.daysOverdue > 1 ? 's' : ''} ago</T>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={[styles.addBtn, { alignSelf: 'flex-start', marginTop: 12 }]} onPress={onReviseAll}>
        <Icon name="update" size={18} color={Colors.onPrimary} />
        <T v="labelMd" color={Colors.onPrimary}>Revise all</T>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: 16, padding: 16, ...Shadow.sm },
  row6: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 36, paddingHorizontal: 14, borderRadius: Radius.full, backgroundColor: Colors.primary },
  empty: { alignItems: 'center', gap: 6, paddingVertical: 16 },
  item: { flexDirection: 'row', alignItems: 'stretch', gap: 8 },
  timeCol: { width: 58, paddingTop: 2 },
  rail: { width: 12, alignItems: 'center' },
  railDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  railLine: { flex: 1, width: 2, backgroundColor: Colors.surfaceContainer, marginTop: 2 },
  itemBody: { flex: 1, paddingBottom: 14, gap: 2 },
  upRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  upIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
