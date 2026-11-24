import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Image, Modal, Pressable } from 'react-native';
import { Colors, Fonts, Radius, Shadow } from '../../constants/theme';
import { T, Icon, Pill } from '../../components/ui';
import { PrimaryButton, SecondaryButton } from '../../components/forms';
import { useOnboarding } from '../../stores/onboardingStore';
import { useHydration } from '../../stores/hydrationStore';
import { useJournal } from '../../stores/journalStore';
import { useSessions } from '../../stores/sessionsStore';
import { STAGES, DIETS, REMINDERS, CARE_STATUSES, MULTIPLE_TYPES } from '../../models/onboarding';
import { pregnancyStatus, postpartumStatus, TRIMESTER_NAMES, ageFromDob } from '../../services/pregnancyDating';
import { formatDayKey } from '../../services/dayKey';
import CloudBackupCard from '../auth/CloudBackupCard';
import { useAuth } from '../../stores/authStore';

const avatar = require('../../../assets/images/profile.jpg');

const joinOr = (arr, fallback = 'Not shared') => {
  const v = (arr || []).filter((x) => x && x !== 'None');
  return v.length ? v.join(', ') : fallback;
};

function Row({ icon, label, value }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}><Icon name={icon} size={18} color={Colors.primary} /></View>
      <View style={{ flex: 1 }}>
        <T v="labelSm" color={Colors.onSurfaceVariant}>{label}</T>
        <T v="labelLg">{value}</T>
      </View>
    </View>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.card}>
      <T v="headlineSm" style={{ marginBottom: 4 }}>{title}</T>
      {children}
    </View>
  );
}

export default function ProfileScreen({ onEdit, onCleared }) {
  const { profile, resetAll } = useOnboarding();
  const hydration = useHydration();
  const journal = useJournal();
  const sessions = useSessions();
  const auth = useAuth();
  const [confirm, setConfirm] = useState(false);
  if (!profile) return null;

  const stage = STAGES.find((s) => s.key === profile.stage);
  const preg = pregnancyStatus(profile);
  const post = postpartumStatus(profile);
  const age = ageFromDob(profile.dateOfBirth);

  let journey = stage?.title || 'Not set';
  if (preg) journey = `Week ${preg.week}, day ${preg.day} · ${TRIMESTER_NAMES[preg.trimester]}`;
  else if (profile.stage === 'pregnant') journey = 'Pregnant · dates not added';
  else if (post) journey = `${post.week} weeks postpartum`;

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Image source={avatar} style={styles.avatar} />
        <View style={{ flex: 1, gap: 4 }}>
          <T v="headlineLg">{profile.displayName || 'Mama'}</T>
          <T v="bodySm" color={Colors.onSurfaceVariant}>
            {[age != null ? `${age} years` : null, profile.country, profile.preferredLanguage].filter(Boolean).join(' · ')}
          </T>
          <Pill label={stage?.title || 'Journey'} icon={stage?.icon} bg={Colors.primaryFixed} color={Colors.primary} />
        </View>
      </View>

      <Section title="Journey">
        <Row icon="favorite" label="Where you are" value={journey} />
        {preg && <Row icon="event" label={preg.isEstimated ? 'Estimated due date' : 'Due date'} value={formatDayKey(preg.dueDate)} />}
        {profile.stage === 'postpartum' && <Row icon="child-friendly" label="Baby’s birth date" value={profile.childbirthDate ? formatDayKey(profile.childbirthDate) : 'Not added'} />}
        {profile.stage === 'pregnant' && <Row icon="groups" label="Babies" value={MULTIPLE_TYPES.find((m) => m.key === profile.multiplePregnancyType)?.title || '—'} />}
        <Row icon="medical-services" label="Care" value={CARE_STATUSES.find((c) => c.key === profile.clinicalCareStatus)?.title || '—'} />
      </Section>

      <Section title="Health">
        <Row icon="monitor-heart" label="Conditions" value={joinOr([...profile.medicalConditions, profile.medicalConditionsNotes])} />
        <Row icon="healing" label="Allergies" value={joinOr([...profile.allergies, profile.allergiesNotes])} />
        <Row icon="medication" label="Medicines & supplements" value={joinOr(profile.medicationsAndSupplements)} />
      </Section>

      <Section title="Nutrition & habits">
        <Row icon="restaurant" label="Diet" value={DIETS.find((d) => d.key === profile.dietaryPreference)?.title || 'Not chosen'} />
        <Row icon="spa" label="Habits" value={joinOr(profile.lifestyleTrackingPriorities, 'None selected')} />
        <Row icon="notifications-active" label="Reminders" value={joinOr(REMINDERS.filter((r) => profile.selectedReminders.includes(r.key)).map((r) => r.title), 'Off')} />
      </Section>

      <CloudBackupCard />

      <View style={styles.privacy}>
        <Icon name="lock-outline" size={18} color={Colors.onSecondaryContainer} />
        <T v="bodySm" color={Colors.onSecondaryContainer} style={{ flex: 1, fontFamily: Fonts.medium }}>
          {auth.isSignedIn ? 'Your profile is stored on this device and backed up to your account. ' : 'Your profile is stored only on this device. '}Set up on {formatDayKey(profile.completedAt, { short: true })}.
        </T>
      </View>

      <PrimaryButton label="Edit my answers" icon="edit" onPress={onEdit} />
      <SecondaryButton label="Clear all MamAmie data" icon="delete-outline" onPress={() => setConfirm(true)} />

      <Modal visible={confirm} transparent animationType="fade" onRequestClose={() => setConfirm(false)}>
        <Pressable style={styles.overlay} onPress={() => setConfirm(false)}>
          <Pressable style={styles.sheet}>
            <View style={styles.warnIcon}><Icon name="delete-outline" size={26} color={Colors.error} /></View>
            <T v="headlineMd" style={{ textAlign: 'center' }}>Clear everything?</T>
            <T v="bodySm" color={Colors.onSurfaceVariant} style={{ textAlign: 'center', marginTop: 4, marginBottom: 16 }}>
              This permanently removes your profile, logs and notes from this device and signs you out. A cloud backup, if you have one, is kept until you delete your account. It can’t be undone.
            </T>
            <PrimaryButton
              label="Yes, clear my data"
              style={{ backgroundColor: Colors.error, shadowColor: Colors.error }}
              onPress={async () => {
                setConfirm(false);
                // Sign out first: otherwise sync would treat the wiped data as deletions or restore it.
                if (auth.isSignedIn) await auth.signOut();
                hydration.reset();
                journal.reset();
                sessions.reset();
                await resetAll();
                onCleared?.();
              }}
            />
            <SecondaryButton label="Keep my data" onPress={() => setConfirm(false)} style={{ marginTop: 8 }} />
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingTop: 12, paddingBottom: 40, gap: 16 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, borderRadius: Radius.lg, backgroundColor: Colors.surfaceContainerLowest, ...Shadow.card },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  card: { padding: 20, borderRadius: 24, backgroundColor: Colors.surfaceContainerLowest, gap: 12, ...Shadow.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryFixed, alignItems: 'center', justifyContent: 'center' },
  privacy: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 16, backgroundColor: 'rgba(216,229,183,0.6)' },
  overlay: { flex: 1, backgroundColor: 'rgba(15,29,41,0.4)', justifyContent: 'center', padding: 24 },
  sheet: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.lg, padding: 24 },
  warnIcon: { alignSelf: 'center', width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.errorContainer, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
});
