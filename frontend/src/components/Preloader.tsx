import React, { useEffect, useRef } from 'react';
import { Text, Animated } from 'react-native';

interface PreloaderProps {
  onFinish: () => void;
}

export default function Preloader({ onFinish }: PreloaderProps) {
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation for logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Fade in logo
    Animated.timing(opacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Fade in text slightly delayed
    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 800,
      delay: 400,
      useNativeDriver: true,
    }).start();

    // Fade out container and finish preloader after 3 seconds
    const timeout = setTimeout(() => {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <Animated.View 
      style={{ opacity: containerOpacity, flex: 1 }}
      className="bg-[#0F0F13] items-center justify-center"
    >
      <Animated.View 
        style={{
          transform: [{ scale }],
          opacity,
        }} 
        className="w-24 h-24 rounded-3xl bg-[#6366F1] items-center justify-center shadow-lg shadow-indigo-500/50"
      >
        <Text className="text-white text-4xl font-bold">$</Text>
      </Animated.View>
      
      <Animated.View style={{ opacity: textOpacity }} className="mt-8 items-center">
        <Text className="text-white text-2xl font-bold tracking-widest">EXPENSE</Text>
        <Text className="text-[#10B981] text-lg tracking-widest mt-1">TRACKER</Text>
      </Animated.View>
    </Animated.View>
  );
}
