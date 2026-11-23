import React from 'react';
import { router } from 'expo-router';
import HomeScreen from '../../features/home/HomeScreen';
import { goTab } from '../../services/navigation';

export default function HomeRoute() {
  return <HomeScreen onNavigate={goTab} onEditProfile={() => router.push('/edit-profile')} />;
}
