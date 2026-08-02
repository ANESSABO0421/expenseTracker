import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import AnimatedCard from '../components/AnimatedCard';

export default function AnalyticsScreen() {
  const { transactions, insights, isGeneratingInsights, generateInsights } = useStore();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Generate insights on mount if empty, or just rely on manual refresh
  useEffect(() => {
    if (insights.length === 0 && transactions.length > 0) {
      generateInsights(transactions);
    }
  }, [transactions.length]);

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

        {isGeneratingInsights ? (
          <View className="bg-white dark:bg-[#111] p-10 rounded-[40px] items-center justify-center mt-4 shadow-xl shadow-gray-200/50 dark:shadow-none border border-transparent dark:border-[#222]">
            <ActivityIndicator size="large" color={isDark ? "#E11D48" : "#0EA5E9"} className="mb-6" />
            <Text className="text-black dark:text-white text-2xl font-black tracking-tighter text-center">Analyzing Data</Text>
            <Text className="text-gray-500 font-bold mt-2 text-center">Our AI is predicting your financial trends...</Text>
          </View>
        ) : (
          <View>
            {insights.map((insight, index) => {
              
              // Map text colors
              const getIconBg = () => {
                switch(insight.color) {
                  case 'red': return 'bg-red-50 dark:bg-red-500/10';
                  case 'green': return 'bg-green-50 dark:bg-green-500/10';
                  case 'blue': return 'bg-blue-50 dark:bg-blue-500/10';
                  case 'orange': return 'bg-orange-50 dark:bg-orange-500/10';
                  case 'purple': return 'bg-purple-50 dark:bg-purple-500/10';
                  default: return 'bg-gray-50 dark:bg-gray-500/10';
                }
              };

              const getIconColor = () => {
                switch(insight.color) {
                  case 'red': return '#EF4444';
                  case 'green': return '#10B981';
                  case 'blue': return '#0EA5E9';
                  case 'orange': return '#F59E0B';
                  case 'purple': return '#8B5CF6';
                  default: return '#6B7280';
                }
              };

              return (
                <AnimatedCard key={index} delay={(index + 1) * 100} className="mb-6">
                  <View className="bg-white dark:bg-[#111] p-6 rounded-[32px] shadow-xl shadow-gray-200/50 dark:shadow-none border border-transparent dark:border-[#222] flex-row items-start">
                    <View className={`w-14 h-14 ${getIconBg()} rounded-full items-center justify-center mr-5`}>
                      <Ionicons name={insight.icon as any || "analytics"} size={28} color={getIconColor()} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-black dark:text-white text-xl font-black mb-1">{insight.title}</Text>
                      <Text className="text-gray-500 dark:text-gray-400 font-bold leading-5">{insight.message}</Text>
                    </View>
                  </View>
                </AnimatedCard>
              );
            })}
          </View>
        )}

        <View className="h-12" />
      </ScrollView>
    </SafeAreaView>
  );
}
