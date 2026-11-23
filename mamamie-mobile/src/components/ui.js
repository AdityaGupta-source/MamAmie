import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle, Path } from 'react-native-svg';
import { Colors, Type, Radius, Shadow } from '../constants/theme';

// Material Symbols names from the Stitch HTML that live in the community set instead.
const COMMUNITY = {
  footprint: 'foot-print',
  stethoscope: 'stethoscope',
  'water-bottle': 'bottle-soda-classic',
};

export function Icon({ name, size = 20, color = Colors.onSurface, style }) {
  if (COMMUNITY[name]) {
    return <MaterialCommunityIcons name={COMMUNITY[name]} size={size} color={color} style={style} />;
  }
  return <MaterialIcons name={name} size={size} color={color} style={style} />;
}

// Typed text: <T v="headlineSm" color={...}>
export function T({ v = 'bodyMd', color = Colors.onSurface, style, children, ...rest }) {
  return (
    <Text style={[Type[v], { color }, style]} {...rest}>
      {children}
    </Text>
  );
}

export function Card({ style, children, radius = Radius.lg, padding = 24 }) {
  return (
    <View style={[styles.card, { borderRadius: radius, padding }, style]}>{children}</View>
  );
}

export function Pill({ label, bg, color, icon, dot, style, textVariant = 'labelSm' }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }, style]}>
      {dot ? <View style={[styles.dot, { backgroundColor: dot }]} /> : null}
      {icon ? <Icon name={icon} size={14} color={color} /> : null}
      <T v={textVariant} color={color} style={{ fontFamily: Type.labelMd.fontFamily }}>
        {label}
      </T>
    </View>
  );
}

export function ProgressRing({ size = 120, stroke = 10, progress = 0.6, color = Colors.primary, track = Colors.surfaceContainerLow, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - p)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

// MamAmie mark, redrawn from the Stitch design (mother silhouette with a sage dot).
export function Logo({ size = 32 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Circle cx="20" cy="20" r="20" fill={Colors.logoCream} />
      <Circle cx="20" cy="14" r="6" fill="#f4b6c2" />
      <Circle cx="20" cy="14" r="3.2" fill="#b46a72" />
      <Path d="M11 31 C11 21 29 21 29 31" stroke="#b46a72" strokeWidth="3" fill="none" strokeLinecap="round" />
      <Circle cx="23.5" cy="26" r="2.4" fill="#a8b58a" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    ...Shadow.card,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
