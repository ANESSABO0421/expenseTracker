import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import Preloader from './src/components/Preloader';
import AppNavigator from './src/navigation/AppNavigator';
import Toast from 'react-native-toast-message';
import { useStore } from './src/store/useStore';
import { Platform, UIManager } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Minimum time to hold the splash animation so it never flashes on a fast
// restore — real apps do the same (Stripe, Cash App, etc all hold a beat).
const MIN_SPLASH_MS = 1800;

export default function App() {
  const [showApp, setShowApp] = useState(false);
  const [sessionRestored, setSessionRestored] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const { restoreSession } = useStore();

  useEffect(() => {
    (async () => {
      try {
        await restoreSession();
      } finally {
        setSessionRestored(true);
      }
    })();

    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  const isReady = sessionRestored && minTimeElapsed;

  if (!showApp) {
    return (
      <>
        <StatusBar style="light" />
        <Preloader ready={isReady} onFinish={() => setShowApp(true)} />
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
      <Toast />
    </>
  );
}
