import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import Preloader from './src/components/Preloader';
import AppNavigator from './src/navigation/AppNavigator';
import ServerWakingBanner from './src/components/ServerWakingBanner';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { toastConfig } from './src/components/ToastConfig';
import { useStore } from './src/store/useStore';
import { warmBackend } from './src/utils/api';
import { Platform, UIManager } from 'react-native';
import { useColorScheme } from 'nativewind';
import ThemeTransitionProvider from './src/theme/ThemeTransition';

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
  const storeTheme = useStore(s => s.theme);
  const { colorScheme, setColorScheme } = useColorScheme();

  useEffect(() => {
    // Kick Render awake immediately. Deliberately not awaited — the splash and
    // session restore proceed while the container boots in the background, so
    // the cold start overlaps the splash instead of stalling the dashboard.
    warmBackend();

    (async () => {
      try {
        await restoreSession();
        // Apply the saved (or device) theme before the first app frame
        setColorScheme(useStore.getState().theme);
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
        <StatusBar style={storeTheme === 'dark' ? 'light' : 'dark'} />
        <Preloader ready={isReady} onFinish={() => setShowApp(true)} />
      </>
    );
  }

  return (
    // SafeAreaProvider is needed here because the banner sits outside
    // NavigationContainer, which otherwise supplies its own compat provider.
    <SafeAreaProvider>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} animated />
      <ThemeTransitionProvider>
        <AppNavigator />
        <ServerWakingBanner />
        <Toast config={toastConfig} topOffset={56} />
      </ThemeTransitionProvider>
    </SafeAreaProvider>
  );
}
