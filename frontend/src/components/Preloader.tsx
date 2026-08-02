import React, { useEffect, useRef } from 'react';
import { Text, Animated, Image } from 'react-native';

interface PreloaderProps {
  onFinish: () => void;
}

export default function Preloader({ onFinish }: PreloaderProps) {
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation for logo (soft premium pulse)
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.05,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.95,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Fade in logo
    Animated.timing(opacity, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Fade in text slightly delayed
    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 1000,
      delay: 500,
      useNativeDriver: true,
    }).start();

    // Fade out container and finish preloader after 3.2 seconds
    const timeout = setTimeout(() => {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 3200);

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
          shadowColor: '#6366F1',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.4,
          shadowRadius: 20,
          elevation: 10,
        }} 
        className="w-28 h-28 rounded-[28px] overflow-hidden bg-[#1A1A24] border border-indigo-500/30"
      >
        <Image 
          source={require('../../assets/images/icon.png')} 
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </Animated.View>
      
      <Animated.View style={{ opacity: textOpacity }} className="mt-8 items-center">
        <Text className="text-white text-2xl font-bold tracking-[6px]">EXPENSE</Text>
        <Text className="text-[#10B981] text-lg font-semibold tracking-[4px] mt-1">TRACKER</Text>
      </Animated.View>
    </Animated.View>
  );
}
