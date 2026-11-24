import React from 'react';
import { View } from 'react-native';
import { ChoiceCard, ChipGroup, FieldLabel, TextField } from '../../components/forms';
import { DIETS, MEAL_TRACKING, LIFESTYLE_OPTIONS, toggleChip } from '../../models/onboarding';
import { StepIntro, SectionCard } from './StepLayout';

export default function LifestyleStep({ draft, set }) {
  return (
    <View style={{ gap: 20 }}>
      <StepIntro eyebrow="NUTRITION & LIFESTYLE" title="How do you like to eat?" body="Food suggestions will always respect your diet." />

      <View style={{ gap: 10 }}>
        {DIETS.map((d, i) => (
          <ChoiceCard
            key={d.key}
            title={d.title}
            subtitle={d.subtitle}
            icon={d.icon}
            tone={i % 2 ? 'primary' : 'secondary'}
            selected={draft.dietaryPreference === d.key}
            onPress={() => set({ dietaryPreference: d.key })}
          />
        ))}
      </View>

      <SectionCard>
        <TextField optional label="Foods you avoid" value={draft.dietaryRestrictionsNotes} onChangeText={(t) => set({ dietaryRestrictionsNotes: t })} placeholder="e.g. no onion & garlic, no seafood" />
        <View>
          <FieldLabel>How would you like to log meals?</FieldLabel>
          <ChipGroup single options={MEAL_TRACKING} value={draft.mealTrackingPreference} onToggle={(k) => set({ mealTrackingPreference: k })} />
        </View>
      </SectionCard>

      <SectionCard title="Habits to support" subtitle="We’ll add these to your daily care routine." icon="spa">
        <ChipGroup options={LIFESTYLE_OPTIONS} value={draft.lifestyleTrackingPriorities} onToggle={(k) => set({ lifestyleTrackingPriorities: toggleChip(draft.lifestyleTrackingPriorities, k) })} />
      </SectionCard>
    </View>
  );
}
