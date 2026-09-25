import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, KeyboardAvoidingView, Platform, ScrollView, Dimensions, StyleSheet, TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown, FadeInUp, FadeIn, LinearTransition, useAnimatedStyle, withSpring, withRepeat, withTiming, useSharedValue, Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { StatusBar } from 'expo-status-bar';
import { useStore } from '../store/useStore';
import { useGoogleAuth } from '../utils/useGoogleAuth';
import SpendovaLogo from '../components/SpendovaLogo';
import { useTheme, brand, radius } from '../theme';
import { PressableScale, PrimaryButton } from '../components/ui';

const { height, width } = Dimensions.get('window');
const TAB_W = width - 48 - 8;

type IconName = keyof typeof Ionicons.glyphMap;

const FEATURES: { icon: IconName; label: string }[] = [
  { icon: 'sparkles', label: 'AI insights' },
  { icon: 'scan', label: 'Scan bills' },
  { icon: 'flag', label: 'Smart goals' },
];

function Field({ icon, right, ...props }: TextInputProps & { icon: IconName; right?: React.ReactNode }) {
  const { c } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.field, { backgroundColor: c.surfaceAlt, borderColor: focused ? brand.primary : 'transparent' }]}>
      <Ionicons name={icon} size={19} color={focused ? brand.primary : c.textTertiary} />
      <TextInput
        placeholderTextColor={c.textTertiary}
        selectionColor={brand.primary}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.fieldInput, { color: c.text }]}
        {...props}
      />
      {right}
    </View>
  );
}

export default function WelcomeScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login, register, isLoading, error } = useStore();
  const { promptAsync } = useGoogleAuth();
  const { c, isDark, toggle } = useTheme();

  const tabPos = useSharedValue(0);
  useEffect(() => { tabPos.value = withSpring(isLogin ? 0 : 1, { damping: 18, stiffness: 160 }); }, [isLogin]);
  const sliderStyle = useAnimatedStyle(() => ({ transform: [{ translateX: tabPos.value * (TAB_W / 2) }] }));

  const float = useSharedValue(0);
  useEffect(() => {
    float.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []);
  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -6 * float.value }] }));

  const canSubmit = !!email && !!password && (isLogin || !!name);

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (isLogin) login(email, password);
    else register(name, email, password);
  };

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <StatusBar style="light" animated />
      {/* Hero */}
      <LinearGradient colors={c.heroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={[styles.blob, { width: 260, height: 260, top: -90, right: -90 }]} />
        <View style={[styles.blob, { width: 160, height: 160, bottom: 30, left: -60 }]} />
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <View style={styles.topRow}>
            <View />
            <PressableScale onPress={toggle} style={styles.themeBtn}>
              <Ionicons name={isDark ? 'sunny' : 'moon'} size={18} color="#FFF" />
            </PressableScale>
          </View>
          <Animated.View entering={FadeInDown.duration(700).springify()} style={styles.brandBlock}>
            <Animated.View style={[styles.logoTile, floatStyle]}>
              <SpendovaLogo size={64} />
            </Animated.View>
            <Text style={styles.appName}>Spendova</Text>
            <Text style={styles.tagline}>Money, made effortless.</Text>
            <View style={styles.features}>
              {FEATURES.map((f, i) => (
                <Animated.View key={f.label} entering={FadeIn.delay(300 + i * 120)} style={styles.feature}>
                  <Ionicons name={f.icon} size={12} color="#FFF" />
                  <Text style={styles.featureText}>{f.label}</Text>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>

      {/* Form sheet */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap}>
        <Animated.View entering={FadeInUp.delay(120).duration(450)} style={[styles.sheet, { backgroundColor: c.surface }]}>
          <ScrollView showsVerticalScrollIndicator={false} bounces={false} keyboardShouldPersistTaps="handled">
            <Text style={[styles.sheetTitle, { color: c.text }]}>{isLogin ? 'Welcome back 👋' : 'Create your account'}</Text>
            <Text style={[styles.sheetSub, { color: c.textSecondary }]}>
              {isLogin ? 'Sign in to pick up where you left off.' : 'It takes less than a minute.'}
            </Text>

            <View style={[styles.tabs, { backgroundColor: c.surfaceAlt }]}>
              <Animated.View style={[styles.tabSlider, { backgroundColor: c.surface, width: TAB_W / 2 }, sliderStyle]} />
              {[{ k: true, l: 'Sign in' }, { k: false, l: 'Register' }].map(t => (
                <PressableScale key={t.l} style={styles.tab} onPress={() => setIsLogin(t.k)} scaleTo={0.97}>
                  <Text style={[styles.tabText, { color: isLogin === t.k ? c.text : c.textSecondary }]}>{t.l}</Text>
                </PressableScale>
              ))}
            </View>

            {error ? (
              <Animated.View entering={FadeInDown.duration(300)} style={[styles.errorBox, { backgroundColor: c.expenseSoft }]}>
                <Ionicons name="alert-circle" size={17} color={brand.expense} />
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            ) : null}

            <Animated.View layout={LinearTransition.springify()} style={{ gap: 12 }}>
              {!isLogin && (
                <Animated.View entering={FadeInDown.duration(300)}>
                  <Field icon="person-outline" value={name} onChangeText={setName} placeholder="Full name" autoCapitalize="words" textContentType="name" />
                </Animated.View>
              )}
              <Field icon="mail-outline" value={email} onChangeText={setEmail} placeholder="Email address"
                keyboardType="email-address" autoCapitalize="none" textContentType="emailAddress" autoComplete="email" />
              <Field
                icon="lock-closed-outline"
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                textContentType={isLogin ? 'password' : 'newPassword'}
                returnKeyType="go"
                onSubmitEditing={handleSubmit}
                right={
                  <PressableScale onPress={() => setShowPassword(s => !s)} hitSlop={10}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={19} color={c.textTertiary} />
                  </PressableScale>
                }
              />

              <PrimaryButton
                title={isLogin ? 'Sign in' : 'Create account'}
                onPress={handleSubmit}
                loading={isLoading}
                disabled={!canSubmit}
                colors={[brand.primary, brand.hot]}
                trailing={<Ionicons name="arrow-forward" size={18} color="#FFF" />}
                style={{ marginTop: 6 }}
              />

              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
                <Text style={[styles.dividerText, { color: c.textTertiary }]}>or</Text>
                <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
              </View>

              <PressableScale onPress={() => promptAsync()} scaleTo={0.97} style={[styles.googleBtn, { borderColor: c.border, backgroundColor: c.surface }]}>
                <Svg width={20} height={20} viewBox="0 0 48 48">
                  <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </Svg>
                <Text style={[styles.googleText, { color: c.text }]}>Continue with Google</Text>
              </PressableScale>

              <Text style={[styles.legal, { color: c.textTertiary }]}>
                By continuing you agree to keep your finances in great shape. 🧡
              </Text>
            </Animated.View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { height: height * 0.44, overflow: 'hidden' },
  blob: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 6 },
  themeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  brandBlock: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 36 },
  logoTile: { width: 88, height: 88, borderRadius: 28, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
  appName: { color: '#FFF', fontSize: 34, fontWeight: '900', letterSpacing: -1, marginTop: 16 },
  tagline: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: '600', marginTop: 4 },
  features: { flexDirection: 'row', gap: 8, marginTop: 16 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  featureText: { color: '#FFF', fontSize: 12, fontWeight: '800' },

  sheetWrap: { flex: 1, marginTop: -28 },
  sheet: { flex: 1, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 24, paddingTop: 26 },
  sheetTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.6 },
  sheetSub: { fontSize: 14, fontWeight: '500', marginTop: 4, marginBottom: 18 },

  tabs: { flexDirection: 'row', borderRadius: 16, padding: 4, marginBottom: 16 },
  tabSlider: { position: 'absolute', top: 4, bottom: 4, left: 4, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  tab: { flex: 1, paddingVertical: 11, alignItems: 'center' },
  tabText: { fontSize: 14.5, fontWeight: '800' },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12, marginBottom: 14 },
  errorText: { flex: 1, color: brand.expense, fontSize: 13, fontWeight: '700' },

  field: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 56, borderRadius: radius.md, paddingHorizontal: 16, borderWidth: 1.5 },
  fieldInput: { flex: 1, fontSize: 15.5, fontWeight: '600', paddingVertical: 0 },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 8 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12.5, fontWeight: '600' },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 54, borderRadius: radius.md, borderWidth: 1.5 },
  googleText: { fontSize: 15.5, fontWeight: '800' },
  legal: { fontSize: 12, textAlign: 'center', marginTop: 6, marginBottom: 30 },
});
