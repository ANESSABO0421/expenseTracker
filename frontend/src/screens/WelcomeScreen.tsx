import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { useGoogleAuth } from '../utils/useGoogleAuth';
import Svg, { Path, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, ZoomIn, Layout } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login, register, isLoading, error } = useStore();
  const { promptAsync } = useGoogleAuth();

  const handleSubmit = () => {
    if (!email || !password) return;
    if (isLogin) login(email, password);
    else { if (!name) return; register(name, email, password); }
  };

  return (
    <View style={styles.container}>
      {/* Deep Space Background */}
      <LinearGradient
        colors={['#0F172A', '#020617']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />
      
      {/* Decorative Ambient Glowing Orbs */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      {/* Floating Sparkles / Accents (Simulated by small glowing dots) */}
      <View style={[styles.sparkle, { top: height * 0.15, left: width * 0.2 }]} />
      <View style={[styles.sparkle, { top: height * 0.4, right: width * 0.15, transform: [{ scale: 1.5 }] }]} />
      <View style={[styles.sparkle, { bottom: height * 0.3, left: width * 0.1, transform: [{ scale: 0.8 }] }]} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            
            {/* Logo Section */}
            <Animated.View 
              entering={ZoomIn.duration(1000).springify().damping(12)} 
              style={styles.logoSection}
            >
              <LinearGradient
                colors={['#38BDF8', '#818CF8']}
                style={styles.logoIcon}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <Ionicons name="infinite" size={40} color="#FFFFFF" style={styles.logoShadow} />
              </LinearGradient>
              <Text style={styles.appName}>Antigravity Tracker</Text>
              <Text style={styles.tagline}>Intelligent wealth management</Text>
            </Animated.View>

            {/* Auth Glass Card */}
            <Animated.View entering={FadeInUp.delay(300).duration(800).springify().damping(14)} layout={Layout.springify()}>
              <BlurView intensity={35} tint="dark" style={styles.glassCard}>
                
                {/* Tabs */}
                <View style={styles.tabs}>
                  <TouchableOpacity style={[styles.tab, isLogin && styles.tabActive]} onPress={() => setIsLogin(true)}>
                    <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Sign In</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.tab, !isLogin && styles.tabActive]} onPress={() => setIsLogin(false)}>
                    <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Create Account</Text>
                  </TouchableOpacity>
                </View>

                {/* Error */}
                {error ? (
                  <Animated.View entering={FadeInDown.duration(400)} style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                    <Text style={styles.errorText}>{error}</Text>
                  </Animated.View>
                ) : null}

                {/* Fields */}
                {!isLogin && (
                  <Animated.View entering={FadeInDown.duration(400)} layout={Layout.springify()} style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Full Name</Text>
                    <TextInput
                      value={name} onChangeText={setName}
                      placeholder="John Doe" placeholderTextColor="#64748B"
                      style={styles.input} autoCapitalize="words"
                    />
                  </Animated.View>
                )}

                <Animated.View layout={Layout.springify()} style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Email Address</Text>
                  <TextInput
                    value={email} onChangeText={setEmail}
                    placeholder="you@example.com" placeholderTextColor="#64748B"
                    keyboardType="email-address" autoCapitalize="none" style={styles.input}
                  />
                </Animated.View>

                <Animated.View layout={Layout.springify()} style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      value={password} onChangeText={setPassword}
                      placeholder="••••••••" placeholderTextColor="#64748B"
                      secureTextEntry={!showPassword} autoCapitalize="none"
                      style={[styles.input, styles.passwordInput]}
                    />
                    <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                </Animated.View>

                {/* Submit */}
                {isLoading ? (
                  <ActivityIndicator size="large" color="#38BDF8" style={{ marginTop: 12, marginBottom: 12 }} />
                ) : (
                  <TouchableOpacity style={styles.submitBtnWrapper} onPress={handleSubmit} activeOpacity={0.85}>
                    <LinearGradient
                      colors={['#38BDF8', '#6366F1']}
                      style={styles.submitBtn}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.submitText}>{isLogin ? 'Sign In' : 'Create Account'}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Google Button */}
                <TouchableOpacity style={styles.googleBtn} onPress={() => promptAsync()} activeOpacity={0.85}>
                  <Svg width="20" height="20" viewBox="0 0 24 24">
                    <G fill="none" fillRule="evenodd">
                      <Path d="M9 12.25c0-.39.05-.77.14-1.14l-3.21-2.48A11.97 11.97 0 0 0 5 12c0 1.25.19 2.45.54 3.59l3.32-2.58A6.87 6.87 0 0 1 9 12.25z" fill="#FBBC05" />
                      <Path d="M12.25 9c1.23 0 2.35.42 3.23 1.25l2.42-2.42A11.94 11.94 0 0 0 12.25 5c-3.13 0-5.89 1.7-7.39 4.19l3.21 2.48c.36-1.57 1.76-2.67 3.43-2.67z" fill="#EA4335" />
                      <Path d="M12.25 15.5c-1.67 0-3.07-1.1-3.43-2.67l-3.32 2.58A11.94 11.94 0 0 0 12.25 19c2.72 0 5.2-.91 7.15-2.44l-2.92-2.26A6.85 6.85 0 0 1 12.25 15.5z" fill="#34A853" />
                      <Path d="M19 12c0-.52-.05-1.03-.15-1.52H12v3.04h3.94A3.37 3.37 0 0 1 14.5 15.8l2.92 2.26C19.13 16.5 20.25 14.53 20.25 12c0-.68-.1-1.35-.25-2L19 12z" fill="#4285F4" />
                    </G>
                  </Svg>
                  <Text style={styles.googleText}>Continue with Google</Text>
                </TouchableOpacity>

              </BlurView>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  glowTop: { position: 'absolute', top: -height * 0.1, left: -width * 0.2, width: width * 1.2, height: width * 1.2, borderRadius: width * 0.6, backgroundColor: 'rgba(56, 189, 248, 0.15)', transform: [{ scale: 1.5 }] },
  glowBottom: { position: 'absolute', bottom: -height * 0.1, right: -width * 0.2, width: width * 1.2, height: width * 1.2, borderRadius: width * 0.6, backgroundColor: 'rgba(129, 140, 248, 0.15)', transform: [{ scale: 1.5 }] },
  sparkle: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: '#38BDF8', shadowColor: '#38BDF8', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10, elevation: 5 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoSection: { alignItems: 'center', marginBottom: 40 },
  logoIcon: { width: 80, height: 80, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 20, shadowColor: '#38BDF8', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 15 },
  logoShadow: { textShadowColor: 'rgba(255,255,255,0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 },
  appName: { color: '#FFFFFF', fontSize: 32, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 },
  tagline: { color: '#94A3B8', fontSize: 16, fontWeight: '500' },
  glassCard: { borderRadius: 36, padding: 30, overflow: 'hidden', backgroundColor: 'rgba(30, 41, 59, 0.4)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  tabs: { flexDirection: 'row', backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: 20, padding: 6, marginBottom: 26, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 16, alignItems: 'center' },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.1)' },
  tabText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  tabTextActive: { color: '#F8FAFC' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239, 68, 68, 0.15)', borderRadius: 12, padding: 14, marginBottom: 18, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  errorText: { flex: 1, color: '#FCA5A5', fontSize: 14, fontWeight: '500' },
  fieldGroup: { marginBottom: 20 },
  fieldLabel: { color: '#94A3B8', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  input: { backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 18, color: '#F8FAFC', fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  passwordContainer: { position: 'relative' },
  passwordInput: { paddingRight: 50 },
  eyeBtn: { position: 'absolute', right: 16, top: 0, bottom: 0, justifyContent: 'center' },
  submitBtnWrapper: { marginTop: 12, shadowColor: '#38BDF8', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 12 },
  submitBtn: { borderRadius: 20, paddingVertical: 20, alignItems: 'center' },
  submitText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 14, marginVertical: 28 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, paddingVertical: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  googleText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
