import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_600SemiBold_Italic,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Colors } from './src/constants/theme';
import Header from './src/components/Header';
import BottomNav from './src/components/BottomNav';
import { Icon, T } from './src/components/ui';
import HomeScreen from './src/screens/HomeScreen';
import VitalsScreen from './src/screens/VitalsScreen';
import HydrationScreen from './src/screens/HydrationScreen';
import CareScreen from './src/screens/CareScreen';
import { OnboardingProvider, useOnboarding } from './src/stores/onboardingStore';
import OnboardingFlow from './src/features/onboarding/OnboardingFlow';
import ProfileScreen from './src/features/profile/ProfileScreen';

const SECTION = {
  home: 'Home',
  track: 'Vital Track',
  vault: 'Medical Vault',
  ask: 'Ask MamAmie',
  circle: 'Care Circle',
};

function ComingSoon({ icon, title, body }) {
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

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_600SemiBold_Italic,
    PlusJakartaSans_700Bold,
  });

  if (!fontsLoaded) return <Loading />;

  return (
    <SafeAreaProvider>
      <OnboardingProvider>
        <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
          <StatusBar style="dark" />
          <Shell />
        </SafeAreaView>
      </OnboardingProvider>
    </SafeAreaProvider>
  );
}

function Loading() {
  return (
    <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
      <ActivityIndicator color={Colors.primary} />
    </View>
  );
}

function Shell() {
  const { loaded, isComplete } = useOnboarding();
  const [tab, setTab] = useState('home');
  const [prevTab, setPrevTab] = useState('home');
  const [editing, setEditing] = useState(false);
  const [amber, setAmber] = useState(false);

  const go = (next) => {
    if (next !== tab) setPrevTab(tab);
    setTab(next);
  };
  const back = () => go(prevTab === tab ? 'home' : prevTab);
  const openProfile = () => go('profile');

  if (!loaded) return <Loading />;
  if (!isComplete) return <OnboardingFlow mode="first" onDone={() => setTab('home')} />;
  if (editing) return <OnboardingFlow mode="edit" onDone={() => setEditing(false)} />;

  return (
    <>
      {tab === 'log' || tab === 'profile' ? (
        <Header variant="back" title={tab === 'log' ? 'Quick Log' : 'Your Profile'} onBack={back} onProfile={openProfile} />
      ) : (
        <Header section={SECTION[tab]} onProfile={openProfile} />
      )}

      <View style={styles.content}>
        {tab === 'home' && <HomeScreen onNavigate={go} onEditProfile={() => setEditing(true)} />}
        {tab === 'track' && <VitalsScreen onNavigate={go} />}
        {tab === 'log' && <HydrationScreen />}
        {tab === 'circle' && <CareScreen amber={amber} setAmber={setAmber} />}
        {tab === 'profile' && <ProfileScreen onEdit={() => setEditing(true)} onCleared={() => setTab('home')} />}
        {tab === 'vault' && (
          <ComingSoon icon="folder-special" title="Medical Vault" body="Lab reports, scans and clinic notes will be stored here securely." />
        )}
        {tab === 'ask' && (
          <ComingSoon icon="auto-awesome" title="Ask MamAmie" body="A gentle, clinically-reviewed AI companion for your pregnancy questions is on the way." />
        )}
      </View>

      <BottomNav current={tab} onChange={go} />

      {amber && <View pointerEvents="none" style={styles.amber} />}
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  content: { flex: 1 },
  soon: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  soonIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  amber: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(245,158,11,0.15)' },
});
