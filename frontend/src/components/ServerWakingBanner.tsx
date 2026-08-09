import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { useStore } from '../store/useStore';

/**
 * Shown only while a request has been hanging long enough that the backend is
 * almost certainly cold-starting. Naming the cause turns a "frozen app" into a
 * understood wait — the single cheapest fix for perceived slowness.
 */
export default function ServerWakingBanner() {
  const isServerWaking = useStore(state => state.isServerWaking);
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';

  if (!isServerWaking) return null;

  return (
    <Animated.View
      entering={FadeInUp.duration(220)}
      exiting={FadeOutUp.duration(180)}
      pointerEvents="none"
      style={[styles.wrap, { top: insets.top + 6 }]}
    >
      <View style={[styles.pill, { backgroundColor: isDark ? '#1C2030' : '#FFFFFF' }]}>
        <ActivityIndicator size="small" color="#D4B26A" />
        <View style={{ flexShrink: 1 }}>
          <Text style={[styles.title, { color: isDark ? '#EDEAE1' : '#211C13' }]}>
            Waking up the server…
          </Text>
          <Text style={[styles.sub, { color: isDark ? '#9A98A6' : '#726A57' }]}>
            The first load after a break takes ~30s
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  title: { fontSize: 13.5, fontWeight: '700' },
  sub: { fontSize: 11.5, fontWeight: '500', marginTop: 1 },
});
