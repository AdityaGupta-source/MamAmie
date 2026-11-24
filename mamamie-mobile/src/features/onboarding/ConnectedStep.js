import React from 'react';
import { View } from 'react-native';
import { ChipGroup } from '../../components/forms';
import { DEVICE_OPTIONS, METRIC_OPTIONS, toggleChip } from '../../models/onboarding';
import { StepIntro, SectionCard, InfoPill } from './StepLayout';

export default function ConnectedStep({ draft, set }) {
  return (
    <View style={{ gap: 20 }}>
      <StepIntro eyebrow="CONNECTED HEALTH" title="Do you use any health devices?" body="Tell us what you have — syncing comes later, and only with your permission." />

      <SectionCard title="Devices" icon="watch">
        <ChipGroup options={DEVICE_OPTIONS} value={draft.connectedDevices} onToggle={(k) => set({ connectedDevices: toggleChip(draft.connectedDevices, k) })} />
      </SectionCard>

      <SectionCard title="What would you like to follow?" icon="insights">
        <ChipGroup options={METRIC_OPTIONS} value={draft.measurementsOfInterest} onToggle={(k) => set({ measurementsOfInterest: toggleChip(draft.measurementsOfInterest, k) })} />
      </SectionCard>

      <InfoPill
        icon="info-outline"
        tone="primary"
        text="Wearables track your heart rate, not your baby’s, and can’t diagnose conditions like pre-eclampsia."
      />
    </View>
  );
}
