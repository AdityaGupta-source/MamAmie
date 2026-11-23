import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Fonts, Radius, Shadow } from '../../constants/theme';
import { Icon, T, Card } from '../../components/ui';
import { withArticle } from './JourneyCard';

// Week 22–26 keeps the original Stitch "Hearing Your World" copy; other weeks use the
// backend's per-week size/symptom table. Postpartum and planning get a gentle tip instead.
function contentFor(profile, preg, post) {
  if (profile?.stage === 'pregnant' && preg) {
    if (preg.week >= 22 && preg.week <= 26) {
      return {
        icon: 'hearing',
        eyebrow: 'MILESTONE ALERT',
        title: 'Hearing Your World',
        body: 'Baby can now recognize your voice and hear maternal heartbeats! Gentle talking, singing, and rhythmic melodies comfort their developing sensory cortex.',
        guideTitle: `Clinical guide for Week ${preg.week}`,
        guideIntro: 'Key anatomical milestones this week:',
        guide: [
          'Inner ear cochlea is completely structurally developed.',
          'Taste buds continue to develop along the tongue surface.',
          'Capillaries are forming in the lungs to prepare for oxygenation.',
        ],
      };
    }
    return {
      icon: 'child-care',
      eyebrow: `WEEK ${preg.week}`,
      title: `Growing like ${withArticle(preg.baby.fruit)}`,
      body: `Your baby is about ${preg.baby.length.replace('~', '')} long and weighs about ${preg.baby.weight.replace('~', '')}. Every pregnancy is different — these are typical, not targets.`,
      guideTitle: `What many mums notice around week ${preg.week}`,
      guideIntro: 'Common this stage:',
      guide: preg.baby.symptoms,
    };
  }
  if (profile?.stage === 'postpartum') {
    return {
      icon: 'spa',
      eyebrow: 'FOURTH TRIMESTER',
      title: 'Healing takes time',
      body: post && post.week < 6
        ? 'Your body is still recovering. Rest when baby rests, eat warm nourishing meals, and accept help.'
        : 'Keep checking in with your body and mood. Your 6-week checkup is a good time to ask anything.',
      guideTitle: 'Gentle recovery basics',
      guideIntro: 'Call your care team if you notice:',
      guide: ['Heavy bleeding soaking a pad in an hour', 'Fever, chills or a painful, red wound', 'Low mood that lasts more than two weeks'],
    };
  }
  return {
    icon: 'eco',
    eyebrow: 'PREPARATION',
    title: 'Start folic acid early',
    body: 'Taking 400 mcg folic acid daily, ideally before conception, helps protect your baby’s developing spine and brain.',
    guideTitle: 'Pre-pregnancy checklist',
    guideIntro: 'Talk to your doctor about:',
    guide: ['A preconception health check', 'Reviewing current medicines', 'Vaccinations that are due'],
  };
}

export default function WeekInsightCard({ profile, preg, post }) {
  const [open, setOpen] = useState(false);
  const c = contentFor(profile, preg, post);
  return (
    <Card style={{ backgroundColor: '#fff4f6' }}>
      <View style={styles.rowTop16}>
        <View style={styles.circleIcon}>
          <Icon name={c.icon} size={26} color={Colors.tertiary} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.rowGap6}>
            <T v="labelSm" color={Colors.primary} style={styles.eyebrow}>{c.eyebrow}</T>
            <View style={styles.dot6} />
          </View>
          <T v="headlineSm" style={{ marginTop: 2 }}>{c.title}</T>
          <T v="bodySm" color={Colors.onSurfaceVariant} style={{ marginTop: 4, lineHeight: 21 }}>{c.body}</T>
          <TouchableOpacity style={styles.guideBtn} onPress={() => setOpen((o) => !o)} activeOpacity={0.85}>
            <View style={[styles.rowGap6, { flex: 1 }]}>
              <Icon name="menu-book" size={18} color={Colors.primary} />
              <T v="labelMd" style={{ flex: 1 }}>{c.guideTitle}</T>
            </View>
            <Icon name={open ? 'expand-less' : 'expand-more'} size={18} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>
          {open && (
            <View style={styles.guideBody}>
              <T v="bodySm" style={{ fontFamily: Fonts.semibold }}>{c.guideIntro}</T>
              {c.guide.map((t) => (
                <T key={t} v="bodySm" color={Colors.onSurfaceVariant} style={{ marginTop: 4 }}>• {t}</T>
              ))}
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  rowTop16: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  rowGap6: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eyebrow: { letterSpacing: 1, fontFamily: Fonts.bold },
  dot6: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  circleIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.tertiaryFixed },
  guideBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerLowest,
    ...Shadow.sm,
  },
  guideBody: { marginTop: 8, padding: 16, borderRadius: 16, backgroundColor: Colors.surfaceContainerLowest },
});
