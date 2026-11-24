import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Colors } from '../../constants/theme';
import { T, Icon, Logo } from '../../components/ui';
import { PrimaryButton, SecondaryButton } from '../../components/forms';
import { useOnboarding } from '../../stores/onboardingStore';
import { emptyDraft } from '../../models/onboarding';
import { validateStep } from './validation';
import WelcomeStep from './WelcomeStep';
import AboutStep from './AboutStep';
import JourneyStep from './JourneyStep';
import HistoryStep from './HistoryStep';
import HealthStep from './HealthStep';
import LifestyleStep from './LifestyleStep';
import ConnectedStep from './ConnectedStep';
import RemindersStep from './RemindersStep';
import SummaryStep from './SummaryStep';

const DRAFT_KEY = '@mamamie_onboarding_draft';

const STEPS = [
  { key: 'about', Comp: AboutStep },
  { key: 'journey', Comp: JourneyStep },
  { key: 'history', Comp: HistoryStep },
  { key: 'health', Comp: HealthStep },
  { key: 'lifestyle', Comp: LifestyleStep },
  { key: 'connected', Comp: ConnectedStep },
  { key: 'reminders', Comp: RemindersStep },
  { key: 'summary', Comp: SummaryStep },
];
const COUNTED = STEPS.length - 1; // summary isn't numbered

// mode "first": welcome screen first, saves draft across launches.
// mode "edit": starts at About with the saved profile, can be closed.
export default function OnboardingFlow({ mode = 'first', onDone }) {
  const { profile, complete } = useOnboarding();
  const editing = mode === 'edit';
  const [draft, setDraft] = useState(() => (editing && profile ? { ...emptyDraft(), ...profile } : emptyDraft()));
  const [index, setIndex] = useState(editing ? 0 : -1); // -1 = welcome
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const restored = useRef(editing);
  const scrollRef = useRef(null);

  // Restore an unfinished first-run draft.
  useEffect(() => {
    if (editing) return;
    AsyncStorage.getItem(DRAFT_KEY)
      .then((raw) => {
        if (raw) {
          const saved = JSON.parse(raw);
          setDraft({ ...emptyDraft(), ...saved.draft });
          if (typeof saved.index === 'number') setIndex(saved.index);
        }
      })
      .catch(() => {})
      .finally(() => {
        restored.current = true;
      });
  }, [editing]);

  useEffect(() => {
    if (editing || !restored.current) return;
    AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ draft, index })).catch(() => {});
  }, [draft, index, editing]);

  const set = (patch) => {
    setError(null);
    setDraft((d) => ({ ...d, ...patch }));
  };

  const goIndex = (i) => {
    setError(null);
    setIndex(i);
    scrollRef.current?.scrollTo?.({ y: 0, animated: false });
  };
  const goTo = (key) => goIndex(STEPS.findIndex((s) => s.key === key));

  const next = async () => {
    const step = STEPS[index];
    const msg = validateStep(step.key, draft);
    if (msg) {
      setError(msg);
      return;
    }
    if (index < STEPS.length - 1) {
      goIndex(index + 1);
      return;
    }
    setSaving(true);
    await complete(draft);
    if (!editing) await AsyncStorage.removeItem(DRAFT_KEY).catch(() => {});
    setSaving(false);
    onDone?.();
  };

  const back = () => {
    if (index === 0) {
      if (editing) onDone?.();
      else goIndex(-1);
      return;
    }
    goIndex(index - 1);
  };

  if (index === -1) {
    return (
      <View style={styles.root}>
        <View style={[styles.header, { justifyContent: 'center' }]}>
          <Logo size={28} />
          <T v="headlineSm">MamAmie</T>
        </View>
        <WelcomeStep onBegin={() => goIndex(0)} onSignIn={mode === 'edit' ? undefined : () => router.push('/auth')} />
      </View>
    );
  }

  const { key, Comp } = STEPS[index];
  const isSummary = key === 'summary';

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={back} style={styles.headerBtn} accessibilityLabel="Back">
          <Icon name="arrow-back-ios-new" size={20} color={Colors.primary} />
        </TouchableOpacity>
        <Logo size={28} />
        <T v="headlineSm" style={{ flex: 1 }}>{editing ? 'Edit your profile' : 'Set up MamAmie'}</T>
        {editing && (
          <TouchableOpacity onPress={onDone} style={styles.headerBtn} accessibilityLabel="Close without saving">
            <Icon name="close" size={22} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.stepRow}>
        <T v="labelSm" color={Colors.primary} style={{ letterSpacing: 1, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{editing ? 'EDIT PROFILE' : 'ONBOARDING STEP'}</T>
        <View style={styles.stepPill}>
          <T v="labelMd">{isSummary ? 'Review' : `${index + 1} of ${COUNTED}`}</T>
        </View>
      </View>
      <View style={styles.progress}>
        {Array.from({ length: COUNTED }).map((_, i) => (
          <View key={i} style={[styles.seg, { backgroundColor: i <= index ? Colors.primary : Colors.surfaceContainerHigh }]} />
        ))}
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Comp draft={draft} set={set} goTo={goTo} />
      </ScrollView>

      <View style={styles.footer}>
        {error ? (
          <View style={styles.error}>
            <Icon name="info-outline" size={18} color={Colors.onErrorContainer} />
            <T v="bodySm" color={Colors.onErrorContainer} style={{ flex: 1 }}>{error}</T>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <SecondaryButton label="Back" onPress={back} style={{ flex: 1 }} />
          <PrimaryButton
            label={isSummary ? (editing ? 'Save changes' : 'Start my journey') : 'Continue'}
            icon={isSummary ? 'favorite' : 'arrow-forward'}
            onPress={next}
            disabled={saving}
            style={{ flex: 2 }}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  headerBtn: { minWidth: 32, minHeight: 40, justifyContent: 'center' },
  progress: { flexDirection: 'row', gap: 4, paddingHorizontal: 20, paddingBottom: 8 },
  seg: { flex: 1, height: 6, borderRadius: 3 },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 8 },
  stepPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, backgroundColor: Colors.surfaceContainerHigh },
  scroll: { padding: 20, paddingTop: 12, paddingBottom: 32 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 10,
    backgroundColor: 'rgba(247,249,255,0.96)',
    shadowColor: '#0f1d29',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 8,
  },
  error: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 12, backgroundColor: Colors.errorContainer },
});
