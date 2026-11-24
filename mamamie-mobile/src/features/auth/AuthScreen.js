import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Colors } from '../../constants/theme';
import { T, Icon, Logo } from '../../components/ui';
import { PrimaryButton, TextField } from '../../components/forms';
import { useAuth } from '../../stores/authStore';
import { useSync } from '../../stores/syncStore';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Sign in or create an account. Optional: it only adds cloud backup and sync.
export default function AuthScreen({ onDone, onClose }) {
  const auth = useAuth();
  const sync = useSync();
  const [mode, setMode] = useState('signIn'); // signIn | signUp
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const submitted = useRef(false);

  const isUp = mode === 'signUp';
  const valid = EMAIL_RE.test(email.trim()) && password.length >= 8;

  async function submit() {
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (isUp) await auth.signUp(email, password, name);
      else await auth.signIn(email, password);
      submitted.current = true;
      setRestoring(true);
    } catch (e) {
      setError(e.isNetwork ? 'Can’t reach the MamAmie server. Check your connection and try again.' : e.message);
    } finally {
      setBusy(false);
    }
  }

  // Once the new session is live, pull the account's data, then leave.
  useEffect(() => {
    if (!submitted.current || !auth.isSignedIn) return;
    let alive = true;
    sync.syncNow().finally(() => alive && onDone?.());
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isSignedIn, restoring]);

  if (restoring) {
    return (
      <View style={[styles.scroll, { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }]}>
        <ActivityIndicator color={Colors.primary} />
        <T v="headlineSm">{isUp ? 'Setting things up…' : 'Restoring your data…'}</T>
        <T v="bodySm" color={Colors.onSurfaceVariant}>This only takes a moment.</T>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={onClose} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
          <Icon name="close" size={22} color={Colors.onSurfaceVariant} />
        </TouchableOpacity>

        <View style={{ alignItems: 'center', gap: 8 }}>
          <Logo size={64} />
          <T v="headlineLg" style={{ textAlign: 'center' }}>{isUp ? 'Create your account' : 'Welcome back'}</T>
          <T v="bodyMd" color={Colors.onSurfaceVariant} style={{ textAlign: 'center' }}>
            {isUp ? 'Back up your journal and keep it in step across your phones.' : 'Sign in to restore and sync your data.'}
          </T>
        </View>

        <View style={{ gap: 14 }}>
          {isUp && <TextField label="Your name" optional icon="person-outline" value={name} onChangeText={setName} placeholder="What should we call you?" autoComplete="name" />}
          <TextField label="Email" icon="mail-outline" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
          <TextField label="Password" icon="lock-outline" value={password} onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry autoCapitalize="none" autoComplete={isUp ? 'new-password' : 'current-password'} textContentType={isUp ? 'newPassword' : 'password'} />
        </View>

        {error ? (
          <View style={styles.error}>
            <Icon name="error-outline" size={18} color={Colors.error} />
            <T v="bodySm" color={Colors.error} style={{ flex: 1 }}>{error}</T>
          </View>
        ) : null}

        <PrimaryButton label={busy ? 'Please wait…' : isUp ? 'Create account' : 'Sign in'} icon="arrow-forward" onPress={submit} disabled={!valid || busy} />

        <TouchableOpacity onPress={() => { setMode(isUp ? 'signIn' : 'signUp'); setError(null); }} accessibilityRole="button">
          <T v="labelLg" color={Colors.primary} style={{ textAlign: 'center' }}>{isUp ? 'I already have an account' : 'New here? Create an account'}</T>
        </TouchableOpacity>

        <View style={styles.privacy}>
          <Icon name="lock-outline" size={18} color={Colors.onSecondaryContainer} />
          <T v="bodySm" color={Colors.onSecondaryContainer} style={{ flex: 1 }}>
            An account is optional. MamAmie works fully without one, and you can delete your account and its cloud copy any time from Profile.
          </T>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingTop: 12, paddingBottom: 40, gap: 20 },
  close: { alignSelf: 'flex-end', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceContainerLow },
  error: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 16, backgroundColor: Colors.errorContainer },
  privacy: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 16, backgroundColor: 'rgba(216,229,183,0.6)' },
});
