import React from 'react';
import { View } from 'react-native';
import { TextField, DateField, ChipGroup, FieldLabel } from '../../components/forms';
import { StepIntro, SectionCard } from './StepLayout';
import { dateLimits } from './validation';

const LANGUAGES = ['English', 'Hindi', 'Bengali', 'Tamil', 'Telugu', 'Marathi'];

export default function AboutStep({ draft, set }) {
  const lim = dateLimits();
  return (
    <View style={{ gap: 20 }}>
      <StepIntro eyebrow="ABOUT YOU" title="Let’s get to know you" body="So MamAmie can greet you by name and speak your language. Everything here is optional." />
      <SectionCard>
        <TextField label="What should we call you?" optional icon="person-outline" value={draft.displayName} onChangeText={(t) => set({ displayName: t })} placeholder="Your first name" />
        <DateField label="Date of birth" optional value={draft.dateOfBirth} onChange={(k) => set({ dateOfBirth: k })} minKey={lim.dob.min} maxKey={lim.dob.max} />
        <TextField label="Country" optional icon="public" value={draft.country} onChangeText={(t) => set({ country: t })} placeholder="Country" />
        <View>
          <FieldLabel>Preferred language</FieldLabel>
          <ChipGroup single options={LANGUAGES} value={draft.preferredLanguage} onToggle={(k) => set({ preferredLanguage: k })} />
        </View>
      </SectionCard>
    </View>
  );
}
