import React from 'react';
import { View } from 'react-native';
import { ChipGroup, TextField } from '../../components/forms';
import { CONDITION_CHIPS, ALLERGY_CHIPS, MEDICATION_CHIPS, toggleChip } from '../../models/onboarding';
import { StepIntro, SectionCard, InfoPill } from './StepLayout';

export default function HealthStep({ draft, set }) {
  return (
    <View style={{ gap: 20 }}>
      <StepIntro eyebrow="YOUR HEALTH" title="Anything we should keep in mind?" body="Used only to personalise tips and food suggestions. MamAmie never changes your treatment." />

      <SectionCard title="Health conditions" icon="monitor-heart">
        <ChipGroup options={CONDITION_CHIPS} value={draft.medicalConditions} onToggle={(k) => set({ medicalConditions: toggleChip(draft.medicalConditions, k) })} />
        <TextField optional label="Other conditions" value={draft.medicalConditionsNotes} onChangeText={(t) => set({ medicalConditionsNotes: t })} placeholder="e.g. anaemia, migraines" />
      </SectionCard>

      <SectionCard title="Allergies" icon="healing">
        <ChipGroup options={ALLERGY_CHIPS} value={draft.allergies} onToggle={(k) => set({ allergies: toggleChip(draft.allergies, k) })} />
        <TextField optional label="Other allergies" value={draft.allergiesNotes} onChangeText={(t) => set({ allergiesNotes: t })} placeholder="Foods, medicines…" />
      </SectionCard>

      <SectionCard title="Medicines & supplements" icon="medication">
        <ChipGroup options={MEDICATION_CHIPS} value={draft.medicationsAndSupplements} onToggle={(k) => set({ medicationsAndSupplements: toggleChip(draft.medicationsAndSupplements, k) })} />
        <TextField optional multiline label="Instructions from your clinician" value={draft.clinicalInstructions} onChangeText={(t) => set({ clinicalInstructions: t })} placeholder="e.g. rest more, avoid heavy lifting" />
      </SectionCard>

      <InfoPill icon="lock-outline" text="These answers stay on this phone. They are never shared without your permission." />
    </View>
  );
}
