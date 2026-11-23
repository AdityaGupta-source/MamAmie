import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Fonts } from '../../constants/theme';
import { T, Icon } from '../../components/ui';

export function StepIntro({ eyebrow, title, body }) {
  return (
    <View style={{ gap: 4 }}>
      {eyebrow ? <T v="labelSm" color={Colors.primary} style={styles.eyebrow}>{eyebrow}</T> : null}
      <T v="headlineLg">{title}</T>
      {body ? <T v="bodySm" color={Colors.onSurfaceVariant} style={{ marginTop: 2 }}>{body}</T> : null}
    </View>
  );
}

export function SectionCard({ title, subtitle, icon, children, style }) {
  return (
    <View style={[styles.card, style]}>
      {title ? (
        <View style={styles.cardHead}>
          {icon ? (
            <View style={styles.cardIcon}><Icon name={icon} size={18} color={Colors.primary} /></View>
          ) : null}
          <View style={{ flex: 1 }}>
            <T v="headlineSm">{title}</T>
            {subtitle ? <T v="bodySm" color={Colors.onSurfaceVariant}>{subtitle}</T> : null}
          </View>
        </View>
      ) : null}
      <View style={{ gap: 12 }}>{children}</View>
    </View>
  );
}

export function InfoPill({ icon = 'info-outline', text, tone = 'secondary' }) {
  const bg = tone === 'secondary' ? 'rgba(216,229,183,0.6)' : tone === 'tertiary' ? Colors.tertiaryFixed : Colors.primaryFixed;
  const fg = tone === 'secondary' ? Colors.onSecondaryContainer : tone === 'tertiary' ? Colors.onTertiaryFixed : Colors.onPrimaryFixed;
  return (
    <View style={[styles.info, { backgroundColor: bg }]}>
      <Icon name={icon} size={18} color={fg} />
      <T v="bodySm" color={fg} style={{ flex: 1, fontFamily: Fonts.medium }}>{text}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: { letterSpacing: 1, fontFamily: Fonts.semibold },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 24,
    padding: 20,
    gap: 14,
    shadowColor: '#2d3a47',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primaryFixed, alignItems: 'center', justifyContent: 'center' },
  info: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 16 },
});
