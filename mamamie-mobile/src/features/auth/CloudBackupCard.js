import React, { useState } from 'react';
import { View, StyleSheet, Switch, Modal, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Colors, Radius, Shadow } from '../../constants/theme';
import { T, Icon } from '../../components/ui';
import { PrimaryButton, SecondaryButton } from '../../components/forms';
import { useAuth } from '../../stores/authStore';
import { useSync } from '../../stores/syncStore';

function ago(ms) {
  if (!ms) return 'Not synced yet';
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (s < 60) return 'Synced just now';
  if (s < 3600) return `Synced ${Math.round(s / 60)} min ago`;
  if (s < 86400) return `Synced ${Math.round(s / 3600)} h ago`;
  return `Synced ${Math.round(s / 86400)} d ago`;
}

const STATUS_TEXT = { syncing: 'Syncing…', offline: 'Offline — will retry', error: 'Sync problem — will retry' };

// Profile section: sign in for cloud backup, or manage the signed-in account.
export default function CloudBackupCard() {
  const auth = useAuth();
  const sync = useSync();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (!auth.isSignedIn) {
    return (
      <View style={styles.card}>
        <View style={styles.head}>
          <View style={styles.icon}><Icon name="cloud-upload" size={20} color={Colors.primary} /></View>
          <View style={{ flex: 1 }}>
            <T v="headlineSm">Back up your data</T>
            <T v="bodySm" color={Colors.onSurfaceVariant}>Optional. Keep your journal safe and move to a new phone without losing it.</T>
          </View>
        </View>
        <PrimaryButton label="Sign in or create account" icon="arrow-forward" onPress={() => router.push('/auth')} />
      </View>
    );
  }

  const statusText = STATUS_TEXT[sync.status] || (sync.enabled ? ago(sync.lastSyncedAt) : 'Sync is off');

  async function removeAccount() {
    setBusy(true);
    setError(null);
    try {
      await auth.deleteAccount();
      setConfirmDelete(false);
    } catch (e) {
      setError(e.isNetwork ? 'Can’t reach the server. Try again when you’re online.' : e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.icon}><Icon name="cloud-done" size={20} color={Colors.primary} /></View>
        <View style={{ flex: 1 }}>
          <T v="headlineSm">Cloud backup</T>
          <T v="bodySm" color={Colors.onSurfaceVariant} numberOfLines={1}>{auth.user.email}</T>
        </View>
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <T v="labelLg">Sync my data</T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {sync.status === 'syncing' ? <ActivityIndicator size="small" color={Colors.primary} /> : null}
            <T v="bodySm" color={sync.status === 'error' ? Colors.error : Colors.onSurfaceVariant}>{statusText}</T>
          </View>
        </View>
        <Switch value={sync.enabled} onValueChange={sync.setEnabled} trackColor={{ true: Colors.primary }} />
      </View>
      {sync.error ? <T v="bodySm" color={Colors.error}>{sync.error}</T> : null}

      <SecondaryButton label="Sync now" icon="sync" onPress={sync.syncNow} />
      <SecondaryButton label="Sign out" icon="logout" onPress={auth.signOut} />
      <SecondaryButton label="Delete my account and cloud data" icon="delete-outline" onPress={() => setConfirmDelete(true)} />

      <Modal visible={confirmDelete} transparent animationType="fade" onRequestClose={() => setConfirmDelete(false)}>
        <Pressable style={styles.overlay} onPress={() => !busy && setConfirmDelete(false)}>
          <Pressable style={styles.sheet}>
            <View style={styles.warnIcon}><Icon name="delete-outline" size={26} color={Colors.error} /></View>
            <T v="headlineMd" style={{ textAlign: 'center' }}>Delete your account?</T>
            <T v="bodySm" color={Colors.onSurfaceVariant} style={{ textAlign: 'center', marginTop: 4, marginBottom: 16 }}>
              This permanently erases your account and everything backed up to the cloud. The data on this phone stays. It can’t be undone.
            </T>
            {error ? <T v="bodySm" color={Colors.error} style={{ textAlign: 'center', marginBottom: 8 }}>{error}</T> : null}
            <PrimaryButton label={busy ? 'Deleting…' : 'Yes, delete my account'} disabled={busy} style={{ backgroundColor: Colors.error, shadowColor: Colors.error }} onPress={removeAccount} />
            <SecondaryButton label="Keep my account" onPress={() => setConfirmDelete(false)} style={{ marginTop: 8 }} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 20, borderRadius: 24, backgroundColor: Colors.surfaceContainerLowest, gap: 12, ...Shadow.sm },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryFixed, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  overlay: { flex: 1, backgroundColor: 'rgba(15,29,41,0.4)', justifyContent: 'center', padding: 24 },
  sheet: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.lg, padding: 24 },
  warnIcon: { alignSelf: 'center', width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.errorContainer, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
});
