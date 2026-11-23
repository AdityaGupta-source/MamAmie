import React from 'react';
import OnboardingFlow from '../features/onboarding/OnboardingFlow';

// Completing onboarding flips the root stack's guard, which moves the user into the app.
export default function OnboardingRoute() {
  return <OnboardingFlow mode="first" />;
}
