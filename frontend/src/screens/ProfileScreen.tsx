import React from 'react';
import { View, Text, Image, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { Ionicons } from '@expo/vector-icons';
import AnimatedCard from '../components/AnimatedCard';

export default function ProfileScreen() {
  const { user, logout } = useStore();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleLogout = () => {
    logout();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F2F4F7] dark:bg-[#050505]" edges={['top']}>
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-[#111]">
        <Text className="text-black dark:text-white text-3xl font-black tracking-tighter">Profile</Text>
        <TouchableOpacity 
          onPress={toggleColorScheme}
          className="w-12 h-12 rounded-full bg-white dark:bg-[#111] items-center justify-center shadow-sm shadow-gray-200 dark:shadow-none border border-transparent dark:border-[#222]"
        >
          <Ionicons name={isDark ? "sunny" : "moon"} size={22} color={isDark ? "#E11D48" : "#0EA5E9"} />
        </TouchableOpacity>
      </View>

      <View className="flex-1 px-6 pt-6 pb-12 justify-between">
        <AnimatedCard delay={100}>
          <View className="bg-white dark:bg-[#111] p-8 rounded-[40px] items-center shadow-xl shadow-gray-200/50 dark:shadow-none border border-transparent dark:border-[#222]">
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} className="w-28 h-28 rounded-full border-4 border-[#0EA5E9] dark:border-[#E11D48] mb-6" />
            ) : (
              <View className="w-28 h-28 rounded-full bg-[#F2F4F7] dark:bg-[#222] border-4 border-[#0EA5E9] dark:border-[#E11D48] items-center justify-center mb-6">
                <Text className="text-black dark:text-white text-4xl font-black">{user?.name ? getInitials(user.name) : 'U'}</Text>
              </View>
            )}
            <Text className="text-black dark:text-white text-2xl font-black">{user?.name || 'Guest User'}</Text>
            <Text className="text-gray-500 dark:text-gray-400 text-base font-bold mt-1">{user?.email || 'guest@mail.com'}</Text>
          </View>
        </AnimatedCard>

        <View className="mt-10 flex-1">
          <Text className="text-gray-400 dark:text-gray-600 text-xs font-bold uppercase tracking-widest mb-4">App Preferences</Text>
          <View className="bg-white dark:bg-[#111] rounded-[32px] px-6 shadow-xl shadow-gray-200/50 dark:shadow-none border border-transparent dark:border-[#222]">
            
            <View className="flex-row items-center justify-between py-6">
              <View className="flex-row items-center">
                <Ionicons name="cash" size={24} color={isDark ? "#E11D48" : "#0EA5E9"} />
                <Text className="text-black dark:text-white text-lg font-black ml-4">Currency</Text>
              </View>
              <Text className="text-gray-500 dark:text-gray-400 font-bold">USD ($)</Text>
            </View>

            <View className="h-[1px] bg-gray-100 dark:bg-[#222]" />

            <View className="flex-row items-center justify-between py-6">
              <View className="flex-row items-center">
                <Ionicons name="shield-checkmark" size={24} color="#10B981" />
                <Text className="text-black dark:text-white text-lg font-black ml-4">Account</Text>
              </View>
              <Text className="text-gray-500 dark:text-gray-400 font-bold">Verified</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          onPress={handleLogout} 
          className="flex-row items-center justify-center bg-red-50 dark:bg-red-500/10 py-5 rounded-[24px] border border-red-100 dark:border-red-500/20"
        >
          <Ionicons name="log-out" size={24} color="#EF4444" />
          <Text className="text-[#EF4444] text-lg font-black ml-3">SIGN OUT</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
