import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, Dimensions, StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { useGoogleAuth } from '../utils/useGoogleAuth';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown, FadeInUp, Layout, SlideInRight,
  useAnimatedStyle, withSpring, withTiming, withRepeat,
  interpolateColor, useSharedValue, Easing
} from 'react-native-reanimated';
import SpendovaLogo from '../components/SpendovaLogo';
import Svg, { Path, G } from 'react-native-svg';

const { height, width } = Dimensions.get('window');
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

// Tab container inner width (padding 4 on each side)
const TAB_INNER_W = width - 64 - 8; // screen - horizontal padding - inner padding

export default function WelcomeScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login, register, isLoading, error, theme, toggleTheme } = useStore();
  const { promptAsync } = useGoogleAuth();

  // ── Critical fix: initialize SharedValue with the REAL current theme ──
  const isDark = useSharedValue(theme === 'dark' ? 1 : 0);
  useEffect(() => {
    isDark.value = withTiming(theme === 'dark' ? 1 : 0, { duration: 500 });
  }, [theme]);

  // ── Tab slider ──
  const tabPos = useSharedValue(0);
  useEffect(() => {
    tabPos.value = withSpring(isLogin ? 0 : 1, { damping: 16, stiffness: 120 });
  }, [isLogin]);

  // ── Logo breathing pulse ──
  const logoScale = useSharedValue(1);
  useEffect(() => {
    logoScale.value = withRepeat(
      withTiming(1.06, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      -1, // infinite
      true // reverse
    );
  }, []);

  // ── Animated styles ──
  const logoAnim = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const sliderStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabPos.value * (TAB_INNER_W / 2) }],
    width: TAB_INNER_W / 2,
    backgroundColor: interpolateColor(isDark.value, [0, 1], ['#FFFFFF', '#3A3A3C']),
  }));

  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(isDark.value, [0, 1], ['#F0F0F5', '#000000']),
  }));

  const textPrimaryStyle = useAnimatedStyle(() => ({
    color: interpolateColor(isDark.value, [0, 1], ['#000000', '#FFFFFF']),
  }));

  const textSecondaryStyle = useAnimatedStyle(() => ({
    color: interpolateColor(isDark.value, [0, 1], ['#6B6B80', '#8E8E93']),
  }));

  const bottomSheetStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(isDark.value, [0, 1], ['#FFFFFF', '#111111']),
  }));

  const tabsContainerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(isDark.value, [0, 1], ['#E8E8EE', '#2C2C2E']),
  }));

  const activeTabStyle = useAnimatedStyle(() => ({
    color: interpolateColor(isDark.value, [0, 1], ['#000000', '#FFFFFF']),
  }));

  const inputStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(isDark.value, [0, 1], ['#F2F2F7', '#1C1C1E']),
    color: interpolateColor(isDark.value, [0, 1], ['#000000', '#FFFFFF']),
  }));

  const submitBtnStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(isDark.value, [0, 1], ['#000000', '#FFFFFF']),
  }));

  const submitTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(isDark.value, [0, 1], ['#FFFFFF', '#000000']),
  }));

  const googleBtnStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(isDark.value, [0, 1], ['#FFFFFF', '#1C1C1E']),
    borderColor: interpolateColor(isDark.value, [0, 1], ['#E5E5EA', '#3A3A3C']),
  }));

  const dividerLineStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(isDark.value, [0, 1], ['#E5E5EA', '#2C2C2E']),
  }));

  const handleSubmit = () => {
    if (!email || !password) return;
    if (isLogin) login(email, password);
    else { if (!name) return; register(name, email, password); }
  };

  return (
    <Animated.View style={[styles.container, containerStyle]}>

      {/* Theme Toggle */}
      <SafeAreaView style={styles.themeToggleContainer} pointerEvents="box-none">
        <TouchableOpacity onPress={toggleTheme} style={styles.themeToggleBtn} activeOpacity={0.8}>
          <Ionicons
            name={theme === 'dark' ? 'sunny' : 'moon'}
            size={20}
            color={theme === 'dark' ? '#FFD60A' : '#5E5CE6'}
          />
        </TouchableOpacity>
      </SafeAreaView>

      {/* ── Top: Logo section ── */}
      <View style={styles.topSection}>
        <Animated.View entering={FadeInDown.duration(700).springify()} style={styles.logoContainer}>
          {/* Animated breathing logo */}
          <Animated.View style={logoAnim}>
            <SpendovaLogo theme={theme} size={96} />
          </Animated.View>
          <Animated.Text style={[styles.appName, textPrimaryStyle]}>Spendova</Animated.Text>
          <Animated.Text style={[styles.tagline, textSecondaryStyle]}>Intelligent Wealth</Animated.Text>
        </Animated.View>
      </View>

      {/* ── Bottom sheet ── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.bottomSheetContainer}
      >
        <Animated.View
          entering={FadeInUp.delay(250).duration(700).springify().damping(16)}
          style={[styles.bottomSheet, bottomSheetStyle]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Animated pill tab switcher */}
            <Animated.View style={[styles.tabsContainer, tabsContainerStyle]}>
              {/* Sliding pill — sits INSIDE the padding box */}
              <Animated.View style={[styles.tabSlider, sliderStyle]} />
              <TouchableOpacity style={styles.tab} onPress={() => setIsLogin(true)} activeOpacity={1}>
                <Animated.Text style={[styles.tabText, isLogin ? activeTabStyle : textSecondaryStyle]}>
                  Sign In
                </Animated.Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tab} onPress={() => setIsLogin(false)} activeOpacity={1}>
                <Animated.Text style={[styles.tabText, !isLogin ? activeTabStyle : textSecondaryStyle]}>
                  Register
                </Animated.Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Error */}
            {error ? (
              <Animated.View entering={FadeInDown.duration(400)} style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            ) : null}

            {/* Form */}
            <Animated.View layout={Layout.springify()}>
              {!isLogin && (
                <Animated.View entering={SlideInRight.duration(400)} layout={Layout.springify()}>
                  <AnimatedTextInput
                    value={name} onChangeText={setName}
                    placeholder="Full Name" placeholderTextColor="#8E8E93"
                    style={[styles.input, inputStyle]}
                    autoCapitalize="words"
                  />
                </Animated.View>
              )}

              <AnimatedTextInput
                value={email} onChangeText={setEmail}
                placeholder="Email Address" placeholderTextColor="#8E8E93"
                keyboardType="email-address" autoCapitalize="none"
                style={[styles.input, inputStyle]}
              />

              <View style={styles.passwordContainer}>
                <AnimatedTextInput
                  value={password} onChangeText={setPassword}
                  placeholder="Password" placeholderTextColor="#8E8E93"
                  secureTextEntry={!showPassword} autoCapitalize="none"
                  style={[styles.input, styles.passwordInput, inputStyle]}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#8E8E93" />
                </TouchableOpacity>
              </View>

              {/* Submit */}
              <TouchableOpacity onPress={handleSubmit} activeOpacity={0.85} style={styles.submitBtnWrapper}>
                <Animated.View style={[styles.submitBtn, submitBtnStyle]}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color={theme === 'dark' ? '#000000' : '#FFFFFF'} />
                  ) : (
                    <Animated.Text style={[styles.submitText, submitTextStyle]}>
                      {isLogin ? 'Sign In' : 'Create Account'}
                    </Animated.Text>
                  )}
                </Animated.View>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <Animated.View style={[styles.dividerLine, dividerLineStyle]} />
                <Animated.Text style={[styles.dividerText, textSecondaryStyle]}>OR</Animated.Text>
                <Animated.View style={[styles.dividerLine, dividerLineStyle]} />
              </View>

              {/* Google */}
              <TouchableOpacity onPress={() => promptAsync()} activeOpacity={0.85}>
                <Animated.View style={[styles.googleBtn, googleBtnStyle]}>
                  <Svg width="18" height="18" viewBox="0 0 24 24">
                    <G fill="none" fillRule="evenodd">
                      <Path d="M9 12.25c0-.39.05-.77.14-1.14l-3.21-2.48A11.97 11.97 0 0 0 5 12c0 1.25.19 2.45.54 3.59l3.32-2.58A6.87 6.87 0 0 1 9 12.25z" fill="#FBBC05" />
                      <Path d="M12.25 9c1.23 0 2.35.42 3.23 1.25l2.42-2.42A11.94 11.94 0 0 0 12.25 5c-3.13 0-5.89 1.7-7.39 4.19l3.21 2.48c.36-1.57 1.76-2.67 3.43-2.67z" fill="#EA4335" />
                      <Path d="M12.25 15.5c-1.67 0-3.07-1.1-3.43-2.67l-3.32 2.58A11.94 11.94 0 0 0 12.25 19c2.72 0 5.2-.91 7.15-2.44l-2.92-2.26A6.85 6.85 0 0 1 12.25 15.5z" fill="#34A853" />
                      <Path d="M19 12c0-.52-.05-1.03-.15-1.52H12v3.04h3.94A3.37 3.37 0 0 1 14.5 15.8l2.92 2.26C19.13 16.5 20.25 14.53 20.25 12c0-.68-.1-1.35-.25-2L19 12z" fill="#4285F4" />
                    </G>
                  </Svg>
                  <Animated.Text style={[styles.googleText, textPrimaryStyle]}>
                    Continue with Google
                  </Animated.Text>
                </Animated.View>
              </TouchableOpacity>

            </Animated.View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  themeToggleContainer: { position: 'absolute', top: 0, right: 16, zIndex: 20 },
  themeToggleBtn: {
    marginTop: 8,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(128,128,128,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  topSection: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 16 },
  logoContainer: { alignItems: 'center' },
  appName: { fontSize: 34, fontWeight: '800', letterSpacing: -0.8, marginTop: 14 },
  tagline: { fontSize: 15, fontWeight: '500', marginTop: 4 },

  bottomSheetContainer: { justifyContent: 'flex-end', maxHeight: height * 0.72 },
  bottomSheet: {
    borderTopLeftRadius: 36, borderTopRightRadius: 36,
    paddingHorizontal: 32, paddingTop: 28,
    paddingBottom: Platform.OS === 'ios' ? 48 : 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 20,
  },

  // Tab container has padding: 4 inside
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: 22,
    marginBottom: 28,
    padding: 4,
    position: 'relative',
    overflow: 'hidden',         // ← prevents the slider from bleeding out
  },
  // Slider fills exactly one tab slot and sits within the padding
  tabSlider: {
    position: 'absolute',
    top: 4, bottom: 4, left: 4,  // respect container's 4px padding
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: { flex: 1, paddingVertical: 13, alignItems: 'center', zIndex: 1 },
  tabText: { fontSize: 15, fontWeight: '700' },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,59,48,0.1)',
    borderRadius: 12, padding: 14, marginBottom: 18,
  },
  errorText: { flex: 1, color: '#FF3B30', fontSize: 13, fontWeight: '600' },

  input: {
    borderRadius: 14, height: 56,
    paddingHorizontal: 18, fontSize: 16,
    marginBottom: 14, fontWeight: '500',
  },
  passwordContainer: { position: 'relative' },
  passwordInput: { paddingRight: 50 },
  eyeBtn: {
    position: 'absolute', right: 0, top: 0, bottom: 14,
    width: 54, alignItems: 'center', justifyContent: 'center',
  },

  submitBtnWrapper: { marginTop: 6 },
  submitBtn: {
    borderRadius: 14, height: 56,
    alignItems: 'center', justifyContent: 'center',
  },
  submitText: { fontSize: 17, fontWeight: '800' },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 24 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13, fontWeight: '600' },

  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 12, borderWidth: 1.5, borderRadius: 14, height: 56,
  },
  googleText: { fontSize: 16, fontWeight: '700' },
});
