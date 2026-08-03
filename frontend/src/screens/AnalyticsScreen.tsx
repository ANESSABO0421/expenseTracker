import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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

  // Pie chart data by category
  const pieMap: Record<string, number> = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    pieMap[t.category] = (pieMap[t.category] || 0) + t.amount;
  });
  const colors = ['#007AFF', '#FF3B30', '#34C759', '#FF9500', '#AF52DE'];
  const pieData = Object.keys(pieMap).map((cat, i) => ({
    value: pieMap[cat],
    text: cat.substring(0, 4),
    color: colors[i % colors.length],
    label: cat,
  }));

  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const getIconColor = (color: string) => {
    const map: Record<string, string> = { red: '#FF3B30', green: '#34C759', blue: '#007AFF', orange: '#FF9500', purple: '#AF52DE' };
    return map[color] || '#8E8E93';
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
            <View style={[styles.card, { backgroundColor: cardBg }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: textPrimary }]}>Expense Breakdown</Text>
                {currency !== 'USD' && (
                  <TouchableOpacity 
                    onPress={() => setShowBaseCurrency(!showBaseCurrency)}
                    style={[styles.currencyToggle, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}
                  >
                    <Ionicons name="swap-horizontal" size={14} color="#007AFF" />
                    <Text style={[styles.currencyToggleText, { color: textPrimary }]}>{displayCurrency}</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.pieWrapper}>
                <PieChart
                  data={pieData}
                  donut
                  showText
                  textColor="white"
                  radius={110}
                  innerRadius={75}
                  innerCircleColor={cardBg}
                  strokeWidth={3}
                  strokeColor={cardBg}
                  focusOnPress
                  centerLabelComponent={() => (
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ fontSize: 13, color: textSecondary, marginBottom: 4 }}>Total</Text>
                      <Text style={{ fontSize: 20, color: textPrimary, fontWeight: '800' }}>
                        {formatCurrency(totalExpense, displayCurrency, exchangeRates)}
                      </Text>
                    </View>
                  )}
                />
              </View>
              <View style={styles.pieLegendHorizontal}>
                {pieData.map((item, i) => (
                  <View key={i} style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Text style={[styles.legendLabel, { color: textSecondary }]}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
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
              <View style={[styles.insightCard, { backgroundColor: cardBg, borderBottomColor: separator }]}>
                <View style={[styles.insightIcon, { backgroundColor: getIconColor(insight.color) + '15' }]}>
                  <Ionicons name={(insight.icon as any) || 'analytics'} size={22} color={getIconColor(insight.color)} />
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
  pieLegendHorizontal: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 24 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 12, fontWeight: '500' },
  sectionTitle: { fontSize: 22, fontWeight: '700', paddingHorizontal: 20, marginBottom: 12, marginTop: 8 },
  loadingText: { marginTop: 14, fontSize: 15, fontWeight: '500' },
  insightCard: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  insightIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  insightContent: { flex: 1 },
  insightTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  insightMsg: { fontSize: 14, lineHeight: 20 },
});
