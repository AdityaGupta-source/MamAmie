import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Svg, { Rect, Line, Polyline, Circle } from 'react-native-svg';
import { Colors, Fonts, Radius, Shadow } from '../constants/theme';
import { usePersistentState } from '../constants/storage';
import { Icon, T, Pill } from '../components/ui';

const doctor = require('../../assets/images/doctor.jpg');

const MODES = [
  { key: 'overview', label: 'Overview' },
  { key: 'vitals', label: 'Vitals' },
  { key: 'kicks', label: 'Fetal Movement', live: true },
  { key: 'nutrition', label: 'Nutrition & Water' },
  { key: 'contractions', label: 'Contractions' },
];

const WEEK = [
  { d: 'M', n: 12, dots: [Colors.secondary] },
  { d: 'T', n: 13, dots: [Colors.secondary, Colors.primaryContainer] },
  { d: 'W', n: 14, dots: [Colors.surfaceTint] },
  { d: 'T', n: 15, dots: [Colors.secondary] },
  { d: 'F', n: 16, dots: [Colors.secondaryFixed, Colors.primaryFixed], today: true },
  { d: 'S', n: 17, dots: [Colors.surfaceVariant] },
  { d: 'S', n: 18, dots: [Colors.surfaceVariant] },
];

// Systolic readings for the 7-day sparkline.
const BP_WEEK = [116, 114, 117, 115, 119, 120, 118];

const pad = (n) => String(n).padStart(2, '0');
const fmt = (s) => `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;

export default function VitalsScreen({ onNavigate }) {
  const [mode, setMode] = useState('overview');
  const [kicks, setKicks] = usePersistentState('kick_session', { count: 10, startedAt: null, elapsed: 1334 });
  const [contractions, setContractions] = usePersistentState('contractions', []);
  const [contractionStart, setContractionStart] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const sessionSeconds = kicks.startedAt ? Math.floor((now - kicks.startedAt) / 1000) : kicks.elapsed;
  const goalMet = kicks.count >= 10;

  const addKick = () =>
    setKicks((k) => {
      // A finished session starts over on the next tap.
      if (k.count >= 10) return { count: 1, startedAt: Date.now(), elapsed: 0 };
      const count = k.count + 1;
      const startedAt = k.startedAt || Date.now();
      if (count >= 10) return { count, startedAt: null, elapsed: Math.floor((Date.now() - startedAt) / 1000) };
      return { ...k, count, startedAt };
    });

  const toggleContraction = () => {
    if (contractionStart) {
      const secs = Math.round((Date.now() - contractionStart) / 1000);
      setContractions((c) => [{ at: contractionStart, secs }, ...c].slice(0, 10));
      setContractionStart(null);
    } else {
      setContractionStart(Date.now());
    }
  };

  const show = (section) => mode === 'overview' || SECTIONS[mode]?.includes(section);

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* Mode tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.modeBar}>
          {MODES.map((m) => {
            const active = m.key === mode;
            return (
              <TouchableOpacity key={m.key} onPress={() => setMode(m.key)} style={[styles.modeTab, active && styles.modeTabActive]} activeOpacity={0.8}>
                {m.live && <View style={[styles.dot6, { backgroundColor: Colors.secondary }]} />}
                <T v="labelMd" color={active ? Colors.onPrimary : Colors.onSurfaceVariant} style={{ fontFamily: Fonts.medium }}>{m.label}</T>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Calendar */}
      <View style={styles.card16}>
        <View style={[styles.rowBetween, { marginBottom: 8, paddingHorizontal: 4 }]}>
          <View style={styles.row6}>
            <T v="headlineSm">May 2025</T>
            <Pill label="Week 24" bg={Colors.primaryFixed} color={Colors.primary} style={{ paddingVertical: 2, paddingHorizontal: 8 }} />
          </View>
          <View style={styles.row6}>
            <Icon name="chevron-left" size={20} color={Colors.onSurfaceVariant} />
            <Icon name="chevron-right" size={20} color={Colors.onSurfaceVariant} />
          </View>
        </View>
        <View style={styles.weekRow}>
          {WEEK.map((w) => (
            <View key={w.n} style={[styles.weekDay, w.today && styles.weekDayToday]}>
              <T v="labelSm" color={w.today ? 'rgba(255,255,255,0.8)' : Colors.onSurfaceVariant} style={{ marginBottom: 4 }}>{w.d}</T>
              <T v="labelMd" color={w.today ? Colors.onPrimary : Colors.onSurface} style={w.today && { fontFamily: Fonts.bold }}>{w.n}</T>
              <View style={[styles.row2, { marginTop: 6 }]}>
                {w.dots.map((c, i) => <View key={i} style={[styles.dot6, { backgroundColor: c }]} />)}
              </View>
            </View>
          ))}
        </View>
        <View style={styles.legend}>
          {[['Optimal', Colors.secondary], ['Review', Colors.primaryContainer], ['Dr. Visit', Colors.surfaceTint]].map(([l, c]) => (
            <View key={l} style={styles.row6}>
              <View style={[styles.dot8, { backgroundColor: c }]} />
              <T v="labelSm" color={Colors.onSurfaceVariant}>{l}</T>
            </View>
          ))}
        </View>
      </View>

      {/* Kick count */}
      {show('kicks') && (
        <View style={[styles.card16, { padding: 24 }]}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <View style={styles.row6}>
                <Icon name="child-care" size={20} color={Colors.primary} />
                <T v="headlineSm">Fetal Kick Count</T>
              </View>
              <T v="bodySm" color={Colors.onSurfaceVariant}>Active monitoring session • Standard protocol 10 kicks / 2h</T>
            </View>
            <Pill label={goalMet ? 'Healthy Baseline' : 'In Progress'} bg={Colors.secondaryContainer} color={Colors.onSecondaryContainer} />
          </View>
          <View style={styles.kickBox}>
            <View>
              <View style={styles.baseline}>
                <T v="display">{kicks.count}</T>
                <T v="headlineSm" color={Colors.onSurfaceVariant} style={{ fontFamily: Fonts.regular }}>/ 10 kicks</T>
              </View>
              <View style={[styles.row6, { marginTop: 4 }]}>
                <Icon name="timer" size={16} color={Colors.primary} />
                <T v="labelMd" color={Colors.onSurfaceVariant} style={{ fontFamily: Fonts.medium }}>
                  Session timer: <T v="labelMd">{fmt(sessionSeconds)}</T>
                </T>
              </View>
            </View>
            <TouchableOpacity style={styles.kickBtn} onPress={addKick} activeOpacity={0.85}>
              <Icon name="add" size={24} color={Colors.onPrimary} />
              <T v="labelLg" color={Colors.onPrimary} style={{ fontFamily: Fonts.bold }}>Kick</T>
            </TouchableOpacity>
          </View>
          <View style={{ marginTop: 16 }}>
            <View style={[styles.rowBetween, { marginBottom: 6 }]}>
              <T v="labelSm" color={Colors.onSurfaceVariant}>Session Progress</T>
              <T v="labelSm" color={Colors.secondary} style={{ fontFamily: Fonts.semibold }}>
                {goalMet ? `Goal Reached in ${Math.max(1, Math.round(kicks.elapsed / 60))} mins` : `${10 - kicks.count} kicks to goal`}
              </T>
            </View>
            <View style={styles.progressDots}>
              {Array.from({ length: 10 }).map((_, i) => (
                <View key={i} style={[styles.progressDot, { backgroundColor: i < kicks.count ? Colors.secondary : Colors.surfaceContainerHigh }]} />
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Contractions (own tab only) */}
      {mode === 'contractions' && (
        <View style={[styles.card16, { padding: 24 }]}>
          <View style={styles.row6}>
            <Icon name="timer" size={20} color={Colors.primary} />
            <T v="headlineSm">Contraction Timer</T>
          </View>
          <T v="bodySm" color={Colors.onSurfaceVariant} style={{ marginTop: 2 }}>
            Tap when a wave starts and again when it ends.
          </T>
          <TouchableOpacity style={[styles.kickBtn, { alignSelf: 'stretch', justifyContent: 'center', marginTop: 16 }]} onPress={toggleContraction}>
            <Icon name={contractionStart ? 'pause' : 'play-arrow'} size={22} color={Colors.onPrimary} />
            <T v="labelLg" color={Colors.onPrimary}>
              {contractionStart ? `End wave • ${Math.floor((now - contractionStart) / 1000)}s` : 'Start wave'}
            </T>
          </TouchableOpacity>
          {contractions.slice(0, 5).map((c) => (
            <View key={c.at} style={[styles.rowBetween, styles.listRow]}>
              <T v="bodySm" color={Colors.onSurfaceVariant}>{new Date(c.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</T>
              <T v="labelMd">{c.secs}s</T>
            </View>
          ))}
        </View>
      )}

      {/* Blood pressure */}
      {show('bp') && (
        <View style={[styles.card16, { padding: 24, gap: 16 }]}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <View style={styles.row6}>
                <Icon name="monitor-heart" size={20} color={Colors.primary} />
                <T v="headlineSm">Blood Pressure & Heart Rate</T>
              </View>
              <T v="bodySm" color={Colors.onSurfaceVariant}>Last checked 2h ago • Sitting rest position</T>
            </View>
            <View style={styles.infoBtn}><Icon name="info-outline" size={18} color={Colors.onSurfaceVariant} /></View>
          </View>
          <View style={styles.row8}>
            <View style={styles.metric}>
              <T v="labelSm" color={Colors.onSurfaceVariant}>Systolic / Diastolic</T>
              <View style={[styles.baseline, { marginTop: 2 }]}>
                <T v="headlineLg">118/76</T>
                <T v="labelSm" color={Colors.onSurfaceVariant}>mmHg</T>
              </View>
              <View style={[styles.row6, { marginTop: 4 }]}>
                <Icon name="check-circle" size={14} color={Colors.secondary} />
                <T v="labelSm" color={Colors.secondary} style={{ fontFamily: Fonts.semibold }}>Normotensive</T>
              </View>
            </View>
            <View style={styles.metric}>
              <T v="labelSm" color={Colors.onSurfaceVariant}>Resting Maternal HR</T>
              <View style={[styles.baseline, { marginTop: 2 }]}>
                <T v="headlineLg">78</T>
                <T v="labelSm" color={Colors.onSurfaceVariant}>bpm</T>
              </View>
              <View style={[styles.row6, { marginTop: 4 }]}>
                <Icon name="trending-flat" size={14} color={Colors.secondary} />
                <T v="labelSm" color={Colors.onSurfaceVariant}>Steady avg. 76-82</T>
              </View>
            </View>
          </View>
          <View style={{ gap: 4 }}>
            <View style={styles.rowBetween}>
              <T v="labelSm" color={Colors.onSurfaceVariant} style={{ flex: 1 }}>7-Day BP Range with Gestational Safe Threshold</T>
              <T v="labelSm" color={Colors.secondary} style={{ fontFamily: Fonts.semibold }}>{'< 140/90 Target'}</T>
            </View>
            <BpChart />
            <View style={[styles.rowBetween, { paddingHorizontal: 4 }]}>
              {['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Today'].map((d) => (
                <T key={d} v="labelSm" color={d === 'Today' ? Colors.onSurface : Colors.onSurfaceVariant} style={d === 'Today' && { fontFamily: Fonts.bold }}>{d}</T>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Weight */}
      {show('weight') && (
        <View style={styles.card16}>
          <View style={styles.rowBetween}>
            <View style={styles.row6}>
              <Icon name="scale" size={18} color={Colors.primary} />
              <T v="labelMd" color={Colors.onSurfaceVariant}>Maternal Weight</T>
            </View>
            <Pill label="IOM Safe" bg={Colors.secondaryContainer} color={Colors.secondary} style={{ paddingVertical: 2, paddingHorizontal: 8 }} />
          </View>
          <View style={[styles.baseline, { marginTop: 8 }]}>
            <T v="headlineLg">+6.2</T>
            <T v="bodyMd">kg</T>
            <T v="labelSm" color={Colors.onSurfaceVariant} style={{ marginLeft: 4 }}>since conception</T>
          </View>
          <T v="bodySm" color={Colors.onSurfaceVariant} style={{ marginTop: 4 }}>
            Recommended target at Week 24: 5.5 - 7.5 kg. Growth velocity on trajectory.
          </T>
          <View style={styles.bar}><View style={[styles.barFill, { width: '62%' }]} /></View>
          <View style={[styles.rowBetween, { marginTop: 4 }]}>
            <T v="labelSm" color={Colors.onSurfaceVariant}>Baseline</T>
            <T v="labelSm" style={{ fontFamily: Fonts.semibold }}>65.8 kg</T>
            <T v="labelSm" color={Colors.onSurfaceVariant}>Target ~72kg</T>
          </View>
        </View>
      )}

      {/* Sleep */}
      {show('sleep') && (
        <View style={styles.card16}>
          <View style={styles.rowBetween}>
            <View style={styles.row6}>
              <Icon name="bedtime" size={18} color={Colors.primary} />
              <T v="labelMd" color={Colors.onSurfaceVariant}>Sleep & Recovery</T>
            </View>
            <T v="labelSm" color={Colors.primary} style={{ fontFamily: Fonts.semibold }}>88% Quality</T>
          </View>
          <View style={[styles.baseline, { marginTop: 8 }]}>
            <T v="headlineLg">7h 45m</T>
            <T v="labelSm" color={Colors.onSurfaceVariant} style={{ marginLeft: 4 }}>last night</T>
          </View>
          <View style={styles.sleepPill}>
            <View style={styles.sleepIcon}><Icon name="airline-seat-flat" size={16} color={Colors.secondary} /></View>
            <View style={{ flex: 1 }}>
              <T v="labelSm" style={{ fontFamily: Fonts.semibold }}>Left-Side Sleeping: 68%</T>
              <T v="bodySm" color={Colors.onSurfaceVariant} style={{ fontSize: 11, lineHeight: 14 }}>
                Optimizes uterine blood flow & kidney filtration
              </T>
            </View>
          </View>
          <View style={[styles.rowBetween, { paddingTop: 8 }]}>
            <T v="labelSm" color={Colors.onSurfaceVariant}>Deep Sleep: 1h 40m</T>
            <T v="labelSm" color={Colors.onSurfaceVariant}>REM: 2h 05m</T>
          </View>
        </View>
      )}

      {/* Doctor sync */}
      {show('doctor') && (
        <View style={[styles.card16, { backgroundColor: Colors.surfaceContainerHigh, gap: 16 }]}>
          <View style={styles.row8}>
            <Image source={doctor} style={styles.docImg} />
            <View style={{ flex: 1 }}>
              <View style={styles.row6}>
                <T v="labelLg">Dr. Allison Chen, MD</T>
                <Icon name="verified" size={16} color={Colors.secondary} />
              </View>
              <View style={styles.row6}>
                <View style={[styles.dot8, { backgroundColor: Colors.secondary }]} />
                <T v="bodySm" color={Colors.onSurfaceVariant}>Live Sync Active • Last push 14m ago</T>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.pdfBtn} activeOpacity={0.85}>
            <Icon name="picture-as-pdf" size={18} color={Colors.onPrimary} />
            <T v="labelMd" color={Colors.onPrimary}>Export 30-Day PDF Summary</T>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick entry */}
      {show('quick') && (
        <View>
          <View style={[styles.rowBetween, { marginBottom: 4, paddingHorizontal: 4 }]}>
            <T v="labelSm" color={Colors.onSurfaceVariant} style={{ fontFamily: Fonts.semibold, letterSpacing: 1 }}>QUICK TELEMETRY ENTRY</T>
            <T v="labelSm" color={Colors.primary}>Edit Favorites</T>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 4, paddingVertical: 4 }}>
            {[
              ['healing', '+ Symptoms'],
              ['water-drop', '+ Blood Glucose'],
              ['mood', '+ Mood & Energy'],
              ['local-drink', '+ Water 250ml', 'log'],
            ].map(([icon, label, go]) => (
              <TouchableOpacity key={label} style={styles.chip} onPress={() => go && onNavigate?.(go)} activeOpacity={0.8}>
                <Icon name={icon} size={18} color={Colors.primary} />
                <T v="labelMd" style={{ fontFamily: Fonts.medium }}>{label}</T>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
}

const SECTIONS = {
  vitals: ['bp', 'weight', 'sleep', 'doctor'],
  kicks: ['kicks'],
  nutrition: ['weight', 'quick'],
  contractions: [],
};

function BpChart() {
  const w = 300;
  const h = 96;
  const min = 100;
  const max = 145;
  const y = (v) => h - ((v - min) / (max - min)) * h;
  const pts = BP_WEEK.map((v, i) => [12 + (i * (w - 24)) / (BP_WEEK.length - 1), y(v)]);
  return (
    <View style={styles.chart}>
      <Svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <Rect x="0" y={y(140)} width={w} height={y(110) - y(140)} rx="8" fill={Colors.secondaryFixed} opacity={0.55} />
        <Line x1="0" x2={w} y1={y(140)} y2={y(140)} stroke={Colors.secondary} strokeDasharray="4 4" strokeWidth="1" opacity={0.6} />
        <Polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={Colors.primary} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map(([cx, cy], i) => (
          <Circle key={i} cx={cx} cy={cy} r={i === pts.length - 1 ? 5 : 3.5} fill={Colors.primary} stroke="#fff" strokeWidth={i === pts.length - 1 ? 2 : 0} />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40, gap: 16 },
  row2: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  row6: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  row8: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  baseline: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  dot6: { width: 6, height: 6, borderRadius: 3 },
  dot8: { width: 8, height: 8, borderRadius: 4 },
  modeBar: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: Radius.full, backgroundColor: Colors.surfaceContainerHigh },
  modeTab: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 7, borderRadius: Radius.full },
  modeTabActive: { backgroundColor: Colors.primary, ...Shadow.sm },
  card16: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: 16, padding: 16, ...Shadow.sm },
  weekRow: { flexDirection: 'row', gap: 4 },
  weekDay: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12 },
  weekDayToday: { backgroundColor: Colors.primary, transform: [{ scale: 1.05 }], ...Shadow.sm },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, paddingTop: 12 },
  kickBox: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerLow,
  },
  kickBtn: {
    height: 64,
    paddingHorizontal: 24,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...Shadow.primary,
  },
  progressDots: { flexDirection: 'row', gap: 6 },
  progressDot: { flex: 1, height: 8, borderRadius: 4 },
  listRow: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.surfaceContainer, marginTop: 8 },
  infoBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  metric: { flex: 1, padding: 8, borderRadius: 16, backgroundColor: Colors.surfaceContainerLow },
  chart: { height: 112, borderRadius: 16, backgroundColor: Colors.surfaceContainerLow, padding: 8, justifyContent: 'center' },
  bar: { height: 8, borderRadius: 4, backgroundColor: Colors.surfaceContainerHigh, overflow: 'hidden', marginTop: 16 },
  barFill: { height: '100%', borderRadius: 4, backgroundColor: Colors.secondary },
  sleepPill: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, borderRadius: 12, backgroundColor: Colors.surfaceContainerLow },
  sleepIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.secondaryFixed, alignItems: 'center', justifyContent: 'center' },
  docImg: { width: 48, height: 48, borderRadius: 24 },
  pdfBtn: {
    minHeight: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  chip: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerLowest,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...Shadow.sm,
  },
});
