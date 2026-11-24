import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Colors, Fonts, Radius, Shadow } from '../../constants/theme';
import { usePersistentState } from '../../stores/usePersistentState';
import { useHydration } from '../../stores/hydrationStore';
import { Icon, T, Card, Pill, ProgressRing } from '../../components/ui';
import { useOnboarding } from '../../stores/onboardingStore';
import { pregnancyStatus, postpartumStatus, TRIMESTER_NAMES } from '../../services/pregnancyDating';
import { toDayKey, addDays, fromDayKey, formatDayKey, daysBetween } from '../../services/dayKey';
import { useJournal, nextCareEntry, useDayCheckpoints } from '../../stores/journalStore';
import { formatMinutes } from '../../models/journal';
import JourneyCard from './JourneyCard';
import WeekInsightCard from './WeekInsightCard';

const article = require('../../../assets/images/article.jpg');

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Current Monday–Sunday week; past days get a soft dot.
function weekStrip(todayKey) {
  const today = fromDayKey(todayKey);
  const monday = addDays(todayKey, -((today.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const key = addDays(monday, i);
    const d = fromDayKey(key);
    return { key, d: DOW[d.getDay()], n: d.getDate(), today: key === todayKey, dot: key < todayKey };
  });
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return { eyebrow: 'MORNING SANCTUARY', hello: 'Good morning' };
  if (h < 17) return { eyebrow: 'AFTERNOON PAUSE', hello: 'Good afternoon' };
  return { eyebrow: 'EVENING REST', hello: 'Good evening' };
}

const TILES = [
  { icon: 'footprint', iconBg: Colors.tertiaryFixed, iconColor: Colors.tertiary, title: 'Kick Counter', sub: 'Active 42m ago', foot: '10 kicks / 18 min', footColor: Colors.primary, go: 'track' },
  { icon: 'timer', iconBg: Colors.primaryFixed, iconColor: Colors.primary, title: 'Contraction Timer', sub: 'Resting mode', foot: 'Tap to log wave', footColor: Colors.secondary, go: 'track' },
  { icon: 'stethoscope', iconBg: Colors.secondaryFixed, iconColor: Colors.secondary, title: 'Symptom Log', sub: 'Heartburn (mild)', foot: '+ Update notes', footColor: Colors.primary, go: 'track' },
  { icon: 'document-scanner', iconBg: Colors.surfaceContainerHigh, iconColor: Colors.primary, title: 'Scan Lab Report', sub: 'OCR AI Ready', foot: 'Fast Vault Sync', footColor: Colors.secondary, go: 'vault' },
];


function dueLabel(days) {
  if (days <= 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}

export default function HomeScreen({ onNavigate, onEditProfile }) {
  const { profile } = useOnboarding();
  const todayKey = toDayKey();
  const preg = pregnancyStatus(profile, todayKey);
  const post = postpartumStatus(profile, todayKey);
  const days = weekStrip(todayKey);
  const greet = greeting();
  const name = profile?.displayName || 'Mama';

  let subtitle = 'Planning • gentle preparation';
  if (profile?.stage === 'pregnant') {
    subtitle = preg ? `Week ${preg.week} • Day ${preg.day} • ${TRIMESTER_NAMES[preg.trimester]}` : 'Pregnancy • add your due date';
  } else if (profile?.stage === 'postpartum') {
    subtitle = post ? `Week ${post.week} postpartum • Day ${post.days}` : 'Postpartum • gentle recovery';
  }

  const journal = useJournal();
  const routine = useDayCheckpoints(todayKey, preg?.week ?? null);
  const nextCare = nextCareEntry(journal, todayKey);
  const { state: hydration, log: logWater } = useHydration();
  const GOAL = hydration.target;
  const [bookmarked, setBookmarked] = usePersistentState('affirmation_saved', false);

  const addWater = (ml) => logWater(ml, ml === 250 ? 'Standard Mug' : 'Sports Tumbler');
  const pct = Math.round((hydration.intake / GOAL) * 100);

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* Greeting */}
      <View style={styles.greetRow}>
        <View style={{ flex: 1 }}>
          <T v="labelSm" color={Colors.primary} style={styles.eyebrow}>{greet.eyebrow}</T>
          <T v="headlineLg" style={{ marginTop: 2 }}>{greet.hello}, {name}</T>
          <T v="bodySm" color={Colors.onSurfaceVariant}>{subtitle}</T>
        </View>
        <TouchableOpacity style={styles.roundBtn} accessibilityLabel="Toggle audio guide">
          <Icon name="spa" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <JourneyCard profile={profile} preg={preg} post={post} onEditDates={onEditProfile} />

      {/* Date strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.dateStrip}>
        {days.map((day) => (
          <TouchableOpacity
            key={day.key}
            activeOpacity={0.8}
            style={[styles.dateChip, day.today && styles.dateChipToday]}
            accessibilityLabel={formatDayKey(day.key)}
          >
            <T v="labelSm" color={day.today ? Colors.onPrimary : Colors.onSurfaceVariant} style={day.today && styles.bold}>{day.d}</T>
            <T v="headlineSm" color={day.today ? Colors.onPrimary : Colors.onSurfaceVariant} style={[{ marginTop: 4 }, day.today && styles.bold]}>{day.n}</T>
            <View style={[styles.dateDot, { backgroundColor: day.today ? Colors.onPrimary : day.dot ? Colors.secondaryContainer : 'transparent' }]} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <WeekInsightCard profile={profile} preg={preg} post={post} />

      {/* Next visit or test from the calendar */}
      {nextCare ? (
        <TouchableOpacity activeOpacity={0.85} onPress={() => onNavigate?.('track')} accessibilityLabel={`Next: ${nextCare.title}`}>
          <Card padding={16} style={styles.rowBetween}>
            <View style={[styles.row8, { flex: 1 }]}>
              <View style={[styles.squircle, { backgroundColor: Colors.secondaryContainer }]}>
                <Icon name={nextCare.category === 'test' ? 'biotech' : 'event'} size={22} color={Colors.onSecondaryContainer} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.row8}>
                  <Pill label={dueLabel(daysBetween(todayKey, nextCare.dayKey))} bg={Colors.secondaryFixed} color={Colors.onSecondaryFixed} style={{ paddingVertical: 2, paddingHorizontal: 8 }} />
                  <T v="labelSm" color={Colors.onSurfaceVariant}>
                    {formatDayKey(nextCare.dayKey, { short: true })}{nextCare.timeMinutes != null ? ` • ${formatMinutes(nextCare.timeMinutes)}` : ''}
                  </T>
                </View>
                <T v="labelLg" numberOfLines={1} style={{ marginTop: 2 }}>{nextCare.title}</T>
                <T v="bodySm" color={Colors.onSurfaceVariant} numberOfLines={1}>
                  {nextCare.appointment?.clinicianOrClinic || (nextCare.category === 'test' ? 'Test or scan' : 'Care appointment')}
                </T>
              </View>
            </View>
            <View style={styles.roundBtn}>
              <Icon name="chevron-right" size={20} color={Colors.primary} />
            </View>
          </Card>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity activeOpacity={0.85} onPress={() => onNavigate?.('track')}>
          <Card padding={16} style={styles.row8}>
            <View style={[styles.squircle, { backgroundColor: Colors.surfaceContainer }]}>
              <Icon name="event" size={22} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <T v="labelLg">No upcoming visits</T>
              <T v="bodySm" color={Colors.onSurfaceVariant}>Add appointments and tests in Track.</T>
            </View>
          </Card>
        </TouchableOpacity>
      )}

      {/* Care routine = today's daily checkpoints */}
      {routine.enabled && (
        <View>
          <View style={[styles.rowBetween, { marginBottom: 8 }]}>
            <T v="headlineSm">Today's Care Routine</T>
            {routine.habits.length > 0 && (
              <T v="labelSm" color={Colors.secondary} style={styles.bold}>{routine.done} of {routine.habits.length} Complete</T>
            )}
          </View>
          {routine.habits.length === 0 && (
            <TouchableOpacity onPress={() => onNavigate?.('track')}>
              <T v="bodySm" color={Colors.onSurfaceVariant}>No daily habits yet. Add some in Track.</T>
            </TouchableOpacity>
          )}
          {routine.habits.map((r) => {
            const isDone = !!routine.checks[r.id];
            return (
              <View key={r.id} style={styles.routineItem}>
                <View style={[styles.row16, { flex: 1 }]}>
                  <TouchableOpacity
                    onPress={() => routine.toggle(r.id)}
                    style={[styles.check, { backgroundColor: isDone ? Colors.secondaryContainer : Colors.surfaceContainer }]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isDone }}
                    accessibilityLabel={r.title}
                  >
                    {isDone && <Icon name="check" size={20} color={Colors.onSecondaryContainer} />}
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <T v="labelLg" style={isDone && styles.struck}>{r.title}</T>
                    <T v="bodySm" color={isDone ? Colors.secondary : Colors.onSurfaceVariant} style={isDone && { fontFamily: Fonts.medium }}>
                      {isDone ? 'Completed today' : r.subtitle}
                    </T>
                  </View>
                </View>
                <Icon name={isDone ? 'verified' : r.icon || 'check-circle-outline'} size={20} color={isDone ? Colors.secondary : Colors.outlineVariant} />
              </View>
            );
          })}
        </View>
      )}

      {/* Hydration */}
      <Card>
        <View style={[styles.rowBetween, { marginBottom: 8 }]}>
          <View style={styles.row8}>
            <Icon name="water-drop" size={22} color={Colors.primary} />
            <T v="headlineSm">Hydration Balance</T>
          </View>
          <T v="labelSm" color={Colors.onSurfaceVariant}>Daily Goal: {GOAL.toLocaleString()} mL</T>
        </View>
        <View style={styles.row16}>
          <ProgressRing size={96} stroke={8} progress={hydration.intake / GOAL} color={Colors.primary} track={Colors.surfaceContainer}>
            <T v="headlineSm" style={styles.bold}>{pct}%</T>
          </ProgressRing>
          <View style={{ flex: 1 }}>
            <View style={styles.baseline}>
              <T v="headlineLg">{hydration.intake.toLocaleString()}</T>
              <T v="bodySm" color={Colors.onSurfaceVariant}>/ {GOAL.toLocaleString()} mL</T>
            </View>
            <T v="bodySm" color={Colors.onSurfaceVariant} style={{ marginTop: 2 }}>Hydration sustains amniotic fluid levels.</T>
            <View style={[styles.row8, { marginTop: 8 }]}>
              {[250, 500].map((ml) => (
                <TouchableOpacity key={ml} style={styles.waterPill} onPress={() => addWater(ml)} activeOpacity={0.8}>
                  <T v="labelMd" color={Colors.primary}>+{ml} mL</T>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Card>

      {/* Active telemetry grid */}
      <View>
        <T v="headlineSm" style={{ marginBottom: 8 }}>Active Telemetry</T>
        <View style={styles.grid}>
          {TILES.map((t) => (
            <TouchableOpacity key={t.title} style={styles.tile} activeOpacity={0.85} onPress={() => onNavigate?.(t.go)}>
              <View style={[styles.tileIcon, { backgroundColor: t.iconBg }]}>
                <Icon name={t.icon} size={22} color={t.iconColor} />
              </View>
              <T v="labelLg">{t.title}</T>
              <T v="bodySm" color={Colors.onSurfaceVariant} style={{ marginTop: 2 }}>{t.sub}</T>
              <T v="labelSm" color={t.footColor} style={{ marginTop: 4, fontFamily: Fonts.semibold }}>{t.foot}</T>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Affirmation */}
      <Card>
        <View style={styles.rowBetween}>
          <View style={styles.row8}>
            <Icon name="format-quote" size={20} color={Colors.primary} />
            <T v="labelSm" color={Colors.primary} style={[styles.bold, styles.eyebrow]}>MATERNAL AFFIRMATION</T>
          </View>
          <TouchableOpacity onPress={() => setBookmarked((b) => !b)} accessibilityLabel="Bookmark quote" style={{ padding: 6, marginRight: -6 }}>
            <Icon name={bookmarked ? 'bookmark' : 'bookmark-border'} size={20} color={bookmarked ? Colors.primary : Colors.outline} />
          </TouchableOpacity>
        </View>
        <T v="headlineSm" style={{ fontFamily: Fonts.italic, marginTop: 12, lineHeight: 24 }}>
          “Your body is doing miraculous, invisible work today. Rest is not an indulgence; rest is productive labor.”
        </T>
        <TouchableOpacity style={styles.article} activeOpacity={0.85}>
          <Image source={article} style={styles.articleImg} />
          <View style={{ flex: 1 }}>
            <T v="labelSm" color={Colors.primary} style={styles.bold}>2-min read • Trimester 2</T>
            <T v="labelLg" style={{ marginTop: 2 }}>Managing Round Ligament Pain Safely</T>
            <T v="bodySm" color={Colors.onSurfaceVariant} numberOfLines={1} style={{ marginTop: 2 }}>
              Physiotherapist-approved gentle posture adjustments.
            </T>
          </View>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 24 },
  eyebrow: { letterSpacing: 1, fontFamily: Fonts.semibold },
  bold: { fontFamily: Fonts.bold },
  struck: { textDecorationLine: 'line-through', opacity: 0.7 },
  greetRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: -8 },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row8: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  row16: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  rowTop16: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  rowGap6: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  baseline: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  triRow: { flexDirection: 'row', gap: 4 },
  tri: { flex: 1, alignItems: 'center', padding: 8, borderRadius: Radius.sm },
  bleed: { marginHorizontal: -20, marginTop: -8 },
  dateStrip: { paddingHorizontal: 20, gap: 8, alignItems: 'center', paddingVertical: 6 },
  dateChip: {
    width: 50,
    height: 72,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  dateChipToday: { width: 52, height: 76, backgroundColor: Colors.primary, ...Shadow.primary },
  dateDot: { width: 6, height: 6, borderRadius: 3, marginTop: 4 },
  dot6: { width: 6, height: 6, borderRadius: 3 },
  circleIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  squircle: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  guideBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerLowest,
    ...Shadow.sm,
  },
  guideBody: { marginTop: 8, padding: 16, borderRadius: 16, backgroundColor: Colors.surfaceContainerLowest },
  routineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerLowest,
    marginBottom: 4,
    ...Shadow.sm,
  },
  check: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  startBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, backgroundColor: Colors.primaryFixed },
  waterPill: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerHigh,
    justifyContent: 'center',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: {
    width: '48.6%',
    flexGrow: 1,
    flexBasis: '45%',
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerLowest,
    ...Shadow.sm,
  },
  tileIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  article: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerLow,
    marginTop: 16,
  },
  articleImg: { width: 64, height: 64, borderRadius: 12 },
});
