import React from 'react';
import { View } from 'react-native';
import { ChipGroup, CountStepper, FieldLabel, TextField } from '../../components/forms';
import { MULTIPLE_TYPES, COMPLICATION_CHIPS, toggleChip } from '../../models/onboarding';
import { StepIntro, SectionCard } from './StepLayout';

const FIRST = [
  { key: 'yes', title: 'Yes, my first' },
  { key: 'no', title: 'No' },
  { key: 'skip', title: 'Prefer not to say' },
];

export default function HistoryStep({ draft, set }) {
  const firstKey = draft.isFirstPregnancy === true ? 'yes' : draft.isFirstPregnancy === false ? 'no' : 'skip';
  return (
    <View style={{ gap: 20 }}>
      <StepIntro eyebrow="PREGNANCY HISTORY" title="A little background" body="Helps us show the right checkups. Skip anything you’d rather not share." />

      <SectionCard>
        <View>
          <FieldLabel>Is this your first pregnancy?</FieldLabel>
          <ChipGroup
            single
            options={FIRST}
            value={firstKey}
            onToggle={(k) => set({ isFirstPregnancy: k === 'yes' ? true : k === 'no' ? false : null })}
          />
        </View>
        {draft.isFirstPregnancy === false && (
          <>
            <CountStepper label="Total pregnancies" value={draft.totalPregnancies} onChange={(v) => set({ totalPregnancies: v })} min={1} />
            <CountStepper label="Previous births" value={draft.previousBirths} onChange={(v) => set({ previousBirths: v })} />
          </>
        )}
        {draft.stage === 'pregnant' && (
          <View>
            <FieldLabel>How many babies?</FieldLabel>
            <ChipGroup single options={MULTIPLE_TYPES} value={draft.multiplePregnancyType} onToggle={(k) => set({ multiplePregnancyType: k })} />
          </View>
        )}
      </SectionCard>

      <SectionCard title="Past complications" subtitle="Optional — select any that apply." icon="medical-services">
        <ChipGroup options={COMPLICATION_CHIPS} value={draft.previousComplications} onToggle={(k) => set({ previousComplications: toggleChip(draft.previousComplications, k) })} />
        <TextField optional label="Anything else your care team mentioned" multiline value={draft.previousComplicationsNotes} onChangeText={(t) => set({ previousComplicationsNotes: t })} placeholder="Write freely…" />
      </SectionCard>
    </View>
  );
}
