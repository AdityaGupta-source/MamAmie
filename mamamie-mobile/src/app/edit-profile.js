import React from 'react';
import { router } from 'expo-router';
import OnboardingFlow from '../features/onboarding/OnboardingFlow';

export default function EditProfileRoute() {
  const close = () => (router.canGoBack() ? router.back() : router.replace('/profile'));
  return <OnboardingFlow mode="edit" onDone={close} />;
}
