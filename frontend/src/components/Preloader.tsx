import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet, Dimensions } from 'react-native';
import Svg, {
  Circle, Path, Defs, LinearGradient, Stop, G
} from 'react-native-svg';
import { useStore } from '../store/useStore';
import SpendovaLogo from './SpendovaLogo';

const { width: SCREEN_W } = Dimensions.get('window');

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface PreloaderProps {
  onFinish: () => void;
  // True once the app has actually finished loading (session restore, etc).
  // The preloader fades out when this flips true instead of on a guessed timer.
  ready: boolean;
}

export default function Preloader({ onFinish, ready }: PreloaderProps) {
  const { theme } = useStore();
  const isDark = theme === 'dark';

  // --- Animation values ---
  const containerOpacity = useRef(new Animated.Value(1)).current;

  // Outer ring rotation
  const outerRotate = useRef(new Animated.Value(0)).current;
  // Inner ring rotation (counter-clockwise)
  const innerRotate = useRef(new Animated.Value(0)).current;
  // Stroke dash fill (0→full arc)
  const outerDash = useRef(new Animated.Value(251)).current;   // 2π×40
  const innerDash = useRef(new Animated.Value(157)).current;   // 2π×25

  // Logo scale + opacity
  const logoScale = useRef(new Animated.Value(0.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  // Text opacity
  const nameOpacity = useRef(new Animated.Value(0)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;

  // Three staggered dots pulse
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  // Shimmer line translate
  const shimmer = useRef(new Animated.Value(-SCREEN_W)).current;

  useEffect(() => {
    // ── Outer ring: continuous rotation + arc fill ──
    Animated.loop(
      Animated.timing(outerRotate, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(innerRotate, {
        toValue: -1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.timing(outerDash, {
      toValue: 30,
      duration: 2000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.timing(innerDash, {
      toValue: 20,
      duration: 1800,
      delay: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // ── Logo zoom in ──
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 7,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();

    // ── Text cascade ──
    Animated.sequence([
      Animated.delay(900),
      Animated.timing(nameOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.delay(200),
      Animated.timing(tagOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    // ── Dot pulse loop (staggered) ──
    const pulse = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ])
      );

    pulse(dot1, 1200).start();
    pulse(dot2, 1400).start();
    pulse(dot3, 1600).start();

    // ── Shimmer bar ──
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: SCREEN_W,
        duration: 2500,
        delay: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // ── Safety net: never hang forever even if `ready` somehow never arrives ──
    const failsafe = setTimeout(() => fadeOut(), 8000);
    return () => clearTimeout(failsafe);
  }, []);

  const fadeOut = () => {
    Animated.timing(containerOpacity, {
      toValue: 0,
      duration: 700,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => onFinish());
  };

  // ── Fade out once the app is actually ready (not on a guessed timer) ──
  useEffect(() => {
    if (ready) fadeOut();
  }, [ready]);

  const spinOuter = outerRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const spinInner = innerRotate.interpolate({ inputRange: [-1, 0], outputRange: ['-360deg', '0deg'] });

  const bgColor = isDark ? '#070711' : '#F8FAFF';
  const primaryStart = isDark ? '#06B6D4' : '#4F46E5';
  const primaryEnd = isDark ? '#10B981' : '#7C3AED';
  const textPrimary = isDark ? '#FFFFFF' : '#1E1B4B';
  const textAccent = isDark ? '#34D399' : '#4F46E5';

  return (
    <Animated.View style={[styles.root, { opacity: containerOpacity, backgroundColor: bgColor }]}>

      {/* ── Full-screen shimmer overlay ── */}
      <Animated.View
        style={[
          styles.shimmerBar,
          { transform: [{ translateX: shimmer }] },
          isDark ? styles.shimmerDark : styles.shimmerLight,
        ]}
      />

      {/* ── Double spinning rings + logo ── */}
      <View style={styles.ringContainer}>

        {/* Outer ring */}
        <Animated.View style={[styles.ringWrap, { transform: [{ rotate: spinOuter }] }]}>
          <Svg width={200} height={200} viewBox="0 0 100 100">
            <Defs>
              <LinearGradient id="outerG" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={primaryStart} stopOpacity="1" />
                <Stop offset="100%" stopColor={primaryEnd} stopOpacity="0.1" />
              </LinearGradient>
            </Defs>
            {/* Track */}
            <Circle cx="50" cy="50" r="40" stroke={isDark ? '#1E1B4B' : '#E0E7FF'} strokeWidth="3" fill="none" />
            {/* Arc */}
            <AnimatedCircle
              cx="50" cy="50" r="40"
              stroke="url(#outerG)"
              strokeWidth="4"
              fill="none"
              strokeDasharray="251"
              strokeDashoffset={outerDash}
              strokeLinecap="round"
              rotation="-90"
              origin="50,50"
            />
          </Svg>
        </Animated.View>

        {/* Inner ring */}
        <Animated.View style={[styles.innerRingWrap, { transform: [{ rotate: spinInner }] }]}>
          <Svg width={130} height={130} viewBox="0 0 100 100">
            <Defs>
              <LinearGradient id="innerG" x1="100%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={primaryEnd} stopOpacity="1" />
                <Stop offset="100%" stopColor={primaryStart} stopOpacity="0.15" />
              </LinearGradient>
            </Defs>
            {/* Track */}
            <Circle cx="50" cy="50" r="25" stroke={isDark ? '#1E293B' : '#EDE9FE'} strokeWidth="2.5" fill="none" />
            {/* Arc */}
            <AnimatedCircle
              cx="50" cy="50" r="25"
              stroke="url(#innerG)"
              strokeWidth="3.5"
              fill="none"
              strokeDasharray="157"
              strokeDashoffset={innerDash}
              strokeLinecap="round"
              rotation="-90"
              origin="50,50"
            />
          </Svg>
        </Animated.View>

        {/* Centre logo */}
        <Animated.View
          style={[
            styles.logoCenter,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
              backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
              shadowColor: primaryStart,
            },
          ]}
        >
          <SpendovaLogo theme={theme} size={56} />
        </Animated.View>
      </View>

      {/* ── App Name ── */}
      <Animated.Text style={[styles.appName, { opacity: nameOpacity, color: textPrimary }]}>
        Spendova
      </Animated.Text>

      {/* ── Tagline ── */}
      <Animated.Text style={[styles.tagline, { opacity: tagOpacity, color: textAccent }]}>
        Intelligent Wealth
      </Animated.Text>

      {/* ── Progress dots ── */}
      <View style={styles.dotsRow}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                opacity: dot,
                backgroundColor: i === 1 ? primaryEnd : primaryStart,
                transform: [{ scale: dot.interpolate({ inputRange: [0.3, 1], outputRange: [0.8, 1.3] }) }],
              },
            ]}
          />
        ))}
      </View>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  shimmerBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 80,
    zIndex: 0,
  },
  shimmerLight: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  shimmerDark: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  ringContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 1,
  },
  ringWrap: {
    position: 'absolute',
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRingWrap: {
    position: 'absolute',
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCenter: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
  },
  appName: {
    marginTop: 40,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
    zIndex: 1,
  },
  tagline: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 3,
    textTransform: 'uppercase',
    zIndex: 1,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 48,
    zIndex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
