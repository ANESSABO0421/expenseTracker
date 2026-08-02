import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import Preloader from './src/components/Preloader';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

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
    </>
  );
}
