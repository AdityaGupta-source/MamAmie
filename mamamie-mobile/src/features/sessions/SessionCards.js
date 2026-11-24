// Kick counter and contraction timer, used on Track and in the Log (+) sheet.
import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Fonts, Radius, Shadow } from '../../constants/theme';
import { Icon, T, Pill } from '../../components/ui';
import { useSessions, contractionStats, KICK_GOAL } from '../../stores/sessionsStore';

const pad = (n) => String(n).padStart(2, '0');
const clock = (s) => `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
const mmss = (s) => `${Math.floor(s / 60)}:${pad(s % 60)}`;
const timeOf = (ms) => new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

// Re-renders every second while `on` is true.
function useTick(on) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!on) return undefined;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [on]);
  return now;
}

export function KickCounterCard({ flat }) {
  const s = useSessions();
  const active = s.kickActive;
  const now = useTick(!!active);
  const last = s.kickSessions[0];
  const count = active?.count || 0;
  const elapsed = active ? Math.floor((now - active.startedAt) / 1000) : 0;

  return (
    <View style={[styles.card, flat && styles.flat]}>
      <View style={styles.rowBetween}>
        <View style={{ flex: 1 }}>
          <View style={styles.row6}>
            <Icon name="child-care" size={20} color={Colors.primary} />
            <T v="headlineSm">Kick count</T>
          </View>
          <T v="bodySm" color={Colors.onSurfaceVariant}>Count kicks, rolls and flutters until you reach {KICK_GOAL}.</T>
        </View>
        <Pill label={active ? 'In progress' : 'Ready'} bg={active ? Colors.secondaryContainer : Colors.surfaceContainer} color={active ? Colors.onSecondaryContainer : Colors.onSurfaceVariant} />
      </View>

      <View style={styles.kickBox}>
        <View style={{ flex: 1 }}>
          <View style={styles.baseline}>
            <T v="display">{count}</T>
            <T v="headlineSm" color={Colors.onSurfaceVariant} style={{ fontFamily: Fonts.regular }}>/ {KICK_GOAL}</T>
          </View>
          <View style={[styles.row6, { marginTop: 4 }]}>
            <Icon name="timer" size={16} color={Colors.primary} />
            <T v="labelMd" color={Colors.onSurfaceVariant}>{active ? clock(elapsed) : 'Starts with the first kick'}</T>
          </View>
        </View>
        <TouchableOpacity style={styles.bigBtn} onPress={s.addKick} activeOpacity={0.85} accessibilityLabel={`Record a kick, ${count} so far`}>
          <Icon name="add" size={24} color={Colors.onPrimary} />
          <T v="labelLg" color={Colors.onPrimary} style={{ fontFamily: Fonts.bold }}>Kick</T>
        </TouchableOpacity>
      </View>

      <View style={styles.progressDots}>
        {Array.from({ length: KICK_GOAL }).map((_, i) => (
          <View key={i} style={[styles.progressDot, { backgroundColor: i < count ? Colors.secondary : Colors.surfaceContainerHigh }]} />
        ))}
      </View>

      {active ? (
        <View style={[styles.row8, { marginTop: 12 }]}>
          <TouchableOpacity style={styles.ghostBtn} onPress={s.cancelKick}>
            <T v="labelMd" color={Colors.onSurfaceVariant}>Discard</T>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghostBtn} onPress={s.endKick}>
            <T v="labelMd" color={Colors.primary}>End & save</T>
          </TouchableOpacity>
        </View>
      ) : last ? (
        <T v="bodySm" color={Colors.onSurfaceVariant} style={{ marginTop: 12 }}>
          Last session: {last.count} movements in {Math.max(1, Math.round((last.endedAt - last.startedAt) / 60000))} min, {timeOf(last.startedAt)}.
        </T>
      ) : null}
      <T v="bodySm" color={Colors.onSurfaceVariant} style={{ marginTop: 8 }}>
        If you notice baby moving less than usual, contact your maternity unit straight away — don’t wait for the next day.
      </T>
    </View>
  );
}

export function ContractionTimerCard({ flat }) {
  const s = useSessions();
  const running = !!s.contractionStart;
  const now = useTick(running);
  const stats = contractionStats(s.contractions, now);

  return (
    <View style={[styles.card, flat && styles.flat]}>
      <View style={styles.row6}>
        <Icon name="timer" size={20} color={Colors.primary} />
        <T v="headlineSm">Contraction timer</T>
      </View>
      <T v="bodySm" color={Colors.onSurfaceVariant} style={{ marginTop: 2 }}>Tap when a contraction starts and again when it ends.</T>

      <TouchableOpacity style={[styles.bigBtn, styles.wide, running && { backgroundColor: Colors.secondary }]} onPress={s.toggleContraction} activeOpacity={0.85}>
        <Icon name={running ? 'stop' : 'play-arrow'} size={22} color={Colors.onPrimary} />
        <T v="labelLg" color={Colors.onPrimary}>{running ? `End • ${mmss(Math.floor((now - s.contractionStart) / 1000))}` : 'Start contraction'}</T>
      </TouchableOpacity>

      {stats && (
        <View style={[styles.row8, { marginTop: 12 }]}>
          <Stat label="Last hour" value={`${stats.count}`} />
          <Stat label="Avg length" value={`${stats.avgDuration} s`} />
          <Stat label="Avg apart" value={stats.avgInterval != null ? mmss(stats.avgInterval) : '—'} />
        </View>
      )}

      {s.contractions.slice(0, 5).map((c) => (
        <View key={c.id} style={[styles.rowBetween, styles.listRow]}>
          <T v="bodySm" color={Colors.onSurfaceVariant} style={{ flex: 1 }}>{timeOf(c.startAt)}</T>
          <T v="labelMd">{c.durationSec} s</T>
          <TouchableOpacity onPress={() => s.removeContraction(c.id)} hitSlop={8} accessibilityLabel="Delete this contraction">
            <Icon name="close" size={16} color={Colors.outline} />
          </TouchableOpacity>
        </View>
      ))}
      <T v="bodySm" color={Colors.onSurfaceVariant} style={{ marginTop: 8 }}>
        Call your maternity unit if contractions become regular and closer together, your waters break, or you bleed.
      </T>
    </View>
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
  card: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: 16, padding: 20, ...Shadow.sm },
  flat: { padding: 0, shadowOpacity: 0, elevation: 0 },
  row6: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  row8: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  baseline: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  kickBox: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, backgroundColor: Colors.surfaceContainerLow },
  bigBtn: { height: 64, paddingHorizontal: 24, borderRadius: Radius.full, backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, ...Shadow.primary },
  wide: { alignSelf: 'stretch', marginTop: 16 },
  progressDots: { flexDirection: 'row', gap: 6, marginTop: 16 },
  progressDot: { flex: 1, height: 8, borderRadius: 4 },
  ghostBtn: { flex: 1, minHeight: 44, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceContainerLow },
  stat: { flex: 1, padding: 10, borderRadius: 12, backgroundColor: Colors.surfaceContainerLow },
  listRow: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.surfaceContainer, marginTop: 8 },
});
