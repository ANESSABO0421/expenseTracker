import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, StyleSheet, Dimensions, LayoutAnimation
} from 'react-native';
import Animated, { useSharedValue, withRepeat, withSequence, withTiming, useAnimatedStyle, Easing } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useStore, Transaction } from '../store/useStore';
import AnimatedCard from '../components/AnimatedCard';
import { formatCurrency } from '../utils/formatCurrency';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }: any) {
  const { user, transactions, fetchTransactions, isLoading, currency, exchangeRates, enableConversion } = useStore();
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
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

  const { expenses, lineData, barData } = useMemo(() => {
    const exps = transactions.filter(t => t.type === 'expense').slice(0, 8).reverse();
    const lData = exps.length > 0
      ? exps.map(t => ({ value: t.amount, label: t.category.substring(0, 3) }))
      : [{ value: 0, label: 'N/A' }];
    const bData = exps.length > 0
      ? exps.map(t => ({ value: t.amount, label: t.category.substring(0, 3), frontColor: '#007AFF' }))
      : [{ value: 0, label: 'N/A', frontColor: '#007AFF' }];
    return { expenses: exps, lineData: lData, barData: bData };
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
              </View>
            </View>
            <View style={styles.chartContainer}>
              {chartType === 'line' ? (
                <LineChart
                  data={lineData}
                  width={width - 80}
                  height={160}
                  thickness={3}
                  color="#007AFF"
                  startFillColor="#007AFF"
                  endFillColor="transparent"
                  startOpacity={0.15}
                  endOpacity={0}
                  initialSpacing={10}
                  noOfSections={4}
                  yAxisTextStyle={{ color: textSecondary, fontSize: 11 }}
                  xAxisLabelTextStyle={{ color: textSecondary, fontSize: 10 }}
                  yAxisColor="transparent"
                  xAxisColor={separator}
                  hideDataPoints={false}
                  dataPointsColor="#007AFF"
                  dataPointsRadius={4}
                  areaChart
                  isAnimated
                  animationDuration={800}
                />
              ) : (
                <BarChart
                  data={barData}
                  width={width - 80}
                  height={160}
                  barWidth={24}
                  spacing={18}
                  noOfSections={4}
                  barBorderRadius={6}
                  yAxisTextStyle={{ color: textSecondary, fontSize: 11 }}
                  xAxisLabelTextStyle={{ color: textSecondary, fontSize: 10 }}
                  yAxisColor="transparent"
                  xAxisColor={separator}
                  isAnimated
                  animationDuration={800}
                />
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
