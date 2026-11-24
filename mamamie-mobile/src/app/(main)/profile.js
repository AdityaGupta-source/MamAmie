import React from 'react';
import { router } from 'expo-router';
import ProfileScreen from '../../features/profile/ProfileScreen';

// Clearing data flips the onboarding guard in the root layout, which shows onboarding again.
export default function ProfileRoute() {
  return <ProfileScreen onEdit={() => router.push('/edit-profile')} />;
}
