import React from 'react';
import { View, Switch } from 'react-native';
import { Colors } from '../../constants/theme';
import { T, Icon } from '../../components/ui';
import { ChoiceCard, RadioRow, DateField, ChipGroup, FieldLabel } from '../../components/forms';
import { STAGES, DATING_METHODS, CARE_STATUSES } from '../../models/onboarding';
import { pregnancyStatus, TRIMESTER_NAMES } from '../../services/pregnancyDating';
import { formatDayKey, fromDayKey, toDayKey, daysBetween } from '../../services/dayKey';
import { StepIntro, SectionCard, InfoPill } from './StepLayout';
import { withArticle } from '../home/JourneyCard';
import { dateLimits } from './validation';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function dateHint(key, future) {
  const d = fromDayKey(key);
  if (!d) return null;
  const diff = daysBetween(toDayKey(), key);
  const rel = diff === 0 ? 'today' : future ? (diff > 0 ? `${diff} days remaining` : `${-diff} days ago`) : `${-diff} days ago`;
  return `${WEEKDAYS[d.getDay()]} · ${rel}`;
}

export default function JourneyStep({ draft, set }) {
  const lim = dateLimits();
  const status = pregnancyStatus({ ...draft, stage: 'pregnant' });

  return (
    <View style={{ gap: 20 }}>
      <StepIntro eyebrow="YOUR JOURNEY" title="Where are you right now?" body="We tailor every screen to this. You can change it anytime." />

      <View style={{ gap: 10 }}>
        {STAGES.map((s) => (
          <ChoiceCard key={s.key} title={s.title} subtitle={s.subtitle} icon={s.icon} tone={s.tone} selected={draft.stage === s.key} onPress={() => set({ stage: s.key })} />
        ))}
      </View>

      {draft.stage === 'pregnant' && (
        <SectionCard title="How should we date your pregnancy?" icon="event">
          {DATING_METHODS.map((m) => (
            <RadioRow key={m.key} title={m.title} subtitle={m.subtitle} tag={m.key === 'dueDate' ? 'Most accurate' : null} selected={draft.datingMethod === m.key} onPress={() => set({ datingMethod: m.key })} />
          ))}
          {draft.datingMethod === 'dueDate' && (
            <DateField label="Due date" hint={dateHint(draft.dueDate, true)} value={draft.dueDate} onChange={(k) => set({ dueDate: k })} minKey={lim.dueDate.min} maxKey={lim.dueDate.max} />
          )}
          {draft.datingMethod === 'lastPeriod' && (
            <DateField label="First day of your last period" hint={dateHint(draft.lastPeriodDate, false)} value={draft.lastPeriodDate} onChange={(k) => set({ lastPeriodDate: k })} minKey={lim.lastPeriod.min} maxKey={lim.lastPeriod.max} />
          )}
          {status && draft.datingMethod !== 'notSet' && (
            <View style={{ flexDirection: 'row', gap: 12, padding: 16, borderRadius: 20, backgroundColor: Colors.secondaryContainer }}>
              <Icon name="eco" size={22} color={Colors.secondary} />
              <View style={{ flex: 1, gap: 2 }}>
                <T v="headlineSm" color={Colors.secondary}>Week {status.week} · {TRIMESTER_NAMES[status.trimester]}</T>
                <T v="bodySm" color={Colors.onSecondaryContainer}>
                  Your baby is roughly the size of {withArticle(status.baby.fruit)} ({status.baby.length.replace('~', 'about ')}).
                  {status.isEstimated ? ` Estimated due date ${formatDayKey(status.dueDate)}.` : ''}
                </T>
              </View>
            </View>
          )}
          {draft.datingMethod === 'notSet' && (
            <InfoPill icon="info-outline" tone="primary" text="No problem — we won’t show a pregnancy week until you add a date." />
          )}
        </SectionCard>
      )}

      {draft.stage === 'postpartum' && (
        <SectionCard title="Your baby’s arrival" icon="child-friendly">
          <DateField label="Date of childbirth" optional value={draft.childbirthDate} onChange={(k) => set({ childbirthDate: k })} minKey={lim.childbirth.min} maxKey={lim.childbirth.max} />
          <InfoPill icon="favorite-border" tone="tertiary" text="We’ll pace recovery tips to your weeks since birth." />
        </SectionCard>
      )}

      {draft.stage === 'planning' && (
        <SectionCard title="Cycle awareness" icon="auto-awesome">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <T v="labelLg">Track my menstrual cycle</T>
              <T v="bodySm" color={Colors.onSurfaceVariant}>Log periods and symptoms in your calendar.</T>
            </View>
            <Switch
              value={draft.trackCycle}
              onValueChange={(v) => set({ trackCycle: v })}
              trackColor={{ true: Colors.primaryContainer, false: Colors.surfaceContainerHigh }}
              thumbColor={draft.trackCycle ? Colors.primary : '#fff'}
            />
          </View>
        </SectionCard>
      )}

      {draft.stage && (
        <View>
          <FieldLabel>Are you currently receiving care?</FieldLabel>
          <ChipGroup single options={CARE_STATUSES} value={draft.clinicalCareStatus} onToggle={(k) => set({ clinicalCareStatus: k })} />
        </View>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 12 }}>
        <Icon name="lock-outline" size={16} color={Colors.onSurfaceVariant} />
        <T v="labelSm" color={Colors.onSurfaceVariant} style={{ textAlign: 'center' }}>Your pregnancy data stays on this device. MamAmie never sells health data.</T>
      </View>
    </View>
  );
}
