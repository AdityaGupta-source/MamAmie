import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';
import { Icon, T } from './ui';

export default function ComingSoon({ icon, title, body }) {
  return (
    <View style={styles.soon}>
      <View style={styles.soonIcon}>
        <Icon name={icon} size={30} color={Colors.primary} />
      </View>
      <T v="headlineMd" style={{ textAlign: 'center' }}>{title}</T>
      <T v="bodySm" color={Colors.onSurfaceVariant} style={{ textAlign: 'center', marginTop: 6 }}>{body}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  soon: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  soonIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primaryFixed, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
});
