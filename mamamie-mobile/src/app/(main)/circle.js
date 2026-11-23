import React from 'react';
import CircleScreen from '../../features/circle/CircleScreen';
import { useUi } from '../../stores/uiStore';

export default function CircleRoute() {
  const { amber, setAmber } = useUi();
  return <CircleScreen amber={amber} setAmber={setAmber} />;
}
