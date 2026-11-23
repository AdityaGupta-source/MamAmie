import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Modal, Image } from 'react-native';
import { Colors, Radius, Shadow } from '../constants/theme';
import { Icon, T, Logo } from './ui';

const profile = require('../../assets/images/profile.jpg');

const SOS_OPTIONS = [
  {
    key: 'er',
    icon: 'monitor-heart',
    title: 'Urgent Contractions / Bleeding',
    sub: 'Direct line to Maternity ER Triage',
    urgent: true,
  },
  { key: 'midwife', icon: 'phone-in-talk', title: 'Call On-Duty Midwife', sub: '24/7 clinical telehealth advisory' },
  { key: 'partner', icon: 'people-outline', title: 'Alert Primary Partner', sub: 'SMS geolocation & critical alert' },
];

// variant "main": logo + section subtitle + pregnancy pill + SOS + avatar
// variant "back": back arrow + logo + title + avatar (Quick Log)
export default function Header({ section, variant = 'main', title, onBack }) {
  const [sosOpen, setSosOpen] = useState(false);
  const [sent, setSent] = useState(null);

  const closeSos = () => {
    setSosOpen(false);
    setSent(null);
  };

  return (
    <>
      <View style={styles.header}>
        {variant === 'back' ? (
          <View style={styles.row}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityLabel="Go back">
              <Icon name="arrow-back-ios-new" size={22} color={Colors.primary} />
            </TouchableOpacity>
            <Logo size={32} />
            <T v="headlineSm" style={{ marginLeft: 4 }}>{title}</T>
          </View>
        ) : (
          <View style={styles.row}>
            <Logo size={32} />
            <View>
              <T v="headlineSm" style={{ lineHeight: 20 }}>MamAmie</T>
              <T v="labelSm" color={Colors.onSurfaceVariant}>{section}</T>
            </View>
          </View>
        )}

        <View style={styles.row}>
          {variant === 'main' && (
            <>
              <TouchableOpacity style={styles.stagePill} activeOpacity={0.8}>
                <T v="labelSm" color={Colors.primary} style={styles.semibold}>Pregnancy W24</T>
                <Icon name="keyboard-arrow-down" size={16} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.sosPill} activeOpacity={0.8} onPress={() => setSosOpen(true)}>
                <Icon name="emergency" size={14} color={Colors.error} />
                <T v="labelSm" color={Colors.onErrorContainer} style={styles.semibold}>SOS</T>
              </TouchableOpacity>
            </>
          )}
          <Image source={profile} style={styles.avatar} />
        </View>
      </View>

      <Modal visible={sosOpen} transparent animationType="fade" onRequestClose={closeSos}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetIcon}>
              <Icon name="emergency" size={28} color={Colors.error} />
            </View>
            <T v="headlineMd" style={{ textAlign: 'center' }}>Maternal SOS & Triage</T>
            <T v="bodySm" color={Colors.onSurfaceVariant} style={{ textAlign: 'center', marginTop: 4, marginBottom: 16 }}>
              {sent
                ? `Emergency protocol started for: ${sent}. Connecting you now…`
                : 'Select your priority support need. Immediate help is on standby.'}
            </T>

            {!sent &&
              SOS_OPTIONS.map((o) => (
                <TouchableOpacity
                  key={o.key}
                  style={[styles.option, o.urgent && { backgroundColor: Colors.errorContainer }]}
                  onPress={() => setSent(o.title)}
                  activeOpacity={0.85}
                >
                  <Icon name={o.icon} size={22} color={o.urgent ? Colors.onErrorContainer : Colors.primary} />
                  <View style={{ flex: 1 }}>
                    <T v="labelLg" color={o.urgent ? Colors.onErrorContainer : Colors.onSurface}>{o.title}</T>
                    <T v="bodySm" color={Colors.onSurfaceVariant}>{o.sub}</T>
                  </View>
                </TouchableOpacity>
              ))}

            <TouchableOpacity style={styles.dismiss} onPress={closeSos}>
              <T v="labelLg" color={Colors.primary}>{sent ? 'Done' : 'Dismiss'}</T>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    backgroundColor: 'rgba(247,249,255,0.92)',
    shadowColor: '#0f1d29',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    zIndex: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  backBtn: { minWidth: 36, minHeight: 44, justifyContent: 'center', marginLeft: -6 },
  semibold: { fontFamily: 'PlusJakartaSans_600SemiBold' },
  stagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 40,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  sosPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 40,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.errorContainer,
    ...Shadow.sm,
  },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,29,41,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 24,
    alignItems: 'stretch',
  },
  sheetIcon: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.errorContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceContainerLow,
    marginBottom: 8,
  },
  dismiss: { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
});
