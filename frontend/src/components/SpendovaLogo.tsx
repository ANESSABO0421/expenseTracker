import React from 'react';
import { View } from 'react-native';
import Svg, {
  Path, Defs, LinearGradient, Stop, Circle, G, Polygon
} from 'react-native-svg';
import Animated, { useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';

interface LogoProps {
  theme?: 'light' | 'dark';
  size?: number;
}

export default function SpendovaLogo({ theme = 'light', size = 64 }: LogoProps) {
  const isDark = useDerivedValue(() => {
    return withTiming(theme === 'dark' ? 1 : 0, { duration: 600 });
  }, [theme]);

  const lightStyle = useAnimatedStyle(() => ({
    opacity: 1 - isDark.value,
    position: 'absolute',
  }));

  const darkStyle = useAnimatedStyle(() => ({
    opacity: isDark.value,
    position: 'absolute',
  }));

  /**
   * SPENDOVA LOGO — CENTERED INNER SYMBOL
   *
   * ViewBox: 0 0 64 64   →   center is (32, 32)
   *
   * Symbol horizontal span: x 19 → 45   →   midpoint = 32  ✓
   * Symbol vertical span:   y 18 → 46   →   midpoint = 32  ✓
   *
   * 3 ascending bars + diagonal arrow leap to top-right
   */

  // Bar bottoms fixed at y=46, tops ascending
  const BAR1 = "M19 46V40";   // short  (6 units tall),  x=19
  const BAR2 = "M27 46V33";   // medium (13 units tall), x=27
  const BAR3 = "M35 46V25";   // tall   (21 units tall), x=35

  // Arrow shoots diagonally from top of BAR3 to top-right
  const ARROW_STEM = "M35 25L45 18";
  // Arrowhead — two short lines from the tip
  const ARROW_HEAD = "M45 18L39 18M45 18L45 24";

  // Outer hexagon shape
  const HEX = "M32 4L56 18V46L32 60L8 46V18L32 4Z";

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>

      {/* ── LIGHT THEME ── Deep Indigo → Violet */}
      <Animated.View style={lightStyle}>
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <Defs>
            <LinearGradient id="lgHexL" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#4F46E5" />
              <Stop offset="100%" stopColor="#7C3AED" />
            </LinearGradient>
            <LinearGradient id="lgBarsL" x1="0%" y1="100%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
            </LinearGradient>
          </Defs>

          {/* Filled hexagon background */}
          <Path d={HEX} fill="url(#lgHexL)" />

          {/* Subtle inner hex stroke for depth */}
          <Path
            d="M32 10L52 21V43L32 54L12 43V21L32 10Z"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1"
            fill="none"
          />

          {/* Rising bar chart */}
          <Path d={BAR1} stroke="url(#lgBarsL)" strokeWidth="3.5" strokeLinecap="round" />
          <Path d={BAR2} stroke="url(#lgBarsL)" strokeWidth="3.5" strokeLinecap="round" />
          <Path d={BAR3} stroke="url(#lgBarsL)" strokeWidth="3.5" strokeLinecap="round" />

          {/* Diagonal arrow leap */}
          <Path d={ARROW_STEM} stroke="url(#lgBarsL)" strokeWidth="3" strokeLinecap="round" />
          <Path d={ARROW_HEAD} stroke="url(#lgBarsL)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Animated.View>

      {/* ── DARK THEME ── Cyan → Emerald neon glow */}
      <Animated.View style={darkStyle}>
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <Defs>
            <LinearGradient id="lgHexD" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#0891B2" />
              <Stop offset="100%" stopColor="#059669" />
            </LinearGradient>
            <LinearGradient id="lgBarsD" x1="0%" y1="100%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#A7F3D0" stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#ECFDF5" stopOpacity="1" />
            </LinearGradient>
          </Defs>

          {/* Filled hexagon background */}
          <Path d={HEX} fill="url(#lgHexD)" />

          {/* Subtle inner hex stroke for depth */}
          <Path
            d="M32 10L52 21V43L32 54L12 43V21L32 10Z"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1"
            fill="none"
          />

          {/* Rising bar chart */}
          <Path d={BAR1} stroke="url(#lgBarsD)" strokeWidth="3.5" strokeLinecap="round" />
          <Path d={BAR2} stroke="url(#lgBarsD)" strokeWidth="3.5" strokeLinecap="round" />
          <Path d={BAR3} stroke="url(#lgBarsD)" strokeWidth="3.5" strokeLinecap="round" />

          {/* Diagonal arrow leap */}
          <Path d={ARROW_STEM} stroke="url(#lgBarsD)" strokeWidth="3" strokeLinecap="round" />
          <Path d={ARROW_HEAD} stroke="url(#lgBarsD)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Animated.View>

    </View>
  );
}
