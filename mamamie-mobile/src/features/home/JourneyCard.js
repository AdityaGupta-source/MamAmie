import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Fonts, Radius } from '../../constants/theme';
import { Icon, T, Card, Pill, ProgressRing } from '../../components/ui';
import { formatDayKey } from '../../services/dayKey';

export const withArticle = (word) => `${/^[aeiou]/i.test(word) ? 'an' : 'a'} ${word.toLowerCase()}`;

const TRIS = [
  { n: 1, label: 'Tri 1', range: 'W1–13' },
  { n: 2, label: 'Tri 2', range: 'W14–27' },
  { n: 3, label: 'Tri 3', range: 'W28–40' },
];

// Hero card at the top of Home. Adapts to stage and never shows a week the user didn't give.
export default function JourneyCard({ profile, preg, post, onEditDates }) {
  const [open, setOpen] = useState(false);

  if (profile?.stage === 'pregnant' && preg) {
    const days = preg.daysToGo;
    return (
      <Card>
        <TouchableOpacity style={styles.row16} activeOpacity={0.85} onPress={() => setOpen((o) => !o)} accessibilityLabel="Toggle trimester roadmap">
          <ProgressRing size={112} stroke={10} progress={preg.progress} color={Colors.primary} track={Colors.surfaceContainerLow}>
            <T v="headlineMd" style={{ fontFamily: Fonts.bold }}>{Math.round(preg.progress * 100)}%</T>
            <T v="labelSm" color={Colors.onSurfaceVariant}>complete</T>
          </ProgressRing>
          <View style={{ flex: 1 }}>
            <Pill
              label={days > 0 ? `${days} days to go` : days === 0 ? 'Due today' : 'Past due date'}
              icon="event-available"
              bg={Colors.secondaryContainer}
              color={Colors.onSecondaryContainer}
              style={{ marginBottom: 4 }}
            />
            <T v="headlineSm" numberOfLines={1}>Size of {withArticle(preg.baby.fruit)}</T>
            <T v="bodySm" color={Colors.onSurfaceVariant} style={{ marginTop: 2 }}>About {preg.baby.length.replace('~', '')} long • {preg.baby.weight.replace('~', '')}</T>
            <View style={[styles.rowGap6, { marginTop: 8 }]}>
              <T v="labelSm" color={Colors.primary}>View trimester roadmap</T>
              <Icon name={open ? 'expand-less' : 'expand-more'} size={16} color={Colors.primary} />
            </View>
          </View>
        </TouchableOpacity>
        {open && (
          <View style={{ marginTop: 16 }}>
            <View style={styles.triRow}>
              {TRIS.map((t) => {
                const past = t.n < preg.trimester;
                const now = t.n === preg.trimester;
                return (
                  <View key={t.n} style={[styles.tri, { backgroundColor: now ? 'rgba(255,218,220,0.4)' : Colors.surfaceContainerLow, opacity: past || now ? 1 : 0.6 }]}>
                    <T v="labelSm" color={now ? Colors.primary : past ? Colors.secondary : Colors.onSurfaceVariant} style={{ fontFamily: Fonts.bold }}>{t.label}</T>
                    <T v="labelSm" color={now ? Colors.primary : Colors.onSurfaceVariant}>{t.range}</T>
                    {now ? (
                      <T v="labelSm" color={Colors.primary} style={{ marginTop: 4, fontFamily: Fonts.semibold }}>Current</T>
                    ) : (
                      <Icon name={past ? 'check-circle' : 'schedule'} size={16} color={past ? Colors.secondary : Colors.onSurfaceVariant} style={{ marginTop: 4 }} />
                    )}
                  </View>
                );
              })}
            </View>
            <T v="bodySm" color={Colors.onSurfaceVariant} style={{ textAlign: 'center', marginTop: 8 }}>
              {preg.isEstimated ? 'Estimated due date' : 'Due date'} {formatDayKey(preg.dueDate)}
            </T>
          </View>
        )}
      </Card>
    );
  }

  if (profile?.stage === 'postpartum') {
    return (
      <Card>
        <View style={styles.row16}>
          <ProgressRing size={112} stroke={10} progress={post ? Math.min(1, post.days / 42) : 0} color={Colors.tertiary} track={Colors.surfaceContainerLow}>
            <T v="headlineMd" style={{ fontFamily: Fonts.bold }}>{post ? `W${post.week}` : '—'}</T>
            <T v="labelSm" color={Colors.onSurfaceVariant}>{post ? 'since birth' : 'recovery'}</T>
          </ProgressRing>
          <View style={{ flex: 1 }}>
            <Pill label="Fourth trimester" icon="favorite" bg={Colors.tertiaryFixed} color={Colors.onTertiaryFixed} style={{ marginBottom: 4 }} />
            <T v="headlineSm">Gentle recovery</T>
            <T v="bodySm" color={Colors.onSurfaceVariant} style={{ marginTop: 2 }}>
              {post ? `Day ${post.days} since your baby arrived. Take each day at your own pace.` : 'Add your baby’s birth date to pace recovery tips.'}
            </T>
            {!post && <AddDatesLink onPress={onEditDates} label="Add birth date" />}
          </View>
        </View>
      </Card>
    );
  }

  if (profile?.stage === 'planning') {
    return (
      <Card>
        <View style={styles.row16}>
          <View style={[styles.bigIcon, { backgroundColor: Colors.secondaryContainer }]}>
            <Icon name="auto-awesome" size={34} color={Colors.secondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Pill label={profile.trackCycle ? 'Cycle tracking on' : 'Preparing'} icon="spa" bg={Colors.secondaryContainer} color={Colors.onSecondaryContainer} style={{ marginBottom: 4 }} />
            <T v="headlineSm">Preparing your body</T>
            <T v="bodySm" color={Colors.onSurfaceVariant} style={{ marginTop: 2 }}>
              Folic acid, balanced meals, restful sleep and gentle movement build a strong foundation.
            </T>
          </View>
        </View>
      </Card>
    );
  }

  // Pregnant without dates.
  return (
    <Card>
      <View style={styles.row16}>
        <View style={[styles.bigIcon, { backgroundColor: Colors.primaryFixed }]}>
          <Icon name="event" size={34} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <T v="headlineSm">Add your dates</T>
          <T v="bodySm" color={Colors.onSurfaceVariant} style={{ marginTop: 2 }}>
            With a due date or last period we can show your week, baby’s size and checkups.
          </T>
          <AddDatesLink onPress={onEditDates} label="Add due date" />
        </View>
      </View>
    </Card>
  );
}

function AddDatesLink({ onPress, label }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.addBtn} activeOpacity={0.85}>
      <Icon name="add" size={16} color={Colors.primary} />
      <T v="labelMd" color={Colors.primary}>{label}</T>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row16: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  rowGap6: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  triRow: { flexDirection: 'row', gap: 4 },
  tri: { flex: 1, alignItems: 'center', padding: 8, borderRadius: Radius.sm },
  bigIcon: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerHigh,
  },
});
