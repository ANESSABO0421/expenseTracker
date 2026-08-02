import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { useGoogleAuth } from '../utils/useGoogleAuth';
import Svg, { Path, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={styles.logoSection}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoSymbol}>$</Text>
            </View>
            <Text style={styles.appName}>Expense Tracker</Text>
            <Text style={styles.tagline}>Smart financial management</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Tabs */}
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, isLogin && styles.tabActive]}
                onPress={() => setIsLogin(true)}
              >
                <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, !isLogin && styles.tabActive]}
                onPress={() => setIsLogin(false)}
              >
                <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Create Account</Text>
              </TouchableOpacity>
            </View>

            {/* Error */}
            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Fields */}
            {!isLogin && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="John Doe"
                  placeholderTextColor="#8E8E93"
                  style={styles.input}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#8E8E93"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#8E8E93"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  style={[styles.input, styles.passwordInput]}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={18} color="#8E8E93" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit */}
            {isLoading ? (
              <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 8 }} />
            ) : (
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
                <Text style={styles.submitText}>{isLogin ? 'Sign In' : 'Create Account'}</Text>
              </TouchableOpacity>
            )}

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google */}
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  logoSection: { alignItems: 'center', marginBottom: 32 },
  logoIcon: { width: 64, height: 64, borderRadius: 18, backgroundColor: '#007AFF', alignItems: 'center', justifyContent: 'center', marginBottom: 14, shadowColor: '#007AFF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8 },
  logoSymbol: { color: '#FFFFFF', fontSize: 30, fontWeight: '800' },
  appName: { color: '#FFFFFF', fontSize: 26, fontWeight: '700', letterSpacing: -0.5, marginBottom: 6 },
  tagline: { color: '#8E8E93', fontSize: 15 },
  card: { backgroundColor: '#1C1C1E', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  tabs: { flexDirection: 'row', backgroundColor: '#2C2C2E', borderRadius: 12, padding: 3, marginBottom: 22 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#3A3A3C' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#8E8E93' },
  tabTextActive: { color: '#FFFFFF' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255, 59, 48, 0.12)', borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText: { flex: 1, color: '#FF3B30', fontSize: 14 },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { color: '#8E8E93', fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: { backgroundColor: '#2C2C2E', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: '#FFFFFF', fontSize: 16 },
  passwordContainer: { position: 'relative' },
  passwordInput: { paddingRight: 50 },
  eyeBtn: { position: 'absolute', right: 16, top: 0, bottom: 0, justifyContent: 'center' },
  submitBtn: { backgroundColor: '#007AFF', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4, shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  submitText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: '#3A3A3C' },
  dividerText: { color: '#8E8E93', fontSize: 14 },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#2C2C2E', borderRadius: 14, paddingVertical: 15 },
  googleText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
