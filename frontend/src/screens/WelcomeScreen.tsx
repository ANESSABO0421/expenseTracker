import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useStore } from '../store/useStore';
import PremiumButton from '../components/PremiumButton';
import AnimatedCard from '../components/AnimatedCard';
import Svg, { Path, G } from 'react-native-svg';

export default function WelcomeScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { login, register, googleLogin, isLoading, error } = useStore();

  const handleSubmit = () => {
    if (!email || !password) return;
    if (isLogin) {
      login(email, password);
    } else {
      if (!name) return;
      register(name, email, password);
    }
  };

  const handleGoogleSignIn = () => {
    // Mimic Google SSO Auth response for local testing and developer debugging
    googleLogin(
      'google_user_id_' + Math.random().toString(36).substr(2, 9),
      'google_user_' + Math.random().toString(36).substr(2, 4) + '@gmail.com',
      'Google User',
      'https://lh3.googleusercontent.com/a/default-user'
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      className="flex-1 bg-[#0F0F13]"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} className="p-6">
        <View className="items-center mb-8">
          <View className="w-16 h-16 rounded-2xl bg-[#6366F1] items-center justify-center shadow-lg shadow-indigo-500/50">
            <Text className="text-white text-3xl font-bold">$</Text>
          </View>
          <Text className="text-white text-2xl font-bold tracking-widest mt-4">EXPENSE TRACKER</Text>
          <Text className="text-gray-400 text-sm mt-1">Premium Wealth & Cashflow Manager</Text>
        </View>

        <AnimatedCard>
          {/* Tabs header */}
          <View className="flex-row bg-[#0F0F13] p-1 rounded-xl mb-6 border border-gray-800">
            <Pressable 
              onPress={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-lg items-center ${isLogin ? 'bg-[#1A1A24] border border-gray-800' : ''}`}
            >
              <Text className={`font-semibold ${isLogin ? 'text-white' : 'text-gray-400'}`}>Log In</Text>
            </Pressable>
            <Pressable 
              onPress={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-lg items-center ${!isLogin ? 'bg-[#1A1A24] border border-gray-800' : ''}`}
            >
              <Text className={`font-semibold ${!isLogin ? 'text-white' : 'text-gray-400'}`}>Sign Up</Text>
            </Pressable>
          </View>

          {error && (
            <View className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl mb-4">
              <Text className="text-red-400 text-sm">{error}</Text>
            </View>
          )}

          {/* Form Fields */}
          {!isLogin && (
            <View className="mb-4">
              <Text className="text-gray-400 text-sm mb-2 font-medium">Full Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="John Doe"
                placeholderTextColor="#6B7280"
                className="bg-[#0F0F13] border border-gray-800 rounded-xl px-4 py-3.5 text-white text-base focus:border-indigo-500"
              />
            </View>
          )}

          <View className="mb-4">
            <Text className="text-gray-400 text-sm mb-2 font-medium">Email Address</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="example@mail.com"
              placeholderTextColor="#6B7280"
              keyboardType="email-address"
              autoCapitalize="none"
              className="bg-[#0F0F13] border border-gray-800 rounded-xl px-4 py-3.5 text-white text-base focus:border-indigo-500"
            />
          </View>

          <View className="mb-6">
            <Text className="text-gray-400 text-sm mb-2 font-medium">Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#6B7280"
              secureTextEntry
              autoCapitalize="none"
              className="bg-[#0F0F13] border border-gray-800 rounded-xl px-4 py-3.5 text-white text-base focus:border-indigo-500"
            />
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color="#6366F1" className="py-4" />
          ) : (
            <PremiumButton 
              title={isLogin ? 'Log In' : 'Sign Up'} 
              onPress={handleSubmit} 
              className="mb-4"
            />
          )}

          {/* Divider */}
          <View className="flex-row items-center my-4">
            <View className="flex-1 h-[1px] bg-gray-800" />
            <Text className="text-gray-400 text-xs px-4">OR</Text>
            <View className="flex-1 h-[1px] bg-gray-800" />
          </View>

          {/* Google Sign-in Button */}
          <Pressable 
            onPress={handleGoogleSignIn}
            disabled={isLoading}
            className="flex-row w-full bg-[#1A1A24] border border-gray-800 py-4 rounded-2xl items-center justify-center active:bg-gray-800"
          >
            <Svg width="20" height="20" viewBox="0 0 24 24" className="mr-3">
              <G fill="none" fillRule="evenodd">
                <Path
                  d="M9 12.25c0-.39.05-.77.14-1.14l-3.21-2.48A11.97 11.97 0 0 0 5 12c0 1.25.19 2.45.54 3.59l3.32-2.58A6.87 6.87 0 0 1 9 12.25z"
                  fill="#FBBC05"
                />
                <Path
                  d="M12.25 9c1.23 0 2.35.42 3.23 1.25l2.42-2.42A11.94 11.94 0 0 0 12.25 5c-3.13 0-5.89 1.7-7.39 4.19l3.21 2.48c.36-1.57 1.76-2.67 3.43-2.67z"
                  fill="#EA4335"
                />
                <Path
                  d="M12.25 15.5c-1.67 0-3.07-1.1-3.43-2.67l-3.32 2.58A11.94 11.94 0 0 0 12.25 19c2.72 0 5.2-.91 7.15-2.44l-2.92-2.26A6.85 6.85 0 0 1 12.25 15.5z"
                  fill="#34A853"
                />
                <Path
                  d="M19 12c0-.52-.05-1.03-.15-1.52H12v3.04h3.94A3.37 3.37 0 0 1 14.5 15.8l2.92 2.26C19.13 16.5 20.25 14.53 20.25 12c0-.68-.1-1.35-.25-2L19 12z"
                  fill="#4285F4"
                />
              </G>
            </Svg>
            <Text className="text-white text-base font-semibold">Continue with Google</Text>
          </Pressable>
        </AnimatedCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
