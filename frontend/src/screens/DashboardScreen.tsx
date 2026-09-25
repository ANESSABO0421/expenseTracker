import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useScrollToTop } from '@react-navigation/native';
import {
  View, Text, ScrollView, Image, StyleSheet, Dimensions, RefreshControl, FlatList,
} from 'react-native';
import Animated, { FadeInDown, SlideInDown, SlideOutUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart, BarChart, PieChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import GoalHomeCard from '../components/GoalHomeCard';
import { formatCurrency } from '../utils/formatCurrency';
import { useTheme, brand, shadow, greeting } from '../theme';
import { categoryMeta, groupByDay } from '../theme/categories';
import {
  PressableScale, IconButton, SectionHeader, Segmented, TransactionRow,
  TransactionSkeleton, EmptyState, CategoryIcon, Card,
} from '../components/ui';

const { width } = Dimensions.get('window');
const BANNER_W = width - 40;
const CHART_W = width - 128;
const SEARCH_HINTS = ['Food', 'Salary', 'Shopping', 'Transport', 'Bills', 'Travel'];

type IconName = keyof typeof Ionicons.glyphMap;

const compact = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `${(n / 1e3).toFixed(a >= 1e4 ? 0 : 1)}k`;
  return `${Math.round(n)}`;
};

export default function DashboardScreen({ navigation }: any) {
  const { user, transactions, fetchTransactions, isLoading, currency, exchangeRates, enableConversion, goals, fetchGoals, fetchExchangeRates } = useStore();
  const { c, isDark, toggle } = useTheme();
  const rates = enableConversion ? exchangeRates : null;
  const fmt = useCallback((n: number) => formatCurrency(n, currency, rates), [currency, rates]);
  // Short labels ("12k") go through the same currency conversion as full amounts
  const fx = rates?.[currency] ?? 1;
  const short = (n: number) => compact(n * fx);

  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'donut'>('bar');
  const [hideBalance, setHideBalance] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [hintIndex, setHintIndex] = useState(0);

  const load = useCallback(async () => {
    if (!user?._id) return;
    await Promise.all([fetchTransactions(user._id), fetchGoals(user._id)]);
  }, [user?._id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (enableConversion) fetchExchangeRates(); }, [enableConversion]);

  // Rotating search hint, the way delivery apps tease what you can search for.
  useEffect(() => {
    const id = setInterval(() => setHintIndex(i => (i + 1) % SEARCH_HINTS.length), 2600);
    return () => clearInterval(id);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // ── Derived numbers ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    let income = 0, expense = 0, monthIncome = 0, monthExpense = 0, lastMonthExpense = 0;
    const monthCats = new Map<string, number>();
    const allCats = new Map<string, number>();

    transactions.forEach(t => {
      const d = new Date(t.date);
      const inMonth = d >= monthStart;
      if (t.type === 'income') {
        income += t.amount;
        if (inMonth) monthIncome += t.amount;
      } else {
        expense += t.amount;
        allCats.set(t.category, (allCats.get(t.category) || 0) + t.amount);
        if (inMonth) {
          monthExpense += t.amount;
          monthCats.set(t.category, (monthCats.get(t.category) || 0) + t.amount);
        } else if (d >= lastMonthStart) {
          lastMonthExpense += t.amount;
        }
      }
    });

    const cats = (monthCats.size ? monthCats : allCats);
    const topCategories = Array.from(cats.entries()).sort((a, b) => b[1] - a[1]);
    const catTotal = topCategories.reduce((s, [, v]) => s + v, 0);

    return {
      income, expense, balance: income - expense,
      monthIncome, monthExpense, lastMonthExpense,
      topCategories, catTotal, catsAreThisMonth: monthCats.size > 0,
    };
  }, [transactions]);

  const primaryActiveGoal = useMemo(() => {
    const active = goals.filter(g => g.status === 'active');
    return active.find(g => g.isPrimary) || active[0] || null;
  }, [goals]);

  const chart = useMemo(() => {
    const DAYS = 7;
    const today = new Date();
    const buckets = Array.from({ length: DAYS }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (DAYS - 1 - i));
      return { key: d.toDateString(), label: d.toLocaleDateString('en-US', { weekday: 'narrow' }), income: 0, expense: 0 };
    });
    const byKey = new Map(buckets.map(b => [b.key, b]));
    transactions.forEach(t => {
      const b = byKey.get(new Date(t.date).toDateString());
      if (!b) return;
      if (t.type === 'income') b.income += t.amount; else b.expense += t.amount;
    });

    const perDay = CHART_W / DAYS;
    const barWidth = Math.max(6, (perDay - 14) / 2);
    const bars: any[] = [];
    buckets.forEach(b => {
      bars.push({ value: b.income, label: b.label, frontColor: brand.income, spacing: 3, labelWidth: barWidth * 2 + 3 });
      bars.push({ value: b.expense, frontColor: brand.primary, spacing: perDay - barWidth * 2 - 3 });
    });

    const weekIncome = buckets.reduce((s, b) => s + b.income, 0);
    const weekExpense = buckets.reduce((s, b) => s + b.expense, 0);

    return {
      line1: buckets.map(b => ({ value: b.income, label: b.label })),
      line2: buckets.map(b => ({ value: b.expense })),
      bars, barWidth, weekIncome, weekExpense,
      pie: stats.topCategories.slice(0, 6).map(([cat, value]) => ({ value, color: categoryMeta(cat).color, text: cat })),
    };
  }, [transactions, stats.topCategories]);

  // ── Insight banners (the "offers" carousel) ──────────────────────────────
  const banners = useMemo(() => {
    const list: { key: string; icon: IconName; eyebrow: string; title: string; body: string; colors: [string, string]; onPress?: () => void }[] = [];
    if (transactions.length === 0) {
      list.push({
        key: 'start', icon: 'rocket', eyebrow: 'GET STARTED', title: 'Log your first expense',
        body: 'Type it, say it, or snap a receipt — we do the rest.', colors: ['#FF7A2F', '#FF3D6E'],
        onPress: () => navigation.navigate('AddTransaction'),
      });
    } else {
      const diff = stats.lastMonthExpense > 0 ? ((stats.monthExpense - stats.lastMonthExpense) / stats.lastMonthExpense) * 100 : null;
      list.push({
        key: 'month', icon: diff !== null && diff > 0 ? 'trending-up' : 'trending-down', eyebrow: 'THIS MONTH',
        title: `${fmt(stats.monthExpense)} spent`,
        body: diff === null
          ? 'Keep logging to unlock month-over-month trends.'
          : diff > 0 ? `That's ${Math.round(diff)}% more than last month. Worth a look.` : `${Math.round(Math.abs(diff))}% less than last month. Nicely done!`,
        colors: diff !== null && diff > 0 ? ['#FF7A2F', '#F04438'] : ['#12B76A', '#0E9384'],
        onPress: () => navigation.navigate('Analytics'),
      });
      if (stats.topCategories[0]) {
        const [cat, val] = stats.topCategories[0];
        list.push({
          key: 'top', icon: categoryMeta(cat).icon, eyebrow: 'TOP CATEGORY',
          title: `${cat} leads the way`,
          body: `${fmt(val)} · ${Math.round((val / (stats.catTotal || 1)) * 100)}% of ${stats.catsAreThisMonth ? 'this month\'s' : 'all'} spending.`,
          colors: ['#7A5AF8', '#4E5BA6'],
          onPress: () => navigation.navigate('Transactions', { category: cat }),
        });
      }
      if (stats.monthIncome > 0) {
        const rate = Math.round(((stats.monthIncome - stats.monthExpense) / stats.monthIncome) * 100);
        list.push({
          key: 'save', icon: 'wallet', eyebrow: 'SAVINGS RATE',
          title: rate >= 0 ? `You're saving ${rate}%` : 'Spending > income',
          body: rate >= 20 ? 'Above the 20% rule of thumb. Keep it up!' : 'Try trimming your top category to push this higher.',
          colors: ['#06AED4', '#2E90FA'],
          onPress: () => navigation.navigate('Analytics'),
        });
      }
    }
    list.push({
      key: 'ai', icon: 'sparkles', eyebrow: 'SPENDOVA AI', title: 'Ask anything',
      body: '"Where did most of my money go this week?"', colors: ['#1B1D29', '#3B3F5C'],
      onPress: () => navigation.navigate('ChatAssistant'),
    });
    return list;
  }, [transactions.length, stats, fmt, navigation]);

  const quickActions: { key: string; label: string; icon: IconName; color: string; onPress: () => void }[] = [
    { key: 'exp', label: 'Expense', icon: 'arrow-up', color: brand.expense, onPress: () => navigation.navigate('AddTransaction', { type: 'expense' }) },
    { key: 'inc', label: 'Income', icon: 'arrow-down', color: brand.income, onPress: () => navigation.navigate('AddTransaction', { type: 'income' }) },
    { key: 'scan', label: 'Scan', icon: 'scan', color: '#2E90FA', onPress: () => navigation.navigate('AddTransaction', { type: 'expense', action: 'scan' }) },
    { key: 'voice', label: 'Voice', icon: 'mic', color: '#7A5AF8', onPress: () => navigation.navigate('AddTransaction', { action: 'voice' }) },
    { key: 'goal', label: 'Goal', icon: 'flag', color: brand.gold, onPress: () => navigation.navigate('GoalCreation') },
  ];

  const recentSections = useMemo(() => groupByDay(transactions.slice(0, 8)), [transactions]);
  const firstName = user?.name?.split(' ')[0] || 'there';
  const money = (n: number) => (hideBalance ? '••••••' : fmt(n));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 }}
        stickyHeaderIndices={[1]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brand.primary} colors={[brand.primary]} />}
      >
        {/* 0 · Header */}
        <View style={styles.header}>
          <PressableScale onPress={() => navigation.navigate('Profile')} style={styles.profileBtn}>
            <LinearGradient colors={[brand.primary, brand.hot]} style={styles.avatarRing}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={[styles.avatar, { borderColor: c.bg }]} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback, { borderColor: c.bg, backgroundColor: c.surface }]}>
                  <Text style={[styles.avatarInitial, { color: brand.primary }]}>{firstName[0]?.toUpperCase()}</Text>
                </View>
              )}
            </LinearGradient>
            <View style={{ flexShrink: 1 }}>
              <Text style={[styles.greet, { color: c.textSecondary }]}>{greeting()} 👋</Text>
              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>{firstName}</Text>
                <Ionicons name="chevron-down" size={16} color={c.text} />
              </View>
            </View>
          </PressableScale>
          <View style={styles.headerRight}>
            <IconButton icon="sparkles" color={brand.primary} onPress={() => navigation.navigate('ChatAssistant')} badge />
            <IconButton icon={isDark ? 'sunny' : 'moon'} color={isDark ? '#FDB022' : c.text} onPress={toggle} />
          </View>
        </View>

        {/* 1 · Sticky search */}
        <View style={[styles.searchWrap, { backgroundColor: c.bg }]}>
          <PressableScale
            scaleTo={0.985}
            onPress={() => navigation.navigate('Transactions', { focusSearch: true })}
            style={[styles.search, { backgroundColor: c.surface, borderColor: c.border }, shadow(c, 1)]}
          >
            <Ionicons name="search" size={19} color={brand.primary} />
            <Text style={[styles.searchText, { color: c.textTertiary }]}>Search for </Text>
            <View style={styles.hintClip}>
              <Animated.Text
                key={hintIndex}
                entering={SlideInDown.duration(300)}
                exiting={SlideOutUp.duration(300)}
                style={[styles.searchText, { color: c.textTertiary }]}
              >
                '{SEARCH_HINTS[hintIndex]}'
              </Animated.Text>
            </View>
            <View style={{ flex: 1 }} />
            <View style={[styles.searchDivider, { backgroundColor: c.border }]} />
            <Ionicons name="options-outline" size={19} color={c.textSecondary} />
          </PressableScale>
        </View>

        {/* Balance hero */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.px}>
          <LinearGradient colors={c.heroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <View style={[styles.blob, { width: 180, height: 180, top: -70, right: -50 }]} />
            <View style={[styles.blob, { width: 110, height: 110, bottom: -40, left: -30 }]} />

            <View style={styles.heroTop}>
              <Text style={styles.heroLabel}>Total balance</Text>
              <PressableScale onPress={() => setHideBalance(h => !h)} hitSlop={10} style={styles.eyeBtn}>
                <Ionicons name={hideBalance ? 'eye-off' : 'eye'} size={15} color="#FFF" />
              </PressableScale>
            </View>
            <Text style={styles.heroAmount} numberOfLines={1} adjustsFontSizeToFit>{money(stats.balance)}</Text>
            <View style={styles.heroPill}>
              <Ionicons name="calendar-clear" size={12} color="#FFF" />
              <Text style={styles.heroPillText}>
                {new Date().toLocaleDateString('en-US', { month: 'long' })} · {money(stats.monthExpense)} spent
              </Text>
            </View>

            <View style={styles.heroStats}>
              {[
                { label: 'Income', value: stats.income, icon: 'arrow-down' as IconName },
                { label: 'Expenses', value: stats.expense, icon: 'arrow-up' as IconName },
              ].map((s, i) => (
                <React.Fragment key={s.label}>
                  {i === 1 && <View style={styles.heroDivider} />}
                  <View style={styles.heroStat}>
                    <View style={styles.heroStatIcon}>
                      <Ionicons name={s.icon} size={14} color="#FFF" />
                    </View>
                    <View style={{ flexShrink: 1 }}>
                      <Text style={styles.heroStatLabel}>{s.label}</Text>
                      <Text style={styles.heroStatValue} numberOfLines={1} adjustsFontSizeToFit>{money(s.value)}</Text>
                    </View>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Quick actions */}
        <Animated.View entering={FadeInDown.delay(80).duration(500)} style={styles.quickRow}>
          {quickActions.map(a => (
            <PressableScale key={a.key} onPress={a.onPress} scaleTo={0.9} style={styles.quick}>
              <View style={[styles.quickIcon, { backgroundColor: c.surface }, shadow(c, 1)]}>
                <View style={[styles.quickInner, { backgroundColor: a.color + '1A' }]}>
                  <Ionicons name={a.icon} size={21} color={a.color} />
                </View>
              </View>
              <Text style={[styles.quickLabel, { color: c.text }]}>{a.label}</Text>
            </PressableScale>
          ))}
        </Animated.View>

        {/* Insight carousel */}
        <Animated.View entering={FadeInDown.delay(140).duration(500)}>
          <FlatList
            data={banners}
            keyExtractor={b => b.key}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={BANNER_W + 12}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            onScroll={e => setBannerIndex(Math.round(e.nativeEvent.contentOffset.x / (BANNER_W + 12)))}
            scrollEventThrottle={32}
            renderItem={({ item }) => (
              <PressableScale onPress={item.onPress} scaleTo={0.98} style={{ width: BANNER_W }}>
                <LinearGradient colors={item.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
                  <View style={[styles.blob, { width: 140, height: 140, top: -50, right: -30 }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bannerEyebrow}>{item.eyebrow}</Text>
                    <Text style={styles.bannerTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.bannerBody} numberOfLines={2}>{item.body}</Text>
                  </View>
                  <View style={styles.bannerIcon}>
                    <Ionicons name={item.icon} size={26} color="#FFF" />
                  </View>
                </LinearGradient>
              </PressableScale>
            )}
          />
          <View style={styles.dots}>
            {banners.map((b, i) => (
              <View key={b.key} style={[styles.dot, { backgroundColor: i === bannerIndex ? brand.primary : c.border, width: i === bannerIndex ? 18 : 6 }]} />
            ))}
          </View>
        </Animated.View>

        {/* Goal */}
        <View style={[styles.px, { marginTop: 22 }]}>
          <SectionHeader
            title="Your goal"
            action={primaryActiveGoal ? 'New goal' : undefined}
            onAction={() => navigation.navigate('GoalCreation')}
            style={{ paddingHorizontal: 0 }}
          />
          {primaryActiveGoal ? (
            <GoalHomeCard goal={primaryActiveGoal} onPress={() => navigation.navigate('GoalDetail', { goalId: primaryActiveGoal._id })} />
          ) : (
            <PressableScale onPress={() => navigation.navigate('GoalCreation')} scaleTo={0.98}
              style={[styles.goalEmpty, { backgroundColor: c.surface, borderColor: c.border }]}>
              <View style={styles.goalEmptyIcon}><Text style={{ fontSize: 24 }}>🎯</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.goalEmptyTitle, { color: c.text }]}>Start a savings goal</Text>
                <Text style={[styles.goalEmptySub, { color: c.textSecondary }]}>A trip, a MacBook, a home — give your money a destination.</Text>
              </View>
              <View style={[styles.goalEmptyCta, { backgroundColor: brand.primary }]}>
                <Ionicons name="add" size={18} color="#FFF" />
              </View>
            </PressableScale>
          )}
        </View>

        {/* Where your money goes */}
        {stats.topCategories.length > 0 && (
          <View style={{ marginTop: 26 }}>
            <SectionHeader
              title="Where your money goes"
              subtitle={stats.catsAreThisMonth ? 'This month, by category' : 'All time, by category'}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
              {stats.topCategories.slice(0, 8).map(([cat, val]) => (
                <PressableScale key={cat} onPress={() => navigation.navigate('Transactions', { category: cat })} scaleTo={0.92} style={styles.catBubble}>
                  <View style={[styles.catCircle, { backgroundColor: c.surface }, shadow(c, 1)]}>
                    <CategoryIcon category={cat} size={50} rounded={25} />
                  </View>
                  <Text style={[styles.catName, { color: c.text }]} numberOfLines={1}>{cat}</Text>
                  <Text style={[styles.catAmt, { color: c.textSecondary }]} numberOfLines={1}>{short(val)}</Text>
                </PressableScale>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Weekly chart */}
        <View style={[styles.px, { marginTop: 26 }]}>
          <Card>
            <View style={styles.chartHead}>
              <View>
                <Text style={[styles.chartTitle, { color: c.text }]}>Last 7 days</Text>
                <Text style={[styles.chartSub, { color: c.textSecondary }]}>
                  <Text style={{ color: brand.income, fontWeight: '800' }}>+{short(chart.weekIncome)}</Text>
                  {'  ·  '}
                  <Text style={{ color: brand.primary, fontWeight: '800' }}>−{short(chart.weekExpense)}</Text>
                </Text>
              </View>
              <Segmented
                value={chartType}
                onChange={setChartType}
                options={[{ key: 'bar', label: 'Bar' }, { key: 'line', label: 'Line' }, { key: 'donut', label: 'Split' }]}
                style={{ width: 168 }}
              />
            </View>

            {chartType !== 'donut' && (
              <View style={styles.legendRow}>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: brand.income }]} /><Text style={[styles.legendText, { color: c.textSecondary }]}>Income</Text></View>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: brand.primary }]} /><Text style={[styles.legendText, { color: c.textSecondary }]}>Expense</Text></View>
              </View>
            )}

            <View style={{ marginLeft: -8 }}>
              {chartType === 'bar' ? (
                <BarChart
                  key={`bar-${isDark}`}
                  data={chart.bars}
                  width={CHART_W}
                  height={150}
                  barWidth={chart.barWidth}
                  initialSpacing={6}
                  noOfSections={3}
                  barBorderTopLeftRadius={5}
                  barBorderTopRightRadius={5}
                  yAxisThickness={0}
                  xAxisThickness={0}
                  rulesType="dashed"
                  rulesColor={c.divider}
                  yAxisTextStyle={{ color: c.textTertiary, fontSize: 10 }}
                  xAxisLabelTextStyle={{ color: c.textSecondary, fontSize: 11, fontWeight: '600' }}
                  formatYLabel={(v: string) => short(Number(v))}
                  isAnimated
                  animationDuration={600}
                />
              ) : chartType === 'line' ? (
                <LineChart
                  key={`line-${isDark}`}
                  data={chart.line1}
                  data2={chart.line2}
                  width={CHART_W}
                  height={150}
                  spacing={(CHART_W - 20) / 6}
                  initialSpacing={10}
                  thickness={3}
                  color={brand.income}
                  color2={brand.primary}
                  curved
                  areaChart
                  startFillColor={brand.income}
                  startFillColor2={brand.primary}
                  endFillColor={c.surface}
                  endFillColor2={c.surface}
                  startOpacity={0.22}
                  startOpacity2={0.22}
                  endOpacity={0}
                  endOpacity2={0}
                  hideDataPoints
                  noOfSections={3}
                  yAxisThickness={0}
                  xAxisThickness={0}
                  rulesType="dashed"
                  rulesColor={c.divider}
                  yAxisTextStyle={{ color: c.textTertiary, fontSize: 10 }}
                  xAxisLabelTextStyle={{ color: c.textSecondary, fontSize: 11, fontWeight: '600' }}
                  formatYLabel={(v: string) => short(Number(v))}
                  isAnimated
                  animationDuration={700}
                />
              ) : chart.pie.length > 0 ? (
                <View style={styles.donutRow}>
                  <PieChart
                    data={chart.pie}
                    donut
                    radius={68}
                    innerRadius={48}
                    innerCircleColor={c.surface}
                    centerLabelComponent={() => (
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 10.5, fontWeight: '700', color: c.textSecondary }}>SPENT</Text>
                        <Text style={{ fontSize: 15, fontWeight: '900', color: c.text }}>{short(stats.catTotal)}</Text>
                      </View>
                    )}
                  />
                  <View style={{ flex: 1, gap: 9 }}>
                    {chart.pie.map(s => (
                      <View key={s.text} style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: s.color }]} />
                        <Text style={[styles.donutLabel, { color: c.text }]} numberOfLines={1}>{s.text}</Text>
                        <Text style={[styles.donutPct, { color: c.textSecondary }]}>{Math.round((s.value / (stats.catTotal || 1)) * 100)}%</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <Text style={{ color: c.textSecondary, textAlign: 'center', paddingVertical: 40 }}>No expense data yet.</Text>
              )}
            </View>
          </Card>
        </View>

        {/* Recent */}
        <View style={{ marginTop: 26 }}>
          <SectionHeader title="Recent activity" action="See all" onAction={() => navigation.navigate('Transactions')} />
          <View style={styles.px}>
            <Card padded={false} style={{ overflow: 'hidden' }}>
              {isLoading && transactions.length === 0 ? (
                <TransactionSkeleton />
              ) : transactions.length === 0 ? (
                <EmptyState
                  icon="receipt-outline"
                  title="No transactions yet"
                  message="Tap the + button to log your first one."
                  action="Add transaction"
                  onAction={() => navigation.navigate('AddTransaction')}
                />
              ) : (
                recentSections.map((section, si) => (
                  <View key={section.key}>
                    <View style={[styles.dayHead, si > 0 && { borderTopColor: c.divider, borderTopWidth: StyleSheet.hairlineWidth }]}>
                      <Text style={[styles.dayTitle, { color: c.textSecondary }]}>{section.title.toUpperCase()}</Text>
                    </View>
                    {section.data.map((t, i) => (
                      <TransactionRow
                        key={t._id}
                        t={t}
                        currency={currency}
                        rates={rates}
                        last={i === section.data.length - 1}
                        onPress={() => navigation.navigate('TransactionDetails', { transaction: t })}
                      />
                    ))}
                  </View>
                ))
              )}
            </Card>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  px: { paddingHorizontal: 20 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 6, paddingBottom: 10 },
  profileBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  avatarRing: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2.5 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 18, fontWeight: '900' },
  greet: { fontSize: 12.5, fontWeight: '600' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { fontSize: 21, fontWeight: '900', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', gap: 10 },

  searchWrap: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 12 },
  search: { height: 52, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 8 },
  searchText: { fontSize: 15, fontWeight: '500' },
  hintClip: { height: 22, overflow: 'hidden', justifyContent: 'center', marginLeft: -8 },
  searchDivider: { width: 1, height: 22, marginRight: 4 },

  hero: { borderRadius: 26, padding: 22, overflow: 'hidden' },
  blob: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)' },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13.5, fontWeight: '700' },
  eyeBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  heroAmount: { color: '#FFF', fontSize: 38, fontWeight: '900', letterSpacing: -1.2, marginTop: 6 },
  heroPill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginTop: 8 },
  heroPillText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  heroStats: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.14)', borderRadius: 18, padding: 14, marginTop: 20 },
  heroStat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroStatIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  heroStatLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 11.5, fontWeight: '600' },
  heroStatValue: { color: '#FFF', fontSize: 15.5, fontWeight: '800', marginTop: 1 },
  heroDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 12 },

  quickRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 22, marginBottom: 22 },
  quick: { alignItems: 'center', gap: 7, width: (width - 40) / 5 },
  quickIcon: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  quickInner: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 12, fontWeight: '700' },

  banner: { borderRadius: 22, padding: 18, minHeight: 112, flexDirection: 'row', alignItems: 'center', gap: 12, overflow: 'hidden' },
  bannerEyebrow: { color: 'rgba(255,255,255,0.8)', fontSize: 10.5, fontWeight: '900', letterSpacing: 1.2 },
  bannerTitle: { color: '#FFF', fontSize: 19, fontWeight: '900', letterSpacing: -0.4, marginTop: 4 },
  bannerBody: { color: 'rgba(255,255,255,0.88)', fontSize: 13, fontWeight: '500', lineHeight: 18, marginTop: 4 },
  bannerIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 12 },
  dot: { height: 6, borderRadius: 3 },

  goalEmpty: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', padding: 16 },
  goalEmptyIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(212,178,106,0.16)', alignItems: 'center', justifyContent: 'center' },
  goalEmptyTitle: { fontSize: 15.5, fontWeight: '800' },
  goalEmptySub: { fontSize: 12.5, marginTop: 3, lineHeight: 17 },
  goalEmptyCta: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },

  catBubble: { alignItems: 'center', width: 76 },
  catCircle: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  catName: { fontSize: 12.5, fontWeight: '700', marginTop: 8 },
  catAmt: { fontSize: 11.5, fontWeight: '600', marginTop: 1 },

  chartHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  chartTitle: { fontSize: 17, fontWeight: '900', letterSpacing: -0.3 },
  chartSub: { fontSize: 12.5, marginTop: 3 },
  legendRow: { flexDirection: 'row', gap: 16, marginBottom: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, fontWeight: '600' },
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: 20, paddingLeft: 8, paddingVertical: 6 },
  donutLabel: { flex: 1, fontSize: 13, fontWeight: '600' },
  donutPct: { fontSize: 12.5, fontWeight: '800' },

  dayHead: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 2 },
  dayTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
});
