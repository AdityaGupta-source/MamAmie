import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot, usePathname } from 'expo-router';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import { useUi } from '../../stores/uiStore';
import { goTab, KEY_FOR_PATH } from '../../services/navigation';

const SECTION = {
  home: 'Home',
  track: 'Vital Track',
  vault: 'Medical Vault',
  ask: 'Ask MamAmie',
  circle: 'Care Circle',
};

// Sub-screens with a back-arrow header instead of the main header.
const BACK_TITLES = { log: 'Quick Log', profile: 'Your Profile' };

// Shared chrome for every in-app screen: Stitch header, the current route, and the bottom nav.
export default function MainLayout() {
  const pathname = usePathname();
  const current = KEY_FOR_PATH[pathname] || 'home';
  const { amber } = useUi();

  // Remember the last main tab so back-arrow screens return to it.
  const lastTab = useRef('home');
  useEffect(() => {
    if (!BACK_TITLES[current]) lastTab.current = current;
  }, [current]);

  return (
    <View style={styles.root}>
      {BACK_TITLES[current] ? (
        <Header variant="back" title={BACK_TITLES[current]} onBack={() => goTab(lastTab.current)} onProfile={() => goTab('profile')} />
      ) : (
        <Header section={SECTION[current]} onProfile={() => goTab('profile')} />
      )}
      <View style={styles.content}>
        <Slot />
      </View>
      <BottomNav current={current} onChange={goTab} />
      {amber && <View pointerEvents="none" style={styles.amber} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
  amber: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(245,158,11,0.15)' },
});
