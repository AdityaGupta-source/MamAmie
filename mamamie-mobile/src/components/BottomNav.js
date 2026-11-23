import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Fonts, Shadow } from '../constants/theme';
import { Icon, T } from './ui';

const LEFT = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'track', label: 'Track', icon: 'insights' },
];
const RIGHT = [
  { key: 'vault', label: 'Vault', icon: 'folder-special' },
  { key: 'ask', label: 'Ask', icon: 'auto-awesome' },
  { key: 'circle', label: 'Circle', icon: 'favorite' },
];

export default function BottomNav({ current, onChange }) {
  const Tab = ({ item }) => {
    const active = current === item.key;
    const color = active ? Colors.primary : Colors.onSurfaceVariant;
    return (
      <TouchableOpacity style={styles.tab} onPress={() => onChange(item.key)} activeOpacity={0.7}>
        <Icon name={item.icon} size={24} color={color} />
        <T v="labelSm" color={color} style={[styles.label, active && { fontFamily: Fonts.bold }]}>
          {item.label}
        </T>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.nav}>
      {LEFT.map((i) => <Tab key={i.key} item={i} />)}
      <View style={styles.fabWrap}>
        <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={() => onChange('log')} accessibilityLabel="Quick log">
          <Icon name="add" size={30} color={Colors.onPrimary} />
        </TouchableOpacity>
        <T v="labelSm" color={current === 'log' ? Colors.primary : Colors.onSurfaceVariant} style={[styles.label, { fontFamily: Fonts.medium }]}>
          Log
        </T>
      </View>
      {RIGHT.map((i) => <Tab key={i.key} item={i} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 80,
    paddingHorizontal: 4,
    backgroundColor: 'rgba(247,249,255,0.95)',
    shadowColor: '#0f1d29',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 12,
  },
  tab: { alignItems: 'center', justifyContent: 'center', width: 56, minHeight: 44 },
  label: { marginTop: 2 },
  fabWrap: { alignItems: 'center', top: -16 },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.primary,
  },
});
