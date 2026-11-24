import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Colors, Fonts } from '../../constants/theme';
import { T, Icon, Logo } from '../../components/ui';
import { PrimaryButton } from '../../components/forms';

const POINTS = [
  { icon: 'lock-outline', bg: Colors.secondaryContainer, fg: Colors.onSecondaryContainer, title: 'Stays on your phone', body: 'Your answers are stored privately on this device.' },
  { icon: 'tune', bg: Colors.primaryFixed, fg: Colors.primary, title: 'Tailored to your journey', body: 'A few gentle questions personalise insights and reminders.' },
  { icon: 'health-and-safety', bg: Colors.tertiaryFixed, fg: Colors.tertiary, title: 'Not a substitute for your doctor', body: 'MamAmie supports — never replaces — your care team.' },
];

export default function WelcomeStep({ onBegin, onSignIn }) {
  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Svg width="100%" height="100%" viewBox="0 0 320 220" style={StyleSheet.absoluteFill} preserveAspectRatio="xMidYMid slice">
          <Circle cx="60" cy="50" r="70" fill={Colors.primaryFixed} opacity={0.7} />
          <Circle cx="270" cy="170" r="90" fill={Colors.secondaryContainer} opacity={0.6} />
          <Circle cx="250" cy="30" r="30" fill={Colors.tertiaryFixed} opacity={0.8} />
          <Path d="M0 180 Q 80 140 160 175 T 320 160 V220 H0 Z" fill={Colors.surfaceContainer} opacity={0.8} />
        </Svg>
        <View style={styles.logoHalo}>
          <Logo size={88} />
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <T v="labelSm" color={Colors.primary} style={styles.eyebrow}>WELCOME TO MAMAMIE</T>
        <T v="headlineLg" style={{ fontSize: 28, lineHeight: 34 }}>A calm companion for every stage of motherhood</T>
        <T v="bodyMd" color={Colors.onSurfaceVariant} style={{ marginTop: 4 }}>
          Planning, pregnant or recovering after birth — MamAmie adapts to you. Takes about 3 minutes.
        </T>
      </View>

      <View style={styles.points}>
        {POINTS.map((p) => (
          <View key={p.title} style={styles.point}>
            <View style={[styles.pointIcon, { backgroundColor: p.bg }]}><Icon name={p.icon} size={20} color={p.fg} /></View>
            <View style={{ flex: 1 }}>
              <T v="labelLg">{p.title}</T>
              <T v="bodySm" color={Colors.onSurfaceVariant}>{p.body}</T>
            </View>
          </View>
        ))}
      </View>

      <PrimaryButton label="Begin gently" icon="arrow-forward" onPress={onBegin} />
      {onSignIn ? (
        <TouchableOpacity onPress={onSignIn} accessibilityRole="button">
          <T v="labelLg" color={Colors.primary} style={{ textAlign: 'center' }}>I already have an account</T>
        </TouchableOpacity>
      ) : null}
      <T v="labelSm" color={Colors.onSurfaceVariant} style={{ textAlign: 'center', fontFamily: Fonts.regular }}>
        You can change any answer later from your profile.
      </T>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingTop: 12, gap: 24 },
  hero: {
    height: 220,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoHalo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8b4850',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 4,
  },
  eyebrow: { letterSpacing: 1, fontFamily: Fonts.semibold },
  points: { gap: 10 },
  point: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerLowest,
    shadowColor: '#0f1d29',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  pointIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
