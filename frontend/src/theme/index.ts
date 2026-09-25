import { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'nativewind';

// ── Brand ──────────────────────────────────────────────────────────────────
// One warm, confident accent carries the whole app (the way food-delivery apps
// lean on a single brand colour). Income/expense keep their semantic colours.
export const brand = {
  primary: '#FF6B2C',
  primaryDeep: '#E8531A',
  hot: '#FF3D6E',
  income: '#12B76A',
  expense: '#F04438',
  gold: '#D4B26A',
  emerald: '#48C79A',
  fire: '#FF6B35',
  violet: '#7A5AF8',
};

const light = {
  bg: '#F5F6FA',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F1F6',
  elevated: '#FFFFFF',
  text: '#1B1D29',
  textSecondary: '#6B6F80',
  textTertiary: '#A3A6B4',
  border: '#E8E9F0',
  divider: '#EFF0F4',
  overlay: 'rgba(15,16,24,0.45)',
  primarySoft: 'rgba(255,107,44,0.10)',
  incomeSoft: 'rgba(18,183,106,0.10)',
  expenseSoft: 'rgba(240,68,56,0.10)',
  shadow: '#1B1D29',
  heroGradient: ['#FF7A2F', '#FF3D6E'] as readonly [string, string],
  tabBar: '#FFFFFF',
};

const dark: typeof light = {
  bg: '#0B0C10',
  surface: '#16171D',
  surfaceAlt: '#1F2028',
  elevated: '#1C1D24',
  text: '#F4F5F8',
  textSecondary: '#9A9DAB',
  textTertiary: '#5E6170',
  border: '#26272F',
  divider: '#212229',
  overlay: 'rgba(0,0,0,0.6)',
  primarySoft: 'rgba(255,107,44,0.16)',
  incomeSoft: 'rgba(18,183,106,0.16)',
  expenseSoft: 'rgba(240,68,56,0.16)',
  shadow: '#000000',
  heroGradient: ['#F2651F', '#D92E6B'] as readonly [string, string],
  tabBar: '#16171D',
};

export type Palette = typeof light;
export const palettes = { light, dark };

/** Provided by ThemeTransitionProvider: switches theme behind a crossfade. */
export const ThemeToggleContext = createContext<(() => void) | null>(null);

export const radius = { sm: 10, md: 14, lg: 20, xl: 26, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };

export const shadow = (c: Palette, level: 1 | 2 | 3 = 1) => ({
  shadowColor: c.shadow,
  shadowOffset: { width: 0, height: level * 3 },
  shadowOpacity: c === dark ? 0.35 : 0.05 + level * 0.02,
  shadowRadius: 6 + level * 5,
  elevation: level * 3,
});

/**
 * Single source of truth for colours. Reads NativeWind's colour scheme so the
 * existing theme toggle keeps working everywhere; `toggle` animates the switch
 * when rendered inside ThemeTransitionProvider.
 */
export function useTheme() {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const animatedToggle = useContext(ThemeToggleContext);
  const isDark = colorScheme === 'dark';
  const toggle = animatedToggle ?? toggleColorScheme;
  return useMemo(
    () => ({ isDark, c: isDark ? dark : light, toggle }),
    [isDark, toggle]
  );
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥', CAD: 'CA$', AUD: 'A$',
};

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 5) return 'Up late';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
