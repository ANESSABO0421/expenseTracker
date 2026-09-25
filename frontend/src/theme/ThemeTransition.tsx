import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import { useStore } from '../store/useStore';
import { ThemeToggleContext, palettes } from './index';

const FADE_IN_MS = 200;
const FADE_OUT_MS = 360;
// Safety net: never leave the veil up if the scheme change doesn't commit.
const MAX_WAIT_MS = 800;

/**
 * Makes light/dark switches feel like a crossfade instead of a hard snap.
 *
 * A veil in the *target* theme's background fades over the screen, the theme
 * flips underneath it, and the veil fades out only after the whole tree has
 * committed in the new colours — so nothing is ever seen half-switched.
 */
export default function ThemeTransitionProvider({ children }: { children: React.ReactNode }) {
  const { colorScheme, setColorScheme } = useColorScheme();
  const setTheme = useStore(s => s.setTheme);

  const opacity = useSharedValue(0);
  const [veil, setVeil] = useState<string | null>(null);
  const busy = useRef(false);
  const awaitingCommit = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const fallback = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    if (fallback.current) clearTimeout(fallback.current);
  }, []);

  const later = (fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)); };

  const reveal = useCallback(() => {
    if (!awaitingCommit.current) return;
    awaitingCommit.current = false;
    if (fallback.current) { clearTimeout(fallback.current); fallback.current = null; }
    opacity.value = withTiming(0, { duration: FADE_OUT_MS, easing: Easing.inOut(Easing.quad) });
    later(() => { setVeil(null); busy.current = false; }, FADE_OUT_MS + 20);
  }, []);

  const toggle = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    const next = colorScheme === 'dark' ? 'light' : 'dark';

    setVeil(palettes[next].bg);
    opacity.value = withTiming(1, { duration: FADE_IN_MS, easing: Easing.out(Easing.quad) });

    later(() => {
      awaitingCommit.current = true;
      setColorScheme(next);
      setTheme(next);
      fallback.current = setTimeout(reveal, MAX_WAIT_MS);
    }, FADE_IN_MS);
  }, [colorScheme, reveal]);

  // Effects run after the whole tree has committed; wait one more frame so
  // the new colours are actually on screen before lifting the veil.
  useEffect(() => {
    if (awaitingCommit.current) requestAnimationFrame(reveal);
  }, [colorScheme]);

  const veilStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <ThemeToggleContext.Provider value={toggle}>
      {children}
      {veil && (
        // Swallows taps mid-transition so the theme can't be double-toggled.
        <Animated.View pointerEvents="auto" style={[StyleSheet.absoluteFill, { backgroundColor: veil }, veilStyle]} />
      )}
    </ThemeToggleContext.Provider>
  );
}
