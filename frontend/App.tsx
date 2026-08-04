import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import Preloader from './src/components/Preloader';
import AppNavigator from './src/navigation/AppNavigator';
import Toast from 'react-native-toast-message';
import { useStore } from './src/store/useStore';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const { restoreSession } = useStore();

  React.useEffect(() => {
    restoreSession();
  }, []);

  if (isLoading) {
    return (
      <>
        <StatusBar style="light" />
        <Preloader onFinish={() => setIsLoading(false)} />
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
