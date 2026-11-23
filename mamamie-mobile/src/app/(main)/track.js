import React from 'react';
import TrackScreen from '../../features/track/TrackScreen';
import { goTab } from '../../services/navigation';

export default function TrackRoute() {
  return <TrackScreen onNavigate={goTab} />;
}
