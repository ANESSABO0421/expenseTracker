import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useColorScheme } from 'nativewind';

interface BackgroundGradientProps {
  children: React.ReactNode;
}

export const BackgroundGradient: React.FC<BackgroundGradientProps> = ({ children }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F2F2F7' }]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
