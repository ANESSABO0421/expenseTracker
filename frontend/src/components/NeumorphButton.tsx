import React, { useState } from 'react';
import { Pressable, ViewStyle } from 'react-native';
import NeumorphView from './NeumorphView';

interface NeumorphButtonProps {
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  borderRadius?: number;
  onPress?: () => void;
}

export default function NeumorphButton({ children, style, borderRadius = 16, onPress }: NeumorphButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Pressable
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onPress={onPress}
      style={style}
    >
      <NeumorphView isPressed={isPressed} borderRadius={borderRadius} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {children}
      </NeumorphView>
    </Pressable>
  );
}
