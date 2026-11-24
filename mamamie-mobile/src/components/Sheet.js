import React from 'react';
import { View, TouchableOpacity, StyleSheet, Modal, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Colors } from '../constants/theme';
import { Icon, T } from './ui';

// Bottom sheet in the Stitch style (rounded top, dimmed backdrop). Content scrolls when tall.
export default function Sheet({ visible, title, onClose, children, footer }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable style={styles.sheet}>
            <View style={styles.head}>
              <T v="headlineMd" style={{ flex: 1 }}>{title}</T>
              <TouchableOpacity onPress={onClose} accessibilityLabel="Close" hitSlop={8}>
                <Icon name="close" size={22} color={Colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,29,41,0.4)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '90%', backgroundColor: Colors.surfaceContainerLowest, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 24 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, marginBottom: 8 },
  body: { paddingHorizontal: 24, paddingBottom: 16, gap: 16 },
  footer: { paddingHorizontal: 24, paddingBottom: 28, paddingTop: 8, gap: 8 },
});
