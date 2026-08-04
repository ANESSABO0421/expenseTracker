import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PieChart } from 'react-native-gifted-charts';
import { useStore } from '../store/useStore';
import AnimatedCard from '../components/AnimatedCard';
import { formatCurrency } from '../utils/formatCurrency';

export default function AnalyticsScreen() {
  const { transactions, insights, isGeneratingInsights, generateInsights, currency, exchangeRates } = useStore();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Toggle for base vs selected currency
  const [showBaseCurrency, setShowBaseCurrency] = useState(false);
  const displayCurrency = showBaseCurrency ? 'USD' : currency;

  const bg = isDark ? '#000000' : '#F2F2F7';
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#1C1C1E';
  const textSecondary = isDark ? '#8E8E93' : '#6C6C70';
  const separator = isDark ? '#2C2C2E' : '#E5E5EA';

  useEffect(() => {
    if (insights.length === 0) generateInsights(transactions);
  }, [transactions.length, insights.length]);

  // Enhanced Pie chart data with premium gradients
  const pieMap: Record<string, number> = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    pieMap[t.category] = (pieMap[t.category] || 0) + t.amount;
  });
  
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const colors = [
    { color: '#FF2A54', gradientCenterColor: '#FF9B82' }, // Neon Red -> Peach
    { color: '#00F2FE', gradientCenterColor: '#4FACFE' }, // Neon Cyan -> Blue
    { color: '#FFD700', gradientCenterColor: '#FF8C00' }, // Gold -> Deep Orange
    { color: '#B066FE', gradientCenterColor: '#63E2FF' }, // Purple -> Cyan
    { color: '#00E676', gradientCenterColor: '#1DE9B6' }, // Neon Green -> Teal
  ];

  let maxVal = -1;
  let maxIdx = -1;
  const pieData = Object.keys(pieMap).map((cat, i) => {
    const val = pieMap[cat];
    if (val > maxVal) { maxVal = val; maxIdx = i; }
    const c = colors[i % colors.length];
    return {
      value: val,
      text: val > totalExpense * 0.08 ? Math.round((val / totalExpense) * 100) + '%' : '',
      color: c.color,
      gradientCenterColor: c.gradientCenterColor,
      textColor: '#FFFFFF',
      textBackgroundRadius: 12,
      fontWeight: '800',
      label: cat,
      focused: false,
    };
  });
  if (pieData[maxIdx]) pieData[maxIdx].focused = true;

  const getIconColor = (color: string) => {
    const map: Record<string, string> = { red: '#FF3B30', green: '#34C759', blue: '#007AFF', orange: '#FF9500', purple: '#AF52DE' };
    return map[color] || '#007AFF';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: separator }]}>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Analytics</Text>
        <TouchableOpacity onPress={() => generateInsights(transactions)} style={[styles.iconBtn, { backgroundColor: cardBg }]}>
          <Ionicons name="refresh" size={18} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Pie Chart */}
        {pieData.length > 0 && (
          <AnimatedCard delay={50}>
            <LinearGradient
              colors={isDark ? ['#2C2C2E', '#1C1C1E'] : ['#FFFFFF', '#F9FAFB']}
              style={[styles.card, { borderWidth: 1, borderColor: isDark ? '#3A3A3C' : '#E5E5EA' }]}
              start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: textPrimary }]}>Expense Breakdown</Text>
                {currency !== 'USD' && (
                  <TouchableOpacity 
                    onPress={() => setShowBaseCurrency(!showBaseCurrency)}
                    style={[styles.currencyToggle, { backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7' }]}
                  >
                    <Ionicons name="swap-horizontal" size={14} color="#007AFF" />
                    <Text style={[styles.currencyToggleText, { color: textPrimary }]}>{displayCurrency}</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={[styles.pieWrapper, { shadowColor: isDark ? pieData[maxIdx]?.color || '#00C6FF' : '#007AFF', shadowOpacity: 0.25, shadowRadius: 30, shadowOffset: { width: 0, height: 10 } }]}>
                <PieChart
                  data={pieData.map(d => ({ ...d, text: '' }))} // Remove inner text for ultra-clean ring
                  donut
                  showGradient
                  sectionAutoFocus
                  focusOnPress
                  radius={115}
                  innerRadius={85}
                  innerCircleColor={isDark ? '#2C2C2E' : '#FFFFFF'} // Match the LinearGradient start color
                  strokeWidth={isDark ? 6 : 4}
                  strokeColor={isDark ? '#2C2C2E' : '#FFFFFF'}
                  shadow={false} // Disable internal shadow, using wrapper shadow for glowing effect
                  centerLabelComponent={() => (
                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 13, color: textSecondary, marginBottom: 2, fontWeight: '600' }}>Total Spent</Text>
                      <Text style={{ fontSize: 24, color: textPrimary, fontWeight: '800' }}>
                        {formatCurrency(totalExpense, displayCurrency, exchangeRates)}
                      </Text>
                    </View>
                  )}
                />
              </View>
              <View style={styles.pieLegendHorizontal}>
                {pieData.map((item, i) => (
                  <View key={i} style={[styles.legendPill, { backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7', borderWidth: 1, borderColor: isDark ? '#4A4A4C' : '#E5E5EA' }]}>
                    <LinearGradient
                      colors={[item.color, item.gradientCenterColor]}
                      style={styles.legendDot}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    />
                    <Text style={[styles.legendLabel, { color: textPrimary }]}>{item.label}</Text>
                    <Text style={[styles.legendValue, { color: textSecondary }]}>
                      {Math.round((item.value / totalExpense) * 100)}%
                    </Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </AnimatedCard>
        )}

        {/* AI Insights */}
        <Text style={[styles.sectionTitle, { color: textPrimary }]}>AI Insights</Text>

        {isGeneratingInsights ? (
          <View style={[styles.card, { backgroundColor: cardBg, alignItems: 'center', paddingVertical: 40 }]}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={[styles.loadingText, { color: textSecondary }]}>Analyzing your finances...</Text>
          </View>
        ) : (
          insights.map((insight, index) => (
            <AnimatedCard key={index} delay={(index + 1) * 80}>
              <View style={[styles.insightCard, { backgroundColor: cardBg }]}>
                <LinearGradient
                  colors={[getIconColor(insight.color) + '15', 'transparent']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <View style={[styles.insightIcon, { 
                  backgroundColor: getIconColor(insight.color) + '20',
                  shadowColor: getIconColor(insight.color), 
                  shadowOpacity: 0.4, 
                  shadowRadius: 10, 
                  shadowOffset: { width: 0, height: 4 }
                }]}>
                  <Ionicons name={(insight.icon as any) || 'analytics'} size={24} color={getIconColor(insight.color)} />
                </View>
                <View style={styles.insightContent}>
                  <Text style={[styles.insightTitle, { color: textPrimary }]}>{insight.title}</Text>
                  <Text style={[styles.insightMsg, { color: textSecondary }]}>{insight.message}</Text>
                </View>
              </View>
            </AnimatedCard>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  card: { marginHorizontal: 20, marginBottom: 16, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  currencyToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  currencyToggleText: { fontSize: 12, fontWeight: '600' },
  pieWrapper: { alignItems: 'center', justifyContent: 'center', marginVertical: 10 },
  pieLegendHorizontal: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 28 },
  legendPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { fontSize: 13, fontWeight: '600' },
  legendValue: { fontSize: 13, fontWeight: '500' },
  sectionTitle: { fontSize: 24, fontWeight: '800', paddingHorizontal: 20, marginBottom: 16, marginTop: 12 },
  loadingText: { marginTop: 14, fontSize: 15, fontWeight: '500' },
  insightCard: { flexDirection: 'row', alignItems: 'flex-start', marginHorizontal: 20, marginBottom: 12, borderRadius: 20, padding: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  insightIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  insightContent: { flex: 1 },
  insightTitle: { fontSize: 17, fontWeight: '800', marginBottom: 6, letterSpacing: -0.3 },
  insightMsg: { fontSize: 14, lineHeight: 22 },
});
