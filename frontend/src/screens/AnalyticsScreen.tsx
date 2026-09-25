import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useScrollToTop } from '@react-navigation/native';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../utils/formatCurrency';
import { useTheme, brand, radius, shadow } from '../theme';
import { categoryMeta } from '../theme/categories';
import {
  ScreenTitle, IconButton, Segmented, Card, SectionHeader, CategoryIcon, PressableScale, EmptyState, Skeleton, Chip,
} from '../components/ui';

const { width } = Dimensions.get('window');
const CHART_W = width - 128;

type Period = 'month' | 'quarter' | 'all';
type IconName = keyof typeof Ionicons.glyphMap;

const compact = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `${(n / 1e3).toFixed(a >= 1e4 ? 0 : 1)}k`;
  return `${Math.round(n)}`;
};

const INSIGHT_COLORS: Record<string, string> = {
  red: brand.expense, green: brand.income, blue: '#2E90FA', orange: brand.primary, purple: brand.violet,
};

export default function AnalyticsScreen({ navigation }: any) {
  const { transactions, insights, isGeneratingInsights, generateInsights, currency, baseCurrency, exchangeRates, enableConversion } = useStore();
  const { c, isDark } = useTheme();
  const [period, setPeriod] = useState<Period>('month');
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  const [showBaseCurrency, setShowBaseCurrency] = useState(false);

  // Optionally peek at the amounts in the currency they were recorded in
  const displayCurrency = showBaseCurrency ? baseCurrency : currency;
  const rates = showBaseCurrency ? null : enableConversion ? exchangeRates : null;
  const fmt = (n: number) => formatCurrency(n, displayCurrency, rates);
  const fx = rates?.[displayCurrency] ?? 1;

  useEffect(() => {
    if (insights.length === 0 && transactions.length > 0) generateInsights(transactions);
  }, [transactions.length, insights.length]);

  const periodTx = useMemo(() => {
    if (period === 'all') return transactions;
    const now = new Date();
    const start = period === 'month'
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : new Date(now.getFullYear(), now.getMonth() - 2, 1);
    return transactions.filter(t => new Date(t.date) >= start);
  }, [transactions, period]);

  const kpis = useMemo(() => {
    let income = 0, expense = 0;
    const cats = new Map<string, { total: number; count: number }>();
    periodTx.forEach(t => {
      if (t.type === 'income') income += t.amount;
      else {
        expense += t.amount;
        const e = cats.get(t.category) || { total: 0, count: 0 };
        e.total += t.amount; e.count += 1;
        cats.set(t.category, e);
      }
    });
    const categories = Array.from(cats.entries()).sort((a, b) => b[1].total - a[1].total);
    const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : null;
    const days = period === 'month' ? new Date().getDate() : period === 'quarter' ? 90 : Math.max(1,
      transactions.length ? Math.ceil((Date.now() - Math.min(...transactions.map(t => new Date(t.date).getTime()))) / 86400000) : 1);
    return { income, expense, net: income - expense, savingsRate, categories, dailyAvg: expense / Math.max(1, days) };
  }, [periodTx, period, transactions]);

  const monthly = useMemo(() => {
    const now = new Date();
    const buckets = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { y: d.getFullYear(), m: d.getMonth(), label: d.toLocaleDateString('en-US', { month: 'short' }), income: 0, expense: 0 };
    });
    transactions.forEach(t => {
      const d = new Date(t.date);
      const b = buckets.find(x => x.y === d.getFullYear() && x.m === d.getMonth());
      if (!b) return;
      if (t.type === 'income') b.income += t.amount; else b.expense += t.amount;
    });
    const perMonth = CHART_W / 6;
    const barWidth = Math.max(6, (perMonth - 14) / 2);
    const bars: any[] = [];
    buckets.forEach(b => {
      bars.push({ value: b.income, label: b.label, frontColor: brand.income, spacing: 3, labelWidth: barWidth * 2 + 3 });
      bars.push({ value: b.expense, frontColor: brand.primary, spacing: perMonth - barWidth * 2 - 3 });
    });
    return { bars, barWidth };
  }, [transactions]);

  const pieData = kpis.categories.slice(0, 7).map(([cat, v], i) => ({
    value: v.total, color: categoryMeta(cat).color, focused: i === 0,
  }));

  const tiles: { label: string; value: string; icon: IconName; color: string; hint?: string }[] = [
    { label: 'Income', value: fmt(kpis.income), icon: 'arrow-down', color: brand.income },
    { label: 'Spent', value: fmt(kpis.expense), icon: 'arrow-up', color: brand.expense },
    { label: 'Net', value: `${kpis.net < 0 ? '−' : ''}${fmt(Math.abs(kpis.net))}`, icon: 'swap-vertical', color: '#2E90FA' },
    {
      label: 'Savings rate', value: kpis.savingsRate === null ? '—' : `${kpis.savingsRate}%`, icon: 'wallet', color: brand.violet,
      hint: `${fmt(kpis.dailyAvg)}/day spent`,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      <ScreenTitle
        title="Insights"
        subtitle="Your money, decoded"
        right={
          <IconButton icon="sparkles" color={brand.primary} onPress={() => navigation.navigate('ChatAssistant')} />
        }
      />

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>
        <View style={styles.px}>
          <Segmented
            value={period}
            onChange={setPeriod}
            options={[{ key: 'month', label: 'This month' }, { key: 'quarter', label: '3 months' }, { key: 'all', label: 'All time' }]}
          />
          {enableConversion && currency !== baseCurrency && (
            <View style={{ flexDirection: 'row', marginTop: 10 }}>
              <Chip
                icon="swap-horizontal"
                label={`Showing ${displayCurrency}`}
                active={showBaseCurrency}
                activeColor={brand.primary}
                onPress={() => setShowBaseCurrency(s => !s)}
              />
            </View>
          )}
        </View>

        {/* KPI tiles */}
        <View style={styles.tiles}>
          {tiles.map((t, i) => (
            <Animated.View key={t.label} entering={FadeInDown.delay(i * 60).duration(400)} style={[styles.tile, { backgroundColor: c.surface }, shadow(c, 1)]}>
              <View style={[styles.tileIcon, { backgroundColor: t.color + '1A' }]}>
                <Ionicons name={t.icon} size={16} color={t.color} />
              </View>
              <Text style={[styles.tileLabel, { color: c.textSecondary }]}>{t.label}</Text>
              <Text style={[styles.tileValue, { color: c.text }]} numberOfLines={1} adjustsFontSizeToFit>{t.value}</Text>
              {t.hint ? <Text style={[styles.tileHint, { color: c.textTertiary }]} numberOfLines={1}>{t.hint}</Text> : null}
            </Animated.View>
          ))}
        </View>

        {transactions.length === 0 ? (
          <View style={[styles.px, { marginTop: 10 }]}>
            <Card>
              <EmptyState icon="pie-chart-outline" title="No data to analyse yet" message="Add a few transactions and your insights will appear here." compact />
            </Card>
          </View>
        ) : (
          <>
            {/* Category breakdown */}
            <SectionHeader title="Spending by category" subtitle={`${kpis.categories.length} ${kpis.categories.length === 1 ? "category" : "categories"}`} style={{ marginTop: 8 }} />
            <View style={styles.px}>
              <Card>
                {kpis.categories.length === 0 ? (
                  <Text style={{ color: c.textSecondary, textAlign: 'center', paddingVertical: 24 }}>No expenses in this period.</Text>
                ) : (
                  <>
                    <View style={{ alignItems: 'center', paddingVertical: 6 }}>
                      <PieChart
                        key={`pie-${isDark}-${period}`}
                        data={pieData}
                        donut
                        sectionAutoFocus
                        focusOnPress
                        radius={96}
                        innerRadius={70}
                        innerCircleColor={c.surface}
                        strokeWidth={3}
                        strokeColor={c.surface}
                        centerLabelComponent={() => (
                          <View style={{ alignItems: 'center' }}>
                            <Text style={{ fontSize: 11, fontWeight: '800', color: c.textSecondary, letterSpacing: 0.8 }}>TOTAL SPENT</Text>
                            <Text style={{ fontSize: 20, fontWeight: '900', color: c.text, marginTop: 2 }} numberOfLines={1} adjustsFontSizeToFit>
                              {fmt(kpis.expense)}
                            </Text>
                          </View>
                        )}
                      />
                    </View>
                    <View style={{ marginTop: 14 }}>
                      {kpis.categories.map(([cat, v], i) => {
                        const pct = (v.total / (kpis.expense || 1)) * 100;
                        const color = categoryMeta(cat).color;
                        return (
                          <PressableScale
                            key={cat}
                            scaleTo={0.98}
                            onPress={() => navigation.navigate('Transactions', { category: cat })}
                            style={[styles.catRow, i > 0 && { borderTopColor: c.divider, borderTopWidth: StyleSheet.hairlineWidth }]}
                          >
                            <CategoryIcon category={cat} size={40} rounded={13} />
                            <View style={{ flex: 1 }}>
                              <View style={styles.catTop}>
                                <Text style={[styles.catName, { color: c.text }]} numberOfLines={1}>{cat}</Text>
                                <Text style={[styles.catAmt, { color: c.text }]}>{fmt(v.total)}</Text>
                              </View>
                              <View style={styles.catBottom}>
                                <View style={[styles.catTrack, { backgroundColor: c.surfaceAlt }]}>
                                  <View style={{ width: `${Math.max(2, pct)}%`, height: '100%', borderRadius: 3, backgroundColor: color }} />
                                </View>
                                <Text style={[styles.catPct, { color: c.textSecondary }]}>{Math.round(pct)}% · {v.count}×</Text>
                              </View>
                            </View>
                          </PressableScale>
                        );
                      })}
                    </View>
                  </>
                )}
              </Card>
            </View>

            {/* Trend */}
            <SectionHeader title="6-month trend" subtitle="Income vs. spending" style={{ marginTop: 26 }} />
            <View style={styles.px}>
              <Card>
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: brand.income }]} /><Text style={[styles.legendText, { color: c.textSecondary }]}>Income</Text></View>
                  <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: brand.primary }]} /><Text style={[styles.legendText, { color: c.textSecondary }]}>Spending</Text></View>
                </View>
                <View style={{ marginLeft: -8 }}>
                  <BarChart
                    key={`trend-${isDark}`}
                    data={monthly.bars}
                    width={CHART_W}
                    height={160}
                    barWidth={monthly.barWidth}
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
                    formatYLabel={(v: string) => compact(Number(v) * fx)}
                    isAnimated
                    animationDuration={600}
                  />
                </View>
              </Card>
            </View>
          </>
        )}

        {/* AI insights */}
        <SectionHeader
          title="AI insights"
          subtitle="Personalised by Spendova AI"
          action={isGeneratingInsights ? undefined : 'Refresh'}
          onAction={() => generateInsights(transactions)}
          style={{ marginTop: 26 }}
        />
        <View style={[styles.px, { gap: 12 }]}>
          {isGeneratingInsights ? (
            [0, 1, 2].map(i => (
              <View key={i} style={[styles.insight, { backgroundColor: c.surface }, shadow(c, 1)]}>
                <Skeleton width={44} height={44} radius={14} />
                <View style={{ flex: 1, gap: 8 }}>
                  <Skeleton width="60%" height={13} />
                  <Skeleton width="95%" height={10} />
                  <Skeleton width="80%" height={10} />
                </View>
              </View>
            ))
          ) : insights.length === 0 ? (
            <PressableScale onPress={() => navigation.navigate('ChatAssistant')} scaleTo={0.98}>
              <LinearGradient colors={['#1B1D29', '#3B3F5C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.aiCta}>
                <Ionicons name="sparkles" size={22} color="#FFF" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.aiCtaTitle}>Ask Spendova AI</Text>
                  <Text style={styles.aiCtaBody}>Get answers about your spending in plain English.</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#FFF" />
              </LinearGradient>
            </PressableScale>
          ) : (
            insights.map((insight, i) => {
              const color = INSIGHT_COLORS[insight.color] || '#2E90FA';
              return (
                <Animated.View key={i} entering={FadeInDown.delay(i * 70).duration(400)} style={[styles.insight, { backgroundColor: c.surface }, shadow(c, 1)]}>
                  <View style={[styles.insightAccent, { backgroundColor: color }]} />
                  <View style={[styles.insightIcon, { backgroundColor: color + '1A' }]}>
                    <Ionicons name={(insight.icon as IconName) || 'analytics'} size={22} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.insightTitle, { color: c.text }]}>{insight.title}</Text>
                    <Text style={[styles.insightMsg, { color: c.textSecondary }]}>{insight.message}</Text>
                  </View>
                </Animated.View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  px: { paddingHorizontal: 20 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20, marginTop: 16, marginBottom: 18 },
  tile: { width: (width - 52) / 2, borderRadius: radius.lg, padding: 16 },
  tileIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  tileLabel: { fontSize: 12.5, fontWeight: '700' },
  tileValue: { fontSize: 21, fontWeight: '900', letterSpacing: -0.5, marginTop: 3 },
  tileHint: { fontSize: 11.5, fontWeight: '600', marginTop: 3 },

  catRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  catTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catName: { fontSize: 14.5, fontWeight: '800', flex: 1, marginRight: 8 },
  catAmt: { fontSize: 14, fontWeight: '800' },
  catBottom: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 7 },
  catTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  catPct: { fontSize: 11.5, fontWeight: '700', minWidth: 58, textAlign: 'right' },

  legendRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, fontWeight: '600' },

  insight: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderRadius: radius.lg, padding: 16, paddingLeft: 20, overflow: 'hidden' },
  insightAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  insightIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  insightTitle: { fontSize: 15.5, fontWeight: '800', marginBottom: 4, letterSpacing: -0.2 },
  insightMsg: { fontSize: 13.5, lineHeight: 20 },
  aiCta: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: radius.lg, padding: 18 },
  aiCtaTitle: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  aiCtaBody: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },
});
