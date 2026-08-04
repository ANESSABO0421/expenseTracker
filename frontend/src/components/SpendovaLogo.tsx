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
   * SPENDOVA LOGO — MATCHING THE PROVIDED PURPLE/GLOW STYLE
   */

  // Bar bottoms fixed at y=46 (with round linecaps, they actually extend down by half the stroke width)
  const BAR1 = "M20 46V41";   // short  (5 units tall),  x=20
  const BAR2 = "M28 46V33";   // medium (13 units tall), x=28
  const BAR3 = "M36 46V23";   // tall   (23 units tall), x=36

  // Arrow shoots diagonally from top of BAR3 to top-right
  const ARROW_STEM = "M36 23L45 16";
  // Arrowhead — thicker and pointing up-right
  const ARROW_HEAD = "M45 16L38 16M45 16L45 23";

  // Outer hexagon shape
  const HEX = "M32 4L56 18V46L32 60L8 46V18L32 4Z";

  // Inner hexagon shape for the border highlight
  const INNER_HEX = "M32 9L52 20.5V43.5L32 55L12 43.5V20.5L32 9Z";

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>

      {/* ── LIGHT THEME ── Vibrant Purple (matching user image) */}
      <Animated.View style={lightStyle}>
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <Defs>
            <LinearGradient id="lgHexL" x1="0%" y1="0%" x2="0%" y2="100%">
              {/* Very subtle gradient, looks almost solid vibrant purple */}
              <Stop offset="0%" stopColor="#7B52FB" />
              <Stop offset="100%" stopColor="#6C3CE8" />
            </LinearGradient>
            <LinearGradient id="lgBarsL" x1="0%" y1="100%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
            </LinearGradient>
          </Defs>

          {/* Filled hexagon background */}
          <Path d={HEX} fill="url(#lgHexL)" />

          {/* Distinct inner hex stroke (matching the image's lighter border) */}
          <Path
            d={INNER_HEX}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1.5"
            fill="none"
          />

          {/* Rising bar chart - THICKER AND ROUNDER */}
          <Path d={BAR1} stroke="url(#lgBarsL)" strokeWidth="4.5" strokeLinecap="round" />
          <Path d={BAR2} stroke="url(#lgBarsL)" strokeWidth="4.5" strokeLinecap="round" />
          <Path d={BAR3} stroke="url(#lgBarsL)" strokeWidth="4.5" strokeLinecap="round" />

          {/* Diagonal arrow leap */}
          <Path d={ARROW_STEM} stroke="url(#lgBarsL)" strokeWidth="4" strokeLinecap="round" />
          <Path d={ARROW_HEAD} stroke="url(#lgBarsL)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Animated.View>

      {/* ── DARK THEME ── Cyan → Emerald neon glow (Thicker lines to match) */}
      <Animated.View style={darkStyle}>
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <Defs>
            <LinearGradient id="lgHexD" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#0891B2" />
              <Stop offset="100%" stopColor="#059669" />
            </LinearGradient>
            <LinearGradient id="lgBarsD" x1="0%" y1="100%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#A7F3D0" stopOpacity="0.85" />
              <Stop offset="100%" stopColor="#ECFDF5" stopOpacity="1" />
            </LinearGradient>
          </Defs>

          {/* Filled hexagon background */}
          <Path d={HEX} fill="url(#lgHexD)" />

          {/* Subtle inner hex stroke for depth */}
          <Path
            d={INNER_HEX}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1.5"
            fill="none"
          />

          {/* Rising bar chart */}
          <Path d={BAR1} stroke="url(#lgBarsD)" strokeWidth="4.5" strokeLinecap="round" />
          <Path d={BAR2} stroke="url(#lgBarsD)" strokeWidth="4.5" strokeLinecap="round" />
          <Path d={BAR3} stroke="url(#lgBarsD)" strokeWidth="4.5" strokeLinecap="round" />

          {/* Diagonal arrow leap */}
          <Path d={ARROW_STEM} stroke="url(#lgBarsD)" strokeWidth="4" strokeLinecap="round" />
          <Path d={ARROW_HEAD} stroke="url(#lgBarsD)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Animated.View>

    </View>
  );
}
