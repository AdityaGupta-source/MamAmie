import React from 'react';
import { router } from 'expo-router';
import AuthScreen from '../features/auth/AuthScreen';

export default function AuthRoute() {
  return <AuthScreen onDone={() => router.replace('/')} onClose={() => (router.canGoBack() ? router.back() : router.replace('/'))} />;
}
