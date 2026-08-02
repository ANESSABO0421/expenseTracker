import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useStore, Transaction } from '../store/useStore';
import AnimatedCard from '../components/AnimatedCard';

export default function DashboardScreen({ navigation }: any) {
  const { user, transactions, fetchTransactions, isLoading } = useStore();
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    if (user?._id) {
      fetchTransactions(user._id);
    }
  }, [user]);

  // Totals
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Chart Data
  const expenses = transactions.filter(t => t.type === 'expense').reverse();
  const lineData = expenses.length > 0 
    ? expenses.map(t => ({ value: t.amount, label: t.category.substring(0, 3) }))
    : [{ value: 0, label: 'N/A' }];
  const barData = expenses.length > 0
    ? expenses.map(t => ({ value: t.amount, label: t.category.substring(0, 3), frontColor: isDark ? '#E11D48' : '#0EA5E9' }))
    : [{ value: 0, label: 'N/A', frontColor: isDark ? '#333' : '#E5E7EB' }];

  const renderTransaction = (t: Transaction, index: number) => {
    const isIncome = t.type === 'income';
    return (
      <AnimatedCard key={t._id} delay={index * 100} className="mb-4">
        <View className="flex-row items-center bg-white dark:bg-[#111111] p-5 rounded-[32px] shadow-xl shadow-gray-200/50 dark:shadow-none border border-transparent dark:border-[#222]">
          <View className={`w-14 h-14 rounded-full items-center justify-center ${isIncome ? 'bg-[#10B981]' : 'bg-[#111111] dark:bg-[#222]'}`}>
            <Ionicons name={isIncome ? "arrow-down" : "arrow-up"} size={28} color={isIncome ? "#FFF" : (isDark ? "#FFF" : "#000")} />
          </View>
          <View className="flex-1 ml-5">
            <Text className="text-black dark:text-white text-xl font-black">{t.category}</Text>
            <Text className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase mt-1">{new Date(t.date).toLocaleDateString()}</Text>
          </View>
          <Text className={`text-2xl font-black tracking-tighter ${isIncome ? 'text-[#10B981]' : 'text-black dark:text-white'}`}>
            {isIncome ? '+' : '-'}${t.amount.toFixed(0)}
          </Text>
        </View>
      </AnimatedCard>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F2F4F7] dark:bg-[#050505]" edges={['top']}>
      <ScrollView className="flex-1 px-5 pt-4 pb-12" showsVerticalScrollIndicator={false}>
        
        {/* Maximalist Header with Theme Toggle */}
        <View className="flex-row justify-between items-end mb-8 mt-2">
          <View className="flex-1">
            <Text className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">Overview</Text>
            <Text className="text-black dark:text-white text-4xl font-black tracking-tighter leading-none">{user?.name?.split(' ')[0] || 'User'}</Text>
          </View>
          <View className="flex-row items-center">
            {/* Theme Toggle Button */}
            <TouchableOpacity 
              onPress={toggleColorScheme}
              className="w-12 h-12 rounded-full bg-white dark:bg-[#111] items-center justify-center mr-3 shadow-sm shadow-gray-200 dark:shadow-none border border-transparent dark:border-[#222]"
            >
              <Ionicons name={isDark ? "sunny" : "moon"} size={22} color={isDark ? "#E11D48" : "#0EA5E9"} />
            </TouchableOpacity>
            <Image 
              source={{ uri: user?.avatar || 'https://cdn-icons-png.flaticon.com/512/847/847969.png' }} 
              className="w-16 h-16 rounded-[24px] bg-white dark:bg-[#111] shadow-lg shadow-gray-300 dark:shadow-none"
            />
          </View>
        </View>

        {/* Massive Vibrant Balance Card */}
        <AnimatedCard delay={100} className="mb-8">
          <LinearGradient
            colors={isDark ? ['#4F46E5', '#E11D48'] : ['#0EA5E9', '#6366F1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-8 rounded-[40px] shadow-2xl shadow-black/40"
          >
            <Text className="text-white/80 text-sm font-bold uppercase tracking-widest mb-2">Total Balance</Text>
            <Text className="text-white text-6xl font-black tracking-tighter mb-8">${balance.toFixed(2)}</Text>
            
            <View className="flex-row justify-between bg-white/20 p-5 rounded-[24px]">
              <View>
                <Text className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1">Income</Text>
                <Text className="text-white text-xl font-black">${totalIncome.toFixed(0)}</Text>
              </View>
              <View className="w-[1px] bg-white/30" />
              <View>
                <Text className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1">Expense</Text>
                <Text className="text-white text-xl font-black">${totalExpense.toFixed(0)}</Text>
              </View>
            </View>
          </LinearGradient>
        </AnimatedCard>

        {/* Analytics Section */}
        <AnimatedCard delay={200} className="mb-8">
          <View className="bg-white dark:bg-[#111111] p-6 rounded-[40px] shadow-xl shadow-gray-200/50 dark:shadow-none border border-transparent dark:border-[#222]">
            
            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-black dark:text-white text-2xl font-black tracking-tighter">Analytics</Text>
              
              {/* Chunky Segmented Toggle */}
              <View className="flex-row bg-[#F2F4F7] dark:bg-[#222] rounded-full p-1">
                <TouchableOpacity 
                  onPress={() => setChartType('line')}
                  className={`px-5 py-2.5 rounded-full ${chartType === 'line' ? 'bg-white dark:bg-[#333] shadow-sm' : 'bg-transparent'}`}
                >
                  <Text className={`font-black ${chartType === 'line' ? 'text-black dark:text-white' : 'text-gray-400'}`}>LINE</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setChartType('bar')}
                  className={`px-5 py-2.5 rounded-full ${chartType === 'bar' ? 'bg-white dark:bg-[#333] shadow-sm' : 'bg-transparent'}`}
                >
                  <Text className={`font-black ${chartType === 'bar' ? 'text-black dark:text-white' : 'text-gray-400'}`}>BAR</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="items-center justify-center">
              {chartType === 'line' ? (
                <LineChart
                  data={lineData}
                  width={280}
                  height={180}
                  thickness={5}
                  color={isDark ? "#E11D48" : "#0EA5E9"}
                  startFillColor={isDark ? "#E11D48" : "#0EA5E9"}
                  endFillColor={isDark ? "#111" : "#FFF"}
                  startOpacity={0.4}
                  endOpacity={0.0}
                  initialSpacing={10}
                  noOfSections={4}
                  yAxisTextStyle={{ color: isDark ? '#666' : '#999', fontWeight: 'bold' }}
                  xAxisLabelTextStyle={{ color: isDark ? '#666' : '#999', fontSize: 10, fontWeight: 'bold' }}
                  yAxisColor={isDark ? "#333" : "#F2F4F7"}
                  xAxisColor={isDark ? "#333" : "#F2F4F7"}
                  hideDataPoints
                  areaChart
                  isAnimated
                  animationDuration={1000}
                />
              ) : (
                <BarChart
                  data={barData}
                  width={280}
                  height={180}
                  barWidth={28}
                  spacing={20}
                  noOfSections={4}
                  barBorderRadius={8}
                  yAxisTextStyle={{ color: isDark ? '#666' : '#999', fontWeight: 'bold' }}
                  xAxisLabelTextStyle={{ color: isDark ? '#666' : '#999', fontSize: 10, fontWeight: 'bold' }}
                  yAxisColor={isDark ? "#333" : "#F2F4F7"}
                  xAxisColor={isDark ? "#333" : "#F2F4F7"}
                  isAnimated
                  animationDuration={1000}
                />
              )}
            </View>
          </View>
        </AnimatedCard>

        {/* Transactions List */}
        <View className="mb-4">
          <Text className="text-black dark:text-white text-3xl font-black tracking-tighter mb-6">Recent</Text>
          
          {isLoading ? (
            <ActivityIndicator size="large" color={isDark ? "#E11D48" : "#0EA5E9"} className="mt-8" />
          ) : transactions.length > 0 ? (
            transactions.slice(0, 5).map((t, index) => renderTransaction(t, index))
          ) : (
            <View className="bg-white dark:bg-[#111] p-10 rounded-[32px] items-center mt-2 shadow-xl shadow-gray-200/50 dark:shadow-none border border-transparent dark:border-[#222]">
              <View className="w-20 h-20 bg-[#F2F4F7] dark:bg-[#222] rounded-full items-center justify-center mb-4">
                <Ionicons name="receipt" size={32} color={isDark ? "#666" : "#CCC"} />
              </View>
              <Text className="text-black dark:text-white text-xl font-black">No Activity</Text>
              <Text className="text-gray-500 font-bold mt-2 text-center">Your recent transactions will appear here.</Text>
            </View>
          )}
        </View>

        <View className="h-12" />
      </ScrollView>

      {/* Floating Action Button for Add Transaction */}
      <View className="absolute bottom-6 right-6">
        <TouchableOpacity 
          onPress={() => navigation.navigate('AddTransaction')}
          className="w-16 h-16 rounded-[24px] bg-black dark:bg-white items-center justify-center shadow-xl shadow-black/40"
        >
          <Ionicons name="add" size={32} color={isDark ? "#000" : "#FFF"} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
