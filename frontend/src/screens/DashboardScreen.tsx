import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, StyleSheet, Dimensions, LayoutAnimation
} from 'react-native';
import Animated, { useSharedValue, withRepeat, withSequence, withTiming, useAnimatedStyle, Easing } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart, BarChart, PieChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useStore, Transaction } from '../store/useStore';
import AnimatedCard from '../components/AnimatedCard';
import { formatCurrency } from '../utils/formatCurrency';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }: any) {
  const { user, transactions, fetchTransactions, isLoading, currency, exchangeRates, enableConversion } = useStore();
  const [chartType, setChartType] = useState<'line' | 'bar' | 'donut'>('line');
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleToggleTheme = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    toggleColorScheme();
  };

  const bg = isDark ? '#000000' : '#F2F2F7';
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#1C1C1E';
  const textSecondary = isDark ? '#8E8E93' : '#6C6C70';
  const separator = isDark ? '#2C2C2E' : '#E5E5EA';

  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);

  useEffect(() => {
    if (user?._id) fetchTransactions(user._id);
    
    // Start avatar pulse animation
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 1500, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 0 })
      ),
      -1,
      false
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }),
        withTiming(0.6, { duration: 0 })
      ),
      -1,
      false
    );
  }, [user]);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const { totalIncome, totalExpense, balance } = useMemo(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach(t => {
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense') expense += t.amount;
    });
    return { totalIncome: income, totalExpense: expense, balance: income - expense };
  }, [transactions]);

  const CATEGORY_PALETTE = ['#007AFF', '#FF9500', '#34C759', '#AF52DE', '#FF3B30', '#5AC8FA', '#FFCC00', '#FF2D55'];

  const { lineData, lineData2, barData, pieData, hasPieData } = useMemo(() => {
    // Bucket the last 7 days so income vs expense reads as a real trend line,
    // instead of one bar per category (which produced unreadable "Tra"/"Foo" labels).
    const DAYS = 7;
    const today = new Date();
    const buckets = Array.from({ length: DAYS }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (DAYS - 1 - i));
      return {
        key: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        income: 0,
        expense: 0,
      };
    });
    const bucketByKey = new Map(buckets.map(b => [b.key, b]));

    transactions.forEach(t => {
      const key = new Date(t.date).toISOString().slice(0, 10);
      const bucket = bucketByKey.get(key);
      if (!bucket) return; // outside the visible window
      if (t.type === 'income') bucket.income += t.amount;
      else bucket.expense += t.amount;
    });

    const lData = buckets.map(b => ({ value: b.income, label: b.label }));
    const lData2 = buckets.map(b => ({ value: b.expense, label: b.label }));

    // Grouped bars: income then expense per day, tight spacing within a day,
    // wider spacing between days.
    const bData: any[] = [];
    buckets.forEach(b => {
      bData.push({ value: b.income, label: b.label, frontColor: '#34C759', spacing: 2 });
      bData.push({ value: b.expense, frontColor: '#FF3B30', spacing: 20 });
    });

    // Category breakdown (top 6 expense categories) for the donut view.
    const catTotals = new Map<string, number>();
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => catTotals.set(t.category, (catTotals.get(t.category) || 0) + t.amount));

    const pData = Array.from(catTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([category, value], i) => ({
        value,
        color: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length],
        text: category,
      }));

    return { lineData: lData, lineData2: lData2, barData: bData, pieData: pData, hasPieData: pData.length > 0 };
  }, [transactions]);

  const renderTransaction = useCallback((t: Transaction, index: number) => {
    const isIncome = t.type === 'income';
    return (
      <AnimatedCard key={t._id} delay={index * 80}>
        <TouchableOpacity
          style={[styles.txRow, { borderBottomColor: separator }]}
          onPress={() => navigation.navigate('TransactionDetails', { transaction: t })}
          activeOpacity={0.7}
        >
          <View style={[styles.txIcon, { backgroundColor: isIncome ? 'rgba(52, 199, 89, 0.12)' : 'rgba(255, 59, 48, 0.12)' }]}>
            <Ionicons
              name={isIncome ? 'arrow-down' : 'arrow-up'}
              size={18}
              color={isIncome ? '#34C759' : '#FF3B30'}
            />
          </View>
          <View style={styles.txInfo}>
            <Text style={[styles.txCategory, { color: textPrimary }]}>{t.category}</Text>
            <Text style={[styles.txDate, { color: textSecondary }]}>
              {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          </View>
          <Text style={[styles.txAmount, { color: isIncome ? '#34C759' : textPrimary }]}>
            {isIncome ? '+' : '-'}{formatCurrency(t.amount, currency, enableConversion ? exchangeRates : null)}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={textSecondary} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </AnimatedCard>
    );
  }, [currency, enableConversion, exchangeRates, navigation, separator, textPrimary, textSecondary]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerGreeting, { color: textSecondary }]}>Overview</Text>
            <Text style={[styles.headerName, { color: textPrimary }]}>
              {user?.name?.split(' ')[0] || 'Dashboard'}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => navigation.navigate('ChatAssistant')}
              style={[styles.iconBtn, { backgroundColor: cardBg }]}
            >
              <Ionicons name="sparkles" size={18} color="#5856D6" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleToggleTheme} style={[styles.iconBtn, { backgroundColor: cardBg }]}>
              <Ionicons name={isDark ? 'sunny' : 'moon'} size={18} color={isDark ? '#FFD60A' : '#5E5CE6'} />
            </TouchableOpacity>
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Profile')}
              style={styles.avatarWrapper}
            >
              <Animated.View style={[
                styles.avatarPulse,
                { backgroundColor: isDark ? '#5E5CE6' : '#007AFF' },
                animatedPulseStyle
              ]} />
              <Image
                source={{ uri: user?.avatar || 'https://cdn-icons-png.flaticon.com/512/847/847969.png' }}
                style={styles.avatar}
              />
              {/* Subtle indicator dot */}
              <View style={[styles.avatarDot, { borderColor: bg }]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance Card */}
        <AnimatedCard delay={50}>
          <LinearGradient
            colors={isDark ? ['#1D3557', '#0A2040'] : ['#007AFF', '#5856D6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>{formatCurrency(balance, currency, enableConversion ? exchangeRates : null)}</Text>
            <View style={styles.balanceRow}>
              <View style={styles.balanceStat}>
                <View style={styles.balanceStatIcon}>
                  <Ionicons name="arrow-down" size={12} color="#34C759" />
                </View>
                <View>
                  <Text style={styles.balanceStatLabel}>Income</Text>
                  <Text style={styles.balanceStatValue}>{formatCurrency(totalIncome, currency, enableConversion ? exchangeRates : null)}</Text>
                </View>
              </View>
              <View style={[styles.balanceDivider]} />
              <View style={styles.balanceStat}>
                <View style={[styles.balanceStatIcon, { backgroundColor: 'rgba(255, 59, 48, 0.15)' }]}>
                  <Ionicons name="arrow-up" size={12} color="#FF3B30" />
                </View>
                <View>
                  <Text style={styles.balanceStatLabel}>Expenses</Text>
                  <Text style={styles.balanceStatValue}>{formatCurrency(totalExpense, currency, enableConversion ? exchangeRates : null)}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </AnimatedCard>

        {/* Chart Card */}
        <AnimatedCard delay={120}>
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: textPrimary }]}>Spending</Text>
              <View style={[styles.segmentedControl, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
                <TouchableOpacity
                  onPress={() => setChartType('line')}
                  style={[styles.segment, chartType === 'line' && { backgroundColor: isDark ? '#3A3A3C' : '#FFFFFF' }]}
                >
                  <Text style={[styles.segmentText, { color: chartType === 'line' ? textPrimary : textSecondary }]}>Line</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setChartType('bar')}
                  style={[styles.segment, chartType === 'bar' && { backgroundColor: isDark ? '#3A3A3C' : '#FFFFFF' }]}
                >
                  <Text style={[styles.segmentText, { color: chartType === 'bar' ? textPrimary : textSecondary }]}>Bar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setChartType('donut')}
                  style={[styles.segment, chartType === 'donut' && { backgroundColor: isDark ? '#3A3A3C' : '#FFFFFF' }]}
                >
                  <Text style={[styles.segmentText, { color: chartType === 'donut' ? textPrimary : textSecondary }]}>Donut</Text>
                </TouchableOpacity>
              </View>
            </View>

            {chartType !== 'donut' && (
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#34C759' }]} />
                  <Text style={[styles.legendText, { color: textSecondary }]}>Income</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#FF3B30' }]} />
                  <Text style={[styles.legendText, { color: textSecondary }]}>Expense</Text>
                </View>
              </View>
            )}

            <View style={styles.chartContainer}>
              {chartType === 'line' ? (
                <LineChart
                  data={lineData}
                  data2={lineData2}
                  width={width - 80}
                  height={160}
                  thickness={3}
                  color="#34C759"
                  color2="#FF3B30"
                  startFillColor="#34C759"
                  startFillColor2="#FF3B30"
                  endFillColor="transparent"
                  endFillColor2="transparent"
                  startOpacity={0.15}
                  startOpacity2={0.15}
                  endOpacity={0}
                  endOpacity2={0}
                  initialSpacing={10}
                  noOfSections={4}
                  yAxisTextStyle={{ color: textSecondary, fontSize: 11 }}
                  xAxisLabelTextStyle={{ color: textSecondary, fontSize: 10 }}
                  yAxisColor="transparent"
                  xAxisColor={separator}
                  hideDataPoints={false}
                  dataPointsColor="#34C759"
                  dataPointsColor2="#FF3B30"
                  dataPointsRadius={4}
                  areaChart
                  isAnimated
                  animationDuration={800}
                />
              ) : chartType === 'bar' ? (
                <BarChart
                  data={barData}
                  width={width - 80}
                  height={160}
                  barWidth={16}
                  noOfSections={4}
                  barBorderRadius={4}
                  yAxisTextStyle={{ color: textSecondary, fontSize: 11 }}
                  xAxisLabelTextStyle={{ color: textSecondary, fontSize: 10 }}
                  yAxisColor="transparent"
                  xAxisColor={separator}
                  isAnimated
                  animationDuration={800}
                />
              ) : hasPieData ? (
                <View style={styles.donutWrap}>
                  <PieChart
                    data={pieData}
                    donut
                    radius={80}
                    innerRadius={52}
                    innerCircleColor={cardBg}
                    centerLabelComponent={() => (
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: textSecondary }}>Spent</Text>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: textPrimary }}>
                          {formatCurrency(totalExpense, currency, enableConversion ? exchangeRates : null)}
                        </Text>
                      </View>
                    )}
                  />
                  <View style={styles.donutLegend}>
                    {pieData.map((slice, i) => (
                      <View key={i} style={styles.donutLegendItem}>
                        <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
                        <Text style={[styles.donutLegendText, { color: textPrimary }]} numberOfLines={1}>
                          {slice.text}
                        </Text>
                        <Text style={[styles.donutLegendValue, { color: textSecondary }]}>
                          {formatCurrency(slice.value, currency, enableConversion ? exchangeRates : null)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <Text style={{ color: textSecondary, textAlign: 'center', paddingVertical: 40 }}>
                  No expense data yet.
                </Text>
              )}
            </View>
          </View>
        </AnimatedCard>

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>Recent</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: cardBg }]}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#007AFF" style={{ padding: 40 }} />
          ) : transactions.length > 0 ? (
            transactions.slice(0, 6).map((t, i) => renderTransaction(t, i))
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
                <Ionicons name="receipt-outline" size={28} color={textSecondary} />
              </View>
              <Text style={[styles.emptyTitle, { color: textPrimary }]}>No Transactions</Text>
              <Text style={[styles.emptySubtitle, { color: textSecondary }]}>
                Add your first transaction to get started.
              </Text>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  headerGreeting: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  headerName: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  avatarWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  avatarPulse: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 2,
  },
  avatarDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34C759',
    borderWidth: 2,
    zIndex: 3,
  },
  balanceCard: { marginHorizontal: 20, marginBottom: 16, borderRadius: 24, padding: 24 },
  balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '500', marginBottom: 6 },
  balanceAmount: { color: '#FFFFFF', fontSize: 38, fontWeight: '700', letterSpacing: -1, marginBottom: 24 },
  balanceRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16 },
  balanceStat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  balanceStatIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(52, 199, 89, 0.15)', alignItems: 'center', justifyContent: 'center' },
  balanceStatLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '500' },
  balanceStatValue: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', marginTop: 1 },
  balanceDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 8 },
  card: { marginHorizontal: 20, marginBottom: 16, borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  segmentedControl: { flexDirection: 'row', borderRadius: 8, padding: 2 },
  segment: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 6 },
  segmentText: { fontSize: 13, fontWeight: '600' },
  chartContainer: { paddingHorizontal: 12, paddingBottom: 16 },
  legendRow: { flexDirection: 'row', gap: 16, paddingHorizontal: 20, marginBottom: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, fontWeight: '500' },
  donutWrap: { alignItems: 'center', paddingVertical: 8 },
  donutLegend: { width: '100%', marginTop: 20, gap: 10, paddingHorizontal: 8 },
  donutLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  donutLegendText: { flex: 1, fontSize: 14, fontWeight: '500' },
  donutLegendValue: { fontSize: 13, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  sectionTitle: { fontSize: 22, fontWeight: '700' },
  seeAll: { fontSize: 15, color: '#007AFF', fontWeight: '500' },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  txIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  txInfo: { flex: 1 },
  txCategory: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  txDate: { fontSize: 13 },
  txAmount: { fontSize: 16, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', maxWidth: 220 },
  fab: { display: 'none' },
  fabGradient: { display: 'none' },
});
