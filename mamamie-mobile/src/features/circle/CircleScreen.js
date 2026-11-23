import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, TextInput, Linking, Pressable } from 'react-native';
import { Colors, Fonts, Radius } from '../../constants/theme';
import { usePersistentState } from '../../stores/usePersistentState';
import { Icon, T, Pill } from '../../components/ui';

const cardShadow = {
  shadowColor: '#2d3a47',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.06,
  shadowRadius: 20,
  elevation: 2,
};

const LOCHIA = [
  { key: 'Rubra', color: Colors.primary },
  { key: 'Serosa', color: Colors.primaryFixedDim },
  { key: 'Alba', color: Colors.secondaryFixed },
  { key: 'Spotting', color: Colors.surfaceContainerHigh },
];

const MOODS = [
  { key: 'Heavy & Quiet', color: Colors.tertiaryFixedDim },
  { key: 'Numb or Distant', color: Colors.secondaryFixed },
  { key: 'Tender Waves', color: Colors.surfaceVariant },
  { key: 'Gentle Glimmers', color: Colors.primaryFixedDim },
];

const comfortLabel = (v) => (v <= 2 ? 'Calm' : v <= 4 ? 'Mild Soreness' : v <= 7 ? 'Moderate' : 'Contact Doula/OB');

const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function CircleScreen({ amber, setAmber }) {
  const [mode, setMode] = usePersistentState('care_mode', 'postpartum');

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.segment}>
        {[
          { key: 'postpartum', label: 'Postpartum Healing', icon: 'spa' },
          { key: 'loss', label: 'Quiet Loss Support', icon: 'self-improvement' },
        ].map((t) => {
          const active = mode === t.key;
          return (
            <TouchableOpacity key={t.key} style={[styles.segBtn, active && styles.segBtnActive]} onPress={() => setMode(t.key)} activeOpacity={0.85}>
              <Icon name={t.icon} size={18} color={active ? Colors.primary : Colors.onSurfaceVariant} />
              <T v="labelMd" color={active ? Colors.primary : Colors.onSurfaceVariant} numberOfLines={1}>{t.label}</T>
            </TouchableOpacity>
          );
        })}
      </View>

      {mode === 'postpartum' ? <Postpartum amber={amber} setAmber={setAmber} /> : <LossSupport />}
    </ScrollView>
  );
}

function Postpartum({ amber, setAmber }) {
  const [feed, setFeed] = usePersistentState('feeding', { left: 860, right: 725, bottle: 90, active: 'left', runningSince: null });
  const [diapers, setDiapers] = usePersistentState('diapers', { wet: 5, dirty: 3 });
  const [lochia, setLochia] = usePersistentState('lochia', 'Serosa');
  const [comfort, setComfort] = usePersistentState('comfort', 3);
  const [, tick] = useState(0);

  useEffect(() => {
    if (!feed.runningSince) return;
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [feed.runningSince]);

  const liveSecs = (side) =>
    feed[side] + (feed.runningSince && feed.active === side ? Math.floor((Date.now() - feed.runningSince) / 1000) : 0);

  const stopRunning = (f) =>
    f.runningSince ? { ...f, [f.active]: f[f.active] + Math.floor((Date.now() - f.runningSince) / 1000), runningSince: null } : f;

  const toggleTimer = () =>
    setFeed((f) => (f.runningSince ? stopRunning(f) : f.active === 'bottle' ? { ...f, bottle: f.bottle + 30 } : { ...f, runningSince: Date.now() }));

  const pick = (side) => setFeed((f) => ({ ...stopRunning(f), active: side }));

  const sideLabel = feed.active === 'left' ? 'Left' : 'Right';
  const actionLabel =
    feed.active === 'bottle'
      ? 'Log +30 ml Bottle'
      : feed.runningSince
        ? `Pause ${sideLabel} Session`
        : `Resume ${sideLabel} Session`;

  const FeedBtn = ({ side, title, value, status, statusIcon }) => {
    const active = feed.active === side;
    return (
      <TouchableOpacity style={[styles.feedBtn, active && { backgroundColor: Colors.primaryFixed }]} onPress={() => pick(side)} activeOpacity={0.85}>
        <T v="labelMd" color={active ? Colors.onPrimaryFixed : Colors.onSurface} style={{ fontFamily: Fonts.medium }}>{title}</T>
        <T v="headlineMd" color={active ? Colors.onPrimaryFixed : Colors.onSurface} style={{ marginTop: 2 }}>{value}</T>
        <View style={[styles.row4, { marginTop: 4 }]}>
          <Icon name={statusIcon} size={13} color={active ? Colors.onPrimaryFixed : Colors.onSurfaceVariant} />
          <T v="labelSm" color={active ? Colors.onPrimaryFixed : Colors.onSurfaceVariant}>{status}</T>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ gap: 24 }}>
      {/* Hero */}
      <View style={styles.card}>
        <View style={[styles.rowBetween, { alignItems: 'flex-start' }]}>
          <View style={{ flex: 1, gap: 4 }}>
            <Pill label="Day 18 • Fourth Trimester" dot={Colors.secondary} bg={Colors.secondaryContainer} color={Colors.onSecondaryContainer} />
            <T v="headlineLg" style={{ paddingTop: 4 }}>Gentle Restoration</T>
            <T v="bodySm" color={Colors.onSurfaceVariant}>Your uterus is contracting to pre-pregnancy size. Prioritize restorative rest today.</T>
          </View>
          <TouchableOpacity
            style={[styles.amberBtn, amber && { backgroundColor: '#ffe2b8' }]}
            onPress={() => setAmber(!amber)}
            accessibilityLabel="Amber night feed glow"
          >
            <Icon name="nightlight" size={22} color={Colors.tertiary} />
            <T v="labelSm" color={Colors.onSurfaceVariant} style={{ fontSize: 9, fontFamily: Fonts.semibold }}>2200K</T>
          </TouchableOpacity>
        </View>
        <View style={styles.checkpoint}>
          <Icon name="verified" size={18} color={Colors.secondary} />
          <T v="labelSm" color={Colors.onSurfaceVariant} style={{ flex: 1 }}>Clinical Checkpoint: Pelvic resting window ongoing (Week 3/6)</T>
        </View>
      </View>

      {/* Feeding */}
      <View style={[styles.card, { gap: 16 }]}>
        <View style={styles.rowBetween}>
          <View style={styles.row8}>
            <Icon name="baby-changing-station" size={22} color={Colors.primary} />
            <T v="headlineSm">Feeding Tracker</T>
          </View>
          <Pill label="Last: 1h 45m ago" bg="rgba(216,229,183,0.6)" color={Colors.secondary} />
        </View>
        <View style={styles.row8}>
          <FeedBtn
            side="left"
            title="Left Breast"
            value={mmss(liveSecs('left'))}
            status={feed.runningSince && feed.active === 'left' ? 'Running' : feed.active === 'left' ? 'Paused' : 'Logged'}
            statusIcon={feed.runningSince && feed.active === 'left' ? 'timer' : feed.active === 'left' ? 'pause-circle-outline' : 'check'}
          />
          <FeedBtn
            side="right"
            title="Right Breast"
            value={mmss(liveSecs('right'))}
            status={feed.runningSince && feed.active === 'right' ? 'Running' : feed.active === 'right' ? 'Paused' : 'Logged'}
            statusIcon={feed.runningSince && feed.active === 'right' ? 'timer' : feed.active === 'right' ? 'pause-circle-outline' : 'check'}
          />
          <FeedBtn side="bottle" title="Bottle Feed" value={`${feed.bottle} ml`} status="Expressed" statusIcon="tune" />
        </View>
        <View style={styles.row8}>
          <TouchableOpacity style={styles.mainAction} onPress={toggleTimer} activeOpacity={0.85}>
            <Icon name={feed.runningSince ? 'pause' : feed.active === 'bottle' ? 'add' : 'play-arrow'} size={20} color={Colors.onPrimary} />
            <T v="labelLg" color={Colors.onPrimary}>{actionLabel}</T>
          </TouchableOpacity>
          <TouchableOpacity style={styles.noteBtn} accessibilityLabel="Add note">
            <Icon name="edit-note" size={20} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Diapers */}
      <View style={[styles.card, { gap: 12 }]}>
        <View style={styles.rowBetween}>
          <T v="headlineSm">Diaper Log</T>
          <T v="labelSm" color={Colors.onSurfaceVariant}>
            Past 24 Hours: {diapers.wet + diapers.dirty >= 6 ? 'Target met (6+)' : 'Below 6'}
          </T>
        </View>
        <View style={styles.row12}>
          {[
            { key: 'wet', title: 'Wet Diaper', note: 'Pale / Clear', dot: Colors.surfaceVariant, noteColor: Colors.secondary },
            { key: 'dirty', title: 'Dirty Diaper', note: 'Mustard Seed', dot: Colors.secondary, noteColor: Colors.onSecondaryContainer },
          ].map((d) => (
            <View key={d.key} style={styles.diaper}>
              <View style={styles.rowBetween}>
                <View style={styles.row6}>
                  <View style={[styles.dot10, { backgroundColor: d.dot }]} />
                  <T v="labelMd" style={{ fontFamily: Fonts.medium }}>{d.title}</T>
                </View>
              </View>
              <T v="labelSm" color={d.noteColor} style={{ marginTop: 2 }}>{d.note}</T>
              <View style={[styles.rowBetween, { marginTop: 12 }]}>
                <TouchableOpacity
                  style={[styles.counterBtn, { backgroundColor: Colors.surfaceContainer }]}
                  onPress={() => setDiapers((x) => ({ ...x, [d.key]: Math.max(0, x[d.key] - 1) }))}
                  accessibilityLabel={`Remove ${d.title}`}
                >
                  <Icon name="remove" size={18} />
                </TouchableOpacity>
                <T v="headlineLg" style={{ fontFamily: Fonts.semibold }}>{diapers[d.key]}</T>
                <TouchableOpacity
                  style={[styles.counterBtn, { backgroundColor: Colors.secondaryContainer }]}
                  onPress={() => setDiapers((x) => ({ ...x, [d.key]: x[d.key] + 1 }))}
                  accessibilityLabel={`Add ${d.title}`}
                >
                  <Icon name="add" size={18} color={Colors.onSecondaryContainer} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Healing check */}
      <View style={[styles.card, { gap: 16 }]}>
        <View style={styles.rowBetween}>
          <View>
            <T v="headlineSm">Maternal Healing Check</T>
            <T v="labelSm" color={Colors.onSurfaceVariant}>Lochia {lochia} Transition Stage</T>
          </View>
          <Icon name="monitor-heart" size={20} color={Colors.primary} />
        </View>
        <View style={{ gap: 8 }}>
          <T v="labelSm" color={Colors.onSurfaceVariant}>Lochia Discharge Profile</T>
          <View style={styles.row8}>
            {LOCHIA.map((l) => {
              const active = lochia === l.key;
              return (
                <TouchableOpacity key={l.key} style={[styles.lochia, active && { backgroundColor: Colors.primaryFixed }]} onPress={() => setLochia(l.key)} activeOpacity={0.85}>
                  <View style={[styles.dot12, { backgroundColor: l.color, marginBottom: 4 }]} />
                  <T v="labelSm" color={active ? Colors.onPrimaryFixed : Colors.onSurface}>{l.key}</T>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <View style={styles.comfortBox}>
          <View style={styles.rowBetween}>
            <T v="labelMd" style={{ fontFamily: Fonts.medium, flex: 1 }}>Perineal & Abdominal Comfort</T>
            <T v="labelSm" color={comfort >= 8 ? Colors.error : Colors.secondary} style={{ fontFamily: Fonts.semibold }}>
              {comfortLabel(comfort)} ({comfort}/10)
            </T>
          </View>
          <View style={styles.slider}>
            {Array.from({ length: 10 }).map((_, i) => (
              <Pressable key={i} style={styles.sliderHit} onPress={() => setComfort(i + 1)} accessibilityLabel={`Comfort ${i + 1}`}>
                <View style={[styles.sliderSeg, { backgroundColor: i < comfort ? Colors.primary : Colors.surfaceContainer }]} />
                {i + 1 === comfort && <View style={styles.thumb} />}
              </Pressable>
            ))}
          </View>
          <View style={styles.rowBetween}>
            <T v="labelSm" color={Colors.onSurfaceVariant}>Completely Calm</T>
            <T v="labelSm" color={Colors.onSurfaceVariant}>Moderate</T>
            <T v="labelSm" color={Colors.onSurfaceVariant}>Contact Doula/OB</T>
          </View>
        </View>
      </View>
    </View>
  );
}

function LossSupport() {
  const [mood, setMood] = usePersistentState('heart_mood', null);
  const [note, setNote] = usePersistentState('heart_note', '');
  const [playing, setPlaying] = useState(false);

  return (
    <View style={{ gap: 24 }}>
      <View style={styles.card}>
        <View style={{ gap: 6 }}>
          <Pill label="Gentle Sanctuary" icon="favorite" bg={Colors.tertiaryFixed} color={Colors.onTertiaryFixed} />
          <T v="headlineLg">Here with you in quiet space</T>
          <T v="bodyMd" color={Colors.onSurfaceVariant}>
            Take all the time you need. Your body and heart are navigating deep waters, and every feeling is welcome here.
          </T>
        </View>
        <View style={[styles.checkpoint, { padding: 14, borderRadius: 16 }]}>
          <Icon name="cloud-sync" size={20} color={Colors.tertiary} />
          <View style={{ flex: 1 }}>
            <T v="labelMd" style={{ fontFamily: Fonts.medium }}>Trigger Shield Active</T>
            <T v="bodySm" color={Colors.onSurfaceVariant} style={{ fontSize: 12 }}>Pregnancy milestones, infant metrics, & kick counters muted.</T>
          </View>
        </View>
      </View>

      <View style={[styles.card, { gap: 16 }]}>
        <View style={styles.rowBetween}>
          <T v="headlineSm" style={{ flex: 1 }}>How is your heart feeling today?</T>
          <Icon name="self-improvement" size={18} color={Colors.tertiary} />
        </View>
        <View style={styles.moodGrid}>
          {MOODS.map((m) => {
            const active = mood === m.key;
            return (
              <TouchableOpacity key={m.key} style={[styles.mood, active && { backgroundColor: Colors.tertiaryFixed }]} onPress={() => setMood(m.key)} activeOpacity={0.85}>
                <View style={[styles.dot14, { backgroundColor: m.color }]} />
                <T v="labelMd" style={{ fontFamily: Fonts.medium }}>{m.key}</T>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.noteBox}>
          <TextInput
            value={note}
            onChangeText={setNote}
            multiline
            placeholder="Write softly for your eyes only, or leave blank..."
            placeholderTextColor="rgba(83,67,68,0.7)"
            style={styles.input}
          />
          <T v="labelSm" color={Colors.onSurfaceVariant} style={{ alignSelf: 'flex-end' }}>Saved privately on this device</T>
        </View>
      </View>

      <View style={[styles.card, { gap: 14 }]}>
        <View style={styles.rowBetween}>
          <T v="headlineSm">Physical Recovery Compass</T>
          <T v="labelSm" color={Colors.onSurfaceVariant}>Post-Event Day 9</T>
        </View>
        {[
          { icon: 'water-drop', iconColor: Colors.primary, title: 'Bleeding / Spotting', tag: 'Light & Easing', soft: true },
          { icon: 'healing', iconColor: Colors.tertiary, title: 'Cramping Level', tag: 'Mild aches' },
          { icon: 'cyclone', iconColor: Colors.secondary, title: 'Hormone Shift & Sweats', tag: 'Stabilizing', soft: true },
        ].map((r) => (
          <View key={r.title} style={styles.compassRow}>
            <View style={styles.row8}>
              <Icon name={r.icon} size={20} color={r.iconColor} />
              <T v="labelMd" style={{ fontFamily: Fonts.medium }}>{r.title}</T>
            </View>
            <Pill
              label={r.tag}
              bg={r.soft ? 'rgba(216,229,183,0.5)' : Colors.surfaceContainer}
              color={r.soft ? Colors.secondary : Colors.onSurfaceVariant}
            />
          </View>
        ))}
      </View>

      <View style={[styles.card, styles.rowBetween]}>
        <View style={[styles.row12, { flex: 1 }]}>
          <TouchableOpacity style={styles.playBtn} onPress={() => setPlaying((p) => !p)} accessibilityLabel={playing ? 'Pause' : 'Play'}>
            <Icon name={playing ? 'pause' : 'play-arrow'} size={24} color={Colors.onTertiary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <T v="headlineSm">Allowing the Waves</T>
            <T v="labelSm" color={Colors.onSurfaceVariant}>7 min • Somatic Breath & Soft Release</T>
          </View>
        </View>
        <Icon name="graphic-eq" size={20} color={playing ? Colors.tertiary : Colors.onSurfaceVariant} />
      </View>

      <View style={[styles.card, { backgroundColor: Colors.tertiaryFixed, gap: 12 }]}>
        <View>
          <T v="labelMd" color={Colors.onTertiaryFixed} style={{ letterSpacing: 1 }}>DEDICATED CARE NETWORK</T>
          <T v="headlineMd" color={Colors.onTertiaryFixed} style={{ marginTop: 2 }}>Bereavement Counselors</T>
          <T v="bodySm" color={Colors.onTertiaryFixedVariant} style={{ marginTop: 4 }}>
            Certified maternal grief doulas and 24/7 compassionate support lines available without judgment.
          </T>
        </View>
        <View style={styles.row8}>
          <TouchableOpacity style={[styles.netBtn, { backgroundColor: Colors.onTertiary }]} onPress={() => Linking.openURL('tel:18009444773')}>
            <Icon name="phone-in-talk" size={18} color={Colors.tertiary} />
            <T v="labelMd" color={Colors.onTertiaryFixed}>Call 24/7 PSI Warmline</T>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.netBtn, { backgroundColor: Colors.tertiary }]}>
            <Icon name="chat-bubble" size={18} color={Colors.onTertiary} />
            <T v="labelMd" color={Colors.onTertiary}>Message Doula</T>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40, gap: 24 },
  row4: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  row6: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  row8: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  row12: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  dot10: { width: 10, height: 10, borderRadius: 5 },
  dot12: { width: 12, height: 12, borderRadius: 6 },
  dot14: { width: 14, height: 14, borderRadius: 7 },
  segment: {
    flexDirection: 'row',
    padding: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  segBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 6, borderRadius: Radius.full },
  segBtnActive: {
    backgroundColor: Colors.surfaceContainerLowest,
    shadowColor: '#8b4850',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 2,
  },
  card: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.lg, padding: 24, ...cardShadow },
  amberBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  checkpoint: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: Colors.surfaceContainerLow },
  feedBtn: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 16, backgroundColor: Colors.surfaceContainerLow },
  mainAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    shadowColor: '#8b4850',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 5,
  },
  noteBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  diaper: { flex: 1, padding: 14, borderRadius: 16, backgroundColor: Colors.surfaceContainerLow },
  counterBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  lochia: { flex: 1, alignItems: 'center', padding: 10, borderRadius: 12, backgroundColor: Colors.surfaceContainerLow },
  comfortBox: { padding: 14, borderRadius: 16, backgroundColor: Colors.surfaceContainerLow, gap: 10 },
  slider: { flexDirection: 'row', alignItems: 'center', height: 24 },
  sliderHit: { flex: 1, height: 24, justifyContent: 'center' },
  sliderSeg: { height: 8 },
  thumb: {
    position: 'absolute',
    right: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: '#fff',
    zIndex: 2,
  },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  mood: { flexBasis: '45%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16, backgroundColor: Colors.surfaceContainerLow },
  noteBox: { padding: 12, borderRadius: 16, backgroundColor: Colors.surfaceContainerLow, gap: 8 },
  input: { minHeight: 64, fontFamily: Fonts.regular, fontSize: 13, color: Colors.onSurface, textAlignVertical: 'top', outlineStyle: 'none' },
  compassRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 16, backgroundColor: Colors.surfaceContainerLow },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#76525c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  netBtn: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 10, borderRadius: Radius.full },
});
