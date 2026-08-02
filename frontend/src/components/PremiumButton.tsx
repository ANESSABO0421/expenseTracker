import React, { useRef } from 'react';
import { Text, Pressable, Animated } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PremiumButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
}

export default function PremiumButton({ title, onPress, variant = 'primary', className = '' }: PremiumButtonProps) {
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
      className={`w-full py-4 rounded-2xl items-center justify-center shadow-lg ${bgColor} ${shadowColor} ${className}`}
    >
      <Text className="text-white text-lg font-bold tracking-wide">{title}</Text>
    </AnimatedPressable>
  );
}
