import React from 'react';
import { View, Image } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';

interface LogoProps {
  theme?: 'light' | 'dark';
  size?: number;
}

export default function SpendovaLogo({ theme = 'light', size = 64 }: LogoProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Image
        source={require('../../assets/images/icon.png')}
        style={{ width: size, height: size, resizeMode: 'contain' }}
      />
    </View>
  );
}
