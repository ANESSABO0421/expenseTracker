import React, { useRef } from 'react';
import { Text, Pressable, Animated } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PremiumButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
  isLoading?: boolean;
}

export default function PremiumButton({ title, onPress, variant = 'primary', className = '', isLoading = false }: PremiumButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  let bgColor = 'bg-[#6366F1]';
  let shadowColor = 'shadow-indigo-500/50';

  if (variant === 'secondary') {
    bgColor = 'bg-[#10B981]';
    shadowColor = 'shadow-emerald-500/50';
  } else if (variant === 'danger') {
    bgColor = 'bg-[#F43F5E]';
    shadowColor = 'shadow-rose-500/50';
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ transform: [{ scale }] }}
      disabled={isLoading}
      className={`w-full py-4 rounded-[24px] items-center justify-center shadow-lg ${bgColor} ${shadowColor} ${className} ${isLoading ? 'opacity-80' : ''}`}
    >
      {isLoading ? (
        <React.Fragment>
          {/* React Native ActivityIndicator or custom loading spinner */}
          <Text className="text-white text-lg font-bold tracking-wide">Loading...</Text>
        </React.Fragment>
      ) : (
        <Text className="text-white text-lg font-black tracking-tight uppercase">{title}</Text>
      )}
    </AnimatedPressable>
  );
}
