import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, useColorScheme, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import AnimatedCard from '../components/AnimatedCard';

export default function AnalyticsScreen() {
  const { transactions } = useStore();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [isGenerating, setIsGenerating] = useState(true);

  // MOCK: Generate Insights
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  return (
    <SafeAreaView className="flex-1 bg-[#F2F4F7] dark:bg-[#050505]" edges={['top']}>
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-[#111]">
        <Text className="text-black dark:text-white text-3xl font-black tracking-tighter">Insights</Text>
        <TouchableOpacity 
          onPress={toggleColorScheme}
          className="w-12 h-12 rounded-full bg-white dark:bg-[#111] items-center justify-center shadow-sm shadow-gray-200 dark:shadow-none border border-transparent dark:border-[#222]"
        >
          <Ionicons name={isDark ? "sunny" : "moon"} size={22} color={isDark ? "#E11D48" : "#0EA5E9"} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5 pt-6 pb-12" showsVerticalScrollIndicator={false}>
        <View className="mb-8">
          <Text className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">AI Analysis</Text>
          <Text className="text-black dark:text-white text-4xl font-black tracking-tighter leading-none">Smart Budget</Text>
        </View>

        {isGenerating ? (
          <View className="bg-white dark:bg-[#111] p-10 rounded-[40px] items-center justify-center mt-4 shadow-xl shadow-gray-200/50 dark:shadow-none border border-transparent dark:border-[#222]">
            <ActivityIndicator size="large" color={isDark ? "#E11D48" : "#0EA5E9"} className="mb-6" />
            <Text className="text-black dark:text-white text-2xl font-black tracking-tighter text-center">Analyzing Data</Text>
            <Text className="text-gray-500 font-bold mt-2 text-center">Our AI is predicting your financial trends...</Text>
          </View>
        ) : (
          <View>
            <AnimatedCard delay={100} className="mb-6">
              <View className="bg-white dark:bg-[#111] p-6 rounded-[32px] shadow-xl shadow-gray-200/50 dark:shadow-none border border-transparent dark:border-[#222] flex-row items-start">
                <View className="w-14 h-14 bg-red-50 dark:bg-red-500/10 rounded-full items-center justify-center mr-5">
                  <Ionicons name="warning" size={28} color="#EF4444" />
                </View>
                <View className="flex-1">
                  <Text className="text-black dark:text-white text-xl font-black mb-1">High Spending Alert</Text>
                  <Text className="text-gray-500 dark:text-gray-400 font-bold leading-5">You've spent ${totalExpense.toFixed(0)} so far this month. At this rate, you will exceed your average budget by 15%.</Text>
                </View>
              </View>
            </AnimatedCard>

            <AnimatedCard delay={200} className="mb-6">
              <View className="bg-white dark:bg-[#111] p-6 rounded-[32px] shadow-xl shadow-gray-200/50 dark:shadow-none border border-transparent dark:border-[#222] flex-row items-start">
                <View className="w-14 h-14 bg-green-50 dark:bg-green-500/10 rounded-full items-center justify-center mr-5">
                  <Ionicons name="trending-up" size={28} color="#10B981" />
                </View>
                <View className="flex-1">
                  <Text className="text-black dark:text-white text-xl font-black mb-1">Income Growth</Text>
                  <Text className="text-gray-500 dark:text-gray-400 font-bold leading-5">Your income stream is up 8% compared to last month. Great job staying consistent!</Text>
                </View>
              </View>
            </AnimatedCard>

            <AnimatedCard delay={300} className="mb-6">
              <View className="bg-white dark:bg-[#111] p-6 rounded-[32px] shadow-xl shadow-gray-200/50 dark:shadow-none border border-transparent dark:border-[#222] flex-row items-start">
                <View className="w-14 h-14 bg-blue-50 dark:bg-blue-500/10 rounded-full items-center justify-center mr-5">
                  <Ionicons name="restaurant" size={28} color="#0EA5E9" />
                </View>
                <View className="flex-1">
                  <Text className="text-black dark:text-white text-xl font-black mb-1">Category Focus: Food</Text>
                  <Text className="text-gray-500 dark:text-gray-400 font-bold leading-5">Consider cooking at home more often. You can save approximately $120 next week by reducing eating out.</Text>
                </View>
              </View>
            </AnimatedCard>
          </View>
        )}

        <View className="h-12" />
      </ScrollView>
    </SafeAreaView>
  );
}
