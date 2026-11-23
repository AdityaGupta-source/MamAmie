import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/theme';
import { T, Icon } from '../../components/ui';
import { STAGES, DIETS, REMINDERS, CARE_STATUSES } from '../../models/onboarding';
import { pregnancyStatus, postpartumStatus, TRIMESTER_NAMES } from '../../services/pregnancyDating';
import { formatDayKey, toDayKey } from '../../services/dayKey';
import { StepIntro, SectionCard } from './StepLayout';

const list = (arr) => (arr && arr.length ? arr.join(', ') : 'Not shared');

function journeyLine(d) {
  if (d.stage === 'pregnant') {
    const p = pregnancyStatus(d);
    if (!p) return 'Pregnant · dates to be added';
    return `Week ${p.week} · ${TRIMESTER_NAMES[p.trimester]} · ${p.isEstimated ? 'est. ' : ''}due ${formatDayKey(p.dueDate, { short: true })}`;
  }
  if (d.stage === 'postpartum') {
    const pp = postpartumStatus(d);
    return pp ? `Postpartum · week ${pp.week} since birth` : 'Postpartum';
  }
  return d.trackCycle ? 'Planning · cycle tracking on' : 'Planning a pregnancy';
}

export default function SummaryStep({ draft, set, goTo }) {
  const rows = [
    { step: 'about', icon: 'person-outline', label: 'You', value: draft.displayName ? draft.displayName : 'Name not added' },
    { step: 'journey', icon: STAGES.find((s) => s.key === draft.stage)?.icon || 'favorite', label: 'Journey', value: journeyLine(draft) },
    { step: 'journey', icon: 'medical-services', label: 'Care', value: CARE_STATUSES.find((c) => c.key === draft.clinicalCareStatus)?.title },
    { step: 'health', icon: 'monitor-heart', label: 'Health', value: list([...draft.medicalConditions, ...draft.allergies.filter((a) => a !== 'None').map((a) => `allergy: ${a}`)]) },
    { step: 'health', icon: 'medication', label: 'Supplements', value: list(draft.medicationsAndSupplements) },
    { step: 'lifestyle', icon: 'restaurant', label: 'Diet', value: DIETS.find((x) => x.key === draft.dietaryPreference)?.title || 'Not chosen' },
    { step: 'lifestyle', icon: 'spa', label: 'Habits', value: list(draft.lifestyleTrackingPriorities) },
    { step: 'reminders', icon: 'notifications-active', label: 'Reminders', value: list(REMINDERS.filter((r) => draft.selectedReminders.includes(r.key)).map((r) => r.title)) },
  ];
  const agreed = !!draft.privacyAcknowledgedAt;

  return (
    <View style={{ gap: 20 }}>
      <StepIntro eyebrow="REVIEW" title="Here’s your MamAmie" body="Tap any row to change it." />

      <SectionCard>
        {rows.map((r, i) => (
          <TouchableOpacity key={`${r.label}${i}`} style={styles.row} onPress={() => goTo(r.step)} activeOpacity={0.8}>
            <View style={styles.rowIcon}><Icon name={r.icon} size={18} color={Colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <T v="labelSm" color={Colors.onSurfaceVariant}>{r.label}</T>
              <T v="labelLg" numberOfLines={2}>{r.value}</T>
            </View>
            <Icon name="edit" size={16} color={Colors.outline} />
          </TouchableOpacity>
        ))}
      </SectionCard>

      <TouchableOpacity
        style={[styles.consent, agreed && { backgroundColor: 'rgba(216,229,183,0.6)' }]}
        onPress={() => set({ privacyAcknowledgedAt: agreed ? null : toDayKey() })}
        activeOpacity={0.85}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: agreed }}
      >
        <View style={[styles.box, agreed && styles.boxOn]}>{agreed && <Icon name="check" size={16} color={Colors.onPrimary} />}</View>
        <View style={{ flex: 1 }}>
          <T v="labelLg">I understand how MamAmie uses my data</T>
          <T v="bodySm" color={Colors.onSurfaceVariant}>
            Answers stay on this device. MamAmie offers general wellness information, not diagnosis or treatment — always follow your care team, and call 112 in an emergency.
          </T>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  rowIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryFixed, alignItems: 'center', justifyContent: 'center' },
  consent: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: 16, backgroundColor: Colors.surfaceContainerLow, alignItems: 'flex-start' },
  box: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: Colors.outline, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  boxOn: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
});

