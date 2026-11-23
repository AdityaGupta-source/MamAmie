import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Modal, Animated } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors, Fonts, Radius, Shadow } from '../constants/theme';
import { usePersistentState } from '../constants/storage';
import { Icon, T, Pill, ProgressRing } from '../components/ui';
import { useOnboarding } from '../stores/onboardingStore';
import { stagePillLabel } from '../services/pregnancyDating';

const PRESETS = [
  { ml: 200, label: 'Small Glass', icon: 'local-cafe', bg: Colors.surfaceContainer, color: Colors.primary, kind: 'water' },
  { ml: 250, label: 'Herbal Tea / Mug', icon: 'emoji-food-beverage', bg: Colors.secondaryContainer, color: Colors.onSecondaryContainer, kind: 'tea' },
  { ml: 500, label: 'Sports Tumbler', icon: 'sports-bar', bg: Colors.surfaceContainer, color: Colors.primary, kind: 'electrolyte' },
  { ml: 750, label: 'Water Bottle', icon: 'water-bottle', bg: Colors.tertiaryFixed, color: Colors.onTertiaryFixed, kind: 'water' },
];

const KINDS = [
  { key: 'water', title: 'Pure Spring Water', sub: 'Base amniotic hydration', color: Colors.primary },
  { key: 'electrolyte', title: 'Coconut Water & Minerals', sub: 'Potassium & sodium recovery', color: Colors.secondary },
  { key: 'tea', title: 'Decaf Red Raspberry Leaf', sub: 'Uterine wall tone support', color: Colors.tertiary },
];

const HOURLY = [
  { h: '7a', pct: 48, color: Colors.surfaceContainer },
  { h: '9a', pct: 75, color: Colors.primaryFixedDim },
  { h: '11a', pct: 92, color: Colors.primary, strong: true },
  { h: '1p', pct: 80, color: Colors.primary },
  { h: '3p', pct: 60, color: Colors.primaryContainer, strong: true },
  { h: '5p', pct: 35, color: Colors.secondaryContainer, now: true },
  { h: '7p', pct: 25, color: Colors.surfaceContainer },
  { h: '9p', pct: 12, color: Colors.surfaceContainer },
];

const TARGETS = [2000, 2500, 3000];
const DEFAULT = { intake: 1750, logs: [], byKind: { water: 1250, electrolyte: 250, tea: 250 } };

export default function HydrationScreen() {
  const { profile } = useOnboarding();
  const [data, setData] = usePersistentState('hydration', DEFAULT);
  const [target, setTarget] = usePersistentState('hydration_target', 2500);
  const [custom, setCustom] = useState(150);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [targetOpen, setTargetOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastAnim = useRef(new Animated.Value(0)).current;

  const byKind = data.byKind || DEFAULT.byKind;
  // Entries saved by the old app version have a different shape; skip them.
  const logs = (data.logs || []).filter((l) => l && l.at && l.ml);
  const pct = Math.round((data.intake / target) * 100);
  const remaining = Math.max(0, target - data.intake);
  const kindTotal = Object.values(byKind).reduce((a, b) => a + b, 0) || 1;

  useEffect(() => {
    if (!toast) return;
    Animated.timing(toastAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const id = setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setToast(null));
    }, 1800);
    return () => clearTimeout(id);
  }, [toast, toastAnim]);

  const log = (ml, label, kind = 'water') => {
    setData((d) => {
      const bk = d.byKind || DEFAULT.byKind;
      return {
        ...d,
        intake: d.intake + ml,
        byKind: { ...bk, [kind]: (bk[kind] || 0) + ml },
        logs: [{ ml, label, at: Date.now() }, ...(d.logs || [])].slice(0, 50),
      };
    });
    setToast(`Logged ${ml} mL!`);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={{ gap: 4 }}>
          <View style={styles.rowBetween}>
            <View style={styles.row4}>
              <View style={styles.badgeIcon}><Icon name="water-drop" size={16} color={Colors.onSecondaryContainer} /></View>
              <T v="labelMd" color={Colors.secondary} style={{ letterSpacing: 1 }}>CLINICAL HYDRATION</T>
            </View>
            <Pill label={stagePillLabel(profile)} dot={Colors.secondary} bg={Colors.surfaceContainerHigh} color={Colors.onSurface} />
          </View>
          <T v="headlineLg">Hydration & Electrolytes</T>
          <T v="bodySm" color={Colors.onSurfaceVariant}>
            Pregnancy target: {target.toLocaleString()} mL / day to support amniotic fluid volume, tissue elasticity & vital maternal circulation.
          </T>
        </View>

        {/* Ring */}
        <View style={[styles.card, { padding: 24, borderRadius: Radius.lg, alignItems: 'center' }]}>
          <View style={[styles.rowBetween, { alignSelf: 'stretch', marginBottom: 8 }]}>
            <T v="labelLg">Daily Pace</T>
            <Pill label={pct >= 60 ? 'Optimal Level' : 'Keep Sipping'} bg="rgba(216,229,183,0.6)" color={Colors.secondary} style={{ paddingVertical: 2, paddingHorizontal: 8 }} />
          </View>
          <View style={styles.ringGlow} />
          <ProgressRing size={224} stroke={14} progress={data.intake / target} color={Colors.primary} track="rgba(220,234,251,0.8)">
            <View style={styles.bubble}>
              <Svg width="144" height="144" viewBox="0 0 144 144" style={StyleSheet.absoluteFill}>
                <Path d={`M0 ${144 - Math.min(1, data.intake / target) * 110} Q 36 ${132 - Math.min(1, data.intake / target) * 110} 72 ${144 - Math.min(1, data.intake / target) * 110} T 144 ${144 - Math.min(1, data.intake / target) * 110} V144 H0 Z`} fill={Colors.primaryFixed} opacity={0.35} />
              </Svg>
              <T v="labelSm" color={Colors.onSurfaceVariant}>Logged Today</T>
              <View style={[styles.baseline, { marginTop: 2 }]}>
                <T v="headlineLg">{data.intake.toLocaleString()}</T>
                <T v="labelSm" color={Colors.outline}>mL</T>
              </View>
              <T v="labelMd" color={Colors.primary} style={{ marginTop: 2 }}>{pct}% Reached</T>
            </View>
          </ProgressRing>
          <View style={[styles.rowBetween, { alignSelf: 'stretch', marginTop: 16 }]}>
            <View style={styles.row6}>
              <Icon name="flag" size={18} color={Colors.primary} />
              <T v="bodySm" color={Colors.onSurfaceVariant}>
                <T v="bodySm" style={{ fontFamily: Fonts.medium }}>{remaining} mL</T> to daily goal
              </T>
            </View>
            <View style={styles.row6}>
              <Icon name="notifications-active" size={18} color={Colors.secondary} />
              <T v="bodySm" color={Colors.onSurfaceVariant}>
                Next in <T v="bodySm" style={{ fontFamily: Fonts.semibold }}>45m</T>
              </T>
            </View>
          </View>
        </View>

        {/* Presets */}
        <View style={{ gap: 8 }}>
          <View style={styles.rowBetween}>
            <T v="headlineSm">Quick Add Preset</T>
            <T v="labelSm" color={Colors.onSurfaceVariant}>Tap to immediately log</T>
          </View>
          <View style={styles.grid}>
            {PRESETS.map((p) => (
              <TouchableOpacity key={p.ml} style={[styles.card, styles.preset]} onPress={() => log(p.ml, p.label, p.kind)} activeOpacity={0.85}>
                <View style={{ flex: 1 }}>
                  <T v="headlineSm">
                    +{p.ml} <T v="labelSm" color={Colors.outline} style={{ fontFamily: Fonts.regular }}>mL</T>
                  </T>
                  <T v="bodySm" color={Colors.onSurfaceVariant} numberOfLines={1}>{p.label}</T>
                </View>
                <View style={[styles.presetIcon, { backgroundColor: p.bg }]}>
                  <Icon name={p.icon} size={20} color={p.color} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <View style={[styles.card, styles.rowBetween, { padding: 16, borderRadius: 16 }]}>
            <View style={{ flex: 1 }}>
              <T v="labelLg">Custom Volume</T>
              <T v="bodySm" color={Colors.onSurfaceVariant}>Fine-tune intake amount</T>
            </View>
            <View style={styles.stepper}>
              <TouchableOpacity style={styles.stepBtn} onPress={() => setCustom((c) => Math.max(50, c - 50))} accessibilityLabel="Decrease">
                <Icon name="remove" size={18} />
              </TouchableOpacity>
              <T v="headlineSm" style={{ width: 64, textAlign: 'center' }}>{custom} mL</T>
              <TouchableOpacity style={styles.stepBtn} onPress={() => setCustom((c) => Math.min(1000, c + 50))} accessibilityLabel="Increase">
                <Icon name="add" size={18} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.logBtn} onPress={() => log(custom, 'Custom')}>
                <T v="labelMd" color={Colors.onPrimary}>Log</T>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Beverage breakdown */}
        <View style={[styles.card, styles.section]}>
          <View style={styles.rowBetween}>
            <View>
              <T v="headlineSm">Beverage Breakdown</T>
              <T v="bodySm" color={Colors.onSurfaceVariant}>Electrolytes & cellular retention</T>
            </View>
            <Pill label="Balanced" icon="check" bg="rgba(219,232,186,0.5)" color={Colors.secondary} />
          </View>
          <View style={styles.segBar}>
            {KINDS.map((k) => (
              <View key={k.key} style={{ width: `${(byKind[k.key] / kindTotal) * 100}%`, backgroundColor: k.color }} />
            ))}
          </View>
          <View style={{ gap: 8 }}>
            {KINDS.map((k) => (
              <View key={k.key} style={styles.kindRow}>
                <View style={[styles.row8, { flex: 1 }]}>
                  <View style={[styles.dot12, { backgroundColor: k.color }]} />
                  <View>
                    <T v="labelLg">{k.title}</T>
                    <T v="bodySm" color={Colors.onSurfaceVariant}>{k.sub}</T>
                  </View>
                </View>
                <T v="headlineSm">
                  {byKind[k.key].toLocaleString()} <T v="labelSm" color={Colors.outline} style={{ fontFamily: Fonts.regular }}>mL</T>
                </T>
              </View>
            ))}
          </View>
        </View>

        {/* Hourly pacing */}
        <View style={[styles.card, styles.section]}>
          <View style={[styles.rowBetween, { alignItems: 'flex-start' }]}>
            <View style={{ flex: 1 }}>
              <T v="headlineSm">Hourly Intake Pacing</T>
              <T v="bodySm" color={Colors.onSurfaceVariant}>Front-loaded to prevent nocturnal waking</T>
            </View>
            <T v="labelSm" color={Colors.onSurfaceVariant} style={{ textAlign: 'right' }}>
              Night Limit: {'\n'}
              <T v="labelSm" color={Colors.secondary} style={{ fontFamily: Fonts.semibold }}>{'< 300 mL'}</T>
            </T>
          </View>
          <View style={styles.bars}>
            {HOURLY.map((b) => (
              <View key={b.h} style={styles.barCol}>
                <View style={{ flex: 1, width: '100%', justifyContent: 'flex-end' }}>
                  <View style={[styles.hourBar, { height: `${b.pct}%`, backgroundColor: b.color }]} />
                </View>
                <T
                  v="labelSm"
                  color={b.now ? Colors.secondary : b.strong ? Colors.onSurface : Colors.outline}
                  style={(b.now || b.strong) && { fontFamily: b.now ? Fonts.bold : Fonts.semibold }}
                >
                  {b.h}
                </T>
              </View>
            ))}
          </View>
          <View style={styles.advice}>
            <Icon name="bedtime" size={18} color={Colors.onSecondaryContainer} />
            <T v="bodySm" color={Colors.onSecondaryContainer} style={{ flex: 1 }}>
              Great pacing today! Drink <T v="bodySm" color={Colors.onSecondaryContainer} style={{ fontFamily: Fonts.semibold }}>600 mL</T> before 6 PM, then taper to small sips for restful unbroken sleep.
            </T>
          </View>
        </View>

        {/* Clinical tip */}
        <View style={[styles.tip]}>
          <View style={styles.tipIcon}><Icon name="verified" size={20} color={Colors.onPrimary} /></View>
          <View style={{ flex: 1, gap: 4 }}>
            <T v="headlineSm">OB-GYN Clinical Verification</T>
            <T v="bodyMd" color={Colors.onSurfaceVariant}>
              "Adequate hydration in Trimester 2 helps mitigate Braxton Hicks contractions and noticeably reduces urinary tract infection risks by sustaining renal clearance."
            </T>
            <T v="labelSm" color={Colors.primary} style={{ marginTop: 4 }}>Dr. Elena Ramos, MD • Maternal-Fetal Medicine</T>
          </View>
        </View>

        {/* Actions */}
        <View style={{ gap: 8, paddingTop: 8 }}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setHistoryOpen(true)} activeOpacity={0.85}>
            <Icon name="history" size={20} color={Colors.onPrimary} />
            <T v="headlineSm" color={Colors.onPrimary}>Log Intake History</T>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setTargetOpen(true)} activeOpacity={0.85}>
            <Icon name="tune" size={18} color={Colors.primary} />
            <T v="labelLg" color={Colors.primary}>Adjust Daily Target ({target.toLocaleString()} mL)</T>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {toast && (
        <Animated.View
          pointerEvents="none"
          style={[styles.toast, { opacity: toastAnim, transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}
        >
          <View style={styles.row8}>
            <Icon name="check-circle" size={20} color={Colors.secondaryFixed} />
            <T v="bodySm" color={Colors.inverseOnSurface} style={{ fontFamily: Fonts.medium }}>{toast}</T>
          </View>
          <T v="labelSm" color={Colors.outlineVariant}>Saved</T>
        </Animated.View>
      )}

      <Sheet visible={historyOpen} onClose={() => setHistoryOpen(false)} title="Today's Intake">
        {logs.length === 0 ? (
          <T v="bodySm" color={Colors.onSurfaceVariant}>No drinks logged yet today. Tap a preset to start.</T>
        ) : (
          logs.slice(0, 12).map((l) => (
            <View key={l.at} style={[styles.rowBetween, styles.histRow]}>
              <View>
                <T v="labelLg">{l.label}</T>
                <T v="bodySm" color={Colors.onSurfaceVariant}>{new Date(l.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</T>
              </View>
              <T v="headlineSm" color={Colors.primary}>+{l.ml} mL</T>
            </View>
          ))
        )}
        <TouchableOpacity
          style={[styles.secondaryBtn, { marginTop: 12 }]}
          onPress={() => {
            setData({ intake: 0, logs: [], byKind: { water: 0, electrolyte: 0, tea: 0 } });
            setHistoryOpen(false);
          }}
        >
          <Icon name="refresh" size={18} color={Colors.primary} />
          <T v="labelLg" color={Colors.primary}>Start a new day</T>
        </TouchableOpacity>
      </Sheet>

      <Sheet visible={targetOpen} onClose={() => setTargetOpen(false)} title="Daily Target">
        {TARGETS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.targetOpt, t === target && { backgroundColor: Colors.primaryFixed }]}
            onPress={() => {
              setTarget(t);
              setTargetOpen(false);
            }}
          >
            <T v="labelLg" color={t === target ? Colors.onPrimaryFixed : Colors.onSurface}>{t.toLocaleString()} mL</T>
            {t === target && <Icon name="check" size={18} color={Colors.primary} />}
          </TouchableOpacity>
        ))}
      </Sheet>
    </View>
  );
}

function Sheet({ visible, onClose, title, children }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          <View style={[styles.rowBetween, { marginBottom: 12 }]}>
            <T v="headlineMd">{title}</T>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close"><Icon name="close" size={22} color={Colors.onSurfaceVariant} /></TouchableOpacity>
          </View>
          {children}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40, gap: 24 },
  row4: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  row6: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  row8: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  baseline: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  badgeIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.secondaryContainer, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: Colors.surfaceContainerLowest, ...Shadow.sm },
  section: { padding: 24, borderRadius: 16, gap: 16 },
  ringGlow: {
    position: 'absolute',
    top: 72,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.surfaceContainerHigh,
    opacity: 0.5,
  },
  bubble: {
    width: 144,
    height: 144,
    borderRadius: 72,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  preset: { flexBasis: '45%', flexGrow: 1, padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center' },
  presetIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6, borderRadius: Radius.full, backgroundColor: Colors.surfaceContainerLow },
  stepBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceContainerLowest, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  logBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: Colors.primary, marginLeft: 2 },
  segBar: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', backgroundColor: Colors.surfaceContainer },
  kindRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, borderRadius: 16, backgroundColor: Colors.surfaceContainerLow },
  dot12: { width: 12, height: 12, borderRadius: 6 },
  bars: { height: 150, flexDirection: 'row', alignItems: 'flex-end', gap: 6, paddingTop: 16, paddingHorizontal: 4 },
  barCol: { flex: 1, height: '100%', alignItems: 'center', gap: 6 },
  hourBar: { width: '100%', borderTopLeftRadius: 999, borderTopRightRadius: 999 },
  advice: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 16, backgroundColor: 'rgba(216,229,183,0.4)' },
  tip: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, padding: 24, borderRadius: 16, backgroundColor: 'rgba(255,218,220,0.3)', ...Shadow.sm },
  tipIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  primaryBtn: {
    minHeight: 52,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadow.primary,
  },
  secondaryBtn: {
    minHeight: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  toast: {
    position: 'absolute',
    bottom: 16,
    left: 20,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Radius.full,
    backgroundColor: Colors.inverseSurface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overlay: { flex: 1, backgroundColor: 'rgba(15,29,41,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surfaceContainerLowest, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 36 },
  histRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.surfaceContainer },
  targetOpt: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, backgroundColor: Colors.surfaceContainerLow, marginBottom: 8 },
});
