import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_600SemiBold_Italic,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Colors } from '../constants/theme';
import { OnboardingProvider, useOnboarding } from '../stores/onboardingStore';
import { HydrationProvider } from '../stores/hydrationStore';
import { JournalProvider } from '../stores/journalStore';
import { SessionsProvider } from '../stores/sessionsStore';
import { UiProvider } from '../stores/uiStore';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_600SemiBold_Italic,
    PlusJakartaSans_700Bold,
  });

  return (
    <SafeAreaProvider>
      <OnboardingProvider>
        <HydrationProvider>
          <JournalProvider>
          <SessionsProvider>
          <UiProvider>
            <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
              <StatusBar style="dark" />
              <Gate fontsLoaded={fontsLoaded} />
            </SafeAreaView>
          </UiProvider>
          </SessionsProvider>
          </JournalProvider>
        </HydrationProvider>
      </OnboardingProvider>
    </SafeAreaProvider>
  );
}

// Holds the splash screen until fonts and the saved profile are ready, then lets the
// protected stack decide: onboarding for first-time users, the app for everyone else.
function Gate({ fontsLoaded }) {
  const { loaded, isComplete } = useOnboarding();
  const ready = fontsLoaded && loaded;

  useEffect(() => {
    if (ready) SplashScreen.hide();
  }, [ready]);

  if (!ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.surface } }}>
      <Stack.Protected guard={!isComplete}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={isComplete}>
        <Stack.Screen name="(main)" />
        <Stack.Screen name="edit-profile" />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
});
