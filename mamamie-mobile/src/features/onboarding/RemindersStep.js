import React from 'react';
import { View, Switch } from 'react-native';
import { Colors } from '../../constants/theme';
import { T, Icon } from '../../components/ui';
import { REMINDERS } from '../../models/onboarding';
import { StepIntro, SectionCard, InfoPill } from './StepLayout';

export default function RemindersStep({ draft, set }) {
  const toggle = (key) =>
    set({
      selectedReminders: draft.selectedReminders.includes(key)
        ? draft.selectedReminders.filter((k) => k !== key)
        : [...draft.selectedReminders, key],
    });

  return (
    <View style={{ gap: 20 }}>
      <StepIntro eyebrow="CARE & REMINDERS" title="Which nudges would help?" body="Gentle, private reminders. Nothing sensitive appears on your lock screen." />
      <SectionCard>
        {REMINDERS.map((r) => {
          const on = draft.selectedReminders.includes(r.key);
          return (
            <View key={r.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: on ? Colors.primaryFixed : Colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={r.icon} size={20} color={on ? Colors.primary : Colors.onSurfaceVariant} />
              </View>
              <View style={{ flex: 1 }}>
                <T v="labelLg">{r.title}</T>
                <T v="bodySm" color={Colors.onSurfaceVariant}>{r.subtitle}</T>
              </View>
              <Switch
                value={on}
                onValueChange={() => toggle(r.key)}
                trackColor={{ true: Colors.primaryContainer, false: Colors.surfaceContainerHigh }}
                thumbColor={on ? Colors.primary : '#fff'}
                accessibilityLabel={r.title}
              />
            </View>
          );
        })}
      </SectionCard>
      <InfoPill icon="notifications-none" text="You can fine-tune or turn these off anytime from your profile." />
    </View>
  );
}
