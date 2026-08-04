import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useColorScheme } from 'nativewind';

interface NeumorphViewProps {
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  borderRadius?: number;
  isPressed?: boolean;
}

export default function NeumorphView({ children, style, borderRadius = 16, isPressed = false }: NeumorphViewProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const baseColor = isDark ? '#1C1C1E' : '#F1F3F6';
  const lightShadow = isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff';
  const darkShadow = isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(163, 177, 198, 0.6)';

  return (
    <View style={[{ backgroundColor: baseColor, borderRadius }, styles.container, style]}>
      {/* Outer Shadows */}
      {!isPressed && (
        <>
          <View style={[StyleSheet.absoluteFill, { borderRadius, backgroundColor: baseColor, shadowColor: lightShadow, shadowOffset: { width: -4, height: -4 }, shadowOpacity: 1, shadowRadius: 6, elevation: 5 }]} />
          <View style={[StyleSheet.absoluteFill, { borderRadius, backgroundColor: baseColor, shadowColor: darkShadow, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 6, elevation: 5 }]} />
        </>
      )}

      {/* Inner Shadows (Simulated) */}
      {isPressed && (
        <View style={[StyleSheet.absoluteFill, { borderRadius, backgroundColor: 'rgba(0,0,0,0.05)', borderWidth: 1, borderColor: darkShadow, overflow: 'hidden' }]}>
           {/* Basic simulation of inset shadow for React Native */}
        </View>
      )}

      <View style={{ zIndex: 1, flex: 1, borderRadius, overflow: 'hidden' }}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
});
