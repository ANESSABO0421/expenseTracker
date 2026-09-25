import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { View, Text, SectionList, StyleSheet, ScrollView, TextInput, RefreshControl } from 'react-native';
import { useScrollToTop } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../utils/formatCurrency';
import { useTheme, brand, radius, shadow } from '../theme';
import { groupByDay } from '../theme/categories';
import {
  ScreenTitle, SearchField, Segmented, Chip, TransactionRow, EmptyState, TransactionSkeleton, IconButton,
} from '../components/ui';

const monthKey = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

export default function TransactionsScreen({ navigation, route }: any) {
  const { transactions, currency, exchangeRates, enableConversion, isLoading, user, fetchTransactions } = useStore();
  const { c } = useTheme();
  const rates = enableConversion ? exchangeRates : null;

  const [query, setQuery] = useState('');
  const [type, setType] = useState<'all' | 'expense' | 'income'>('all');
  const [month, setMonth] = useState('All');
  const [category, setCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<SectionList<any, any>>(null);
  useScrollToTop(listRef);

  // Deep links from Home: a tapped category, or the search bar.
  const paramCategory = route.params?.category as string | undefined;
  const paramFocus = route.params?.focusSearch as boolean | undefined;
  useEffect(() => {
    if (paramCategory) { setCategory(paramCategory); setType('all'); setMonth('All'); setQuery(''); }
    if (paramFocus) setTimeout(() => inputRef.current?.focus(), 350);
    if (paramCategory || paramFocus) navigation.setParams({ category: undefined, focusSearch: undefined });
  }, [paramCategory, paramFocus]);

  const months = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => set.add(monthKey(new Date(t.date))));
    return ['All', ...Array.from(set).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())];
  }, [transactions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter(t => {
      if (type !== 'all' && t.type !== type) return false;
      if (category && t.category.toLowerCase() !== category.toLowerCase()) return false;
      if (month !== 'All' && monthKey(new Date(t.date)) !== month) return false;
      if (q && !`${t.category} ${t.description ?? ''} ${t.amount}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [transactions, query, type, category, month]);

  const sections = useMemo(() => groupByDay(filtered), [filtered]);
  const totals = useMemo(() => filtered.reduce(
    (acc, t) => { t.type === 'income' ? (acc.in += t.amount) : (acc.out += t.amount); return acc; },
    { in: 0, out: 0 }
  ), [filtered]);

  const onRefresh = useCallback(async () => {
    if (!user?._id) return;
    setRefreshing(true);
    await fetchTransactions(user._id);
    setRefreshing(false);
  }, [user?._id]);

  const hasFilters = !!query || type !== 'all' || month !== 'All' || !!category;
  const clearAll = () => { setQuery(''); setType('all'); setMonth('All'); setCategory(null); };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      <ScreenTitle
        title="Activity"
        subtitle={`${transactions.length} transactions`}
        right={<IconButton icon="add" color={brand.primary} onPress={() => navigation.navigate('AddTransaction')} />}
      />

      <View style={styles.px}>
        <SearchField
          inputRef={inputRef}
          value={query}
          onChangeText={setQuery}
          placeholder="Search category, note or amount"
        />
        <Segmented
          value={type}
          onChange={setType}
          options={[{ key: 'all', label: 'All' }, { key: 'expense', label: 'Expenses' }, { key: 'income', label: 'Income' }]}
          style={{ marginTop: 12 }}
        />
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {category && (
            <Chip label={category} icon="close" active activeColor={brand.primary} onPress={() => setCategory(null)} />
          )}
          {months.map(m => (
            <Chip key={m} label={m} active={month === m} onPress={() => setMonth(m)} />
          ))}
        </ScrollView>
      </View>

      <SectionList
        ref={listRef}
        sections={sections}
        keyExtractor={(item, i) => item._id ?? String(i)}
        stickySectionHeadersEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 }}
        initialNumToRender={14}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brand.primary} colors={[brand.primary]} />}
        ListHeaderComponent={
          filtered.length > 0 ? (
            <View style={[styles.summary, { backgroundColor: c.surface }, shadow(c, 1)]}>
              <View style={styles.summaryCell}>
                <View style={[styles.summaryIcon, { backgroundColor: c.incomeSoft }]}>
                  <Ionicons name="arrow-down" size={14} color={brand.income} />
                </View>
                <View style={{ flexShrink: 1 }}>
                  <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>Money in</Text>
                  <Text style={[styles.summaryValue, { color: brand.income }]} numberOfLines={1} adjustsFontSizeToFit>
                    {formatCurrency(totals.in, currency, rates)}
                  </Text>
                </View>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: c.divider }]} />
              <View style={styles.summaryCell}>
                <View style={[styles.summaryIcon, { backgroundColor: c.expenseSoft }]}>
                  <Ionicons name="arrow-up" size={14} color={brand.expense} />
                </View>
                <View style={{ flexShrink: 1 }}>
                  <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>Money out</Text>
                  <Text style={[styles.summaryValue, { color: c.text }]} numberOfLines={1} adjustsFontSizeToFit>
                    {formatCurrency(totals.out, currency, rates)}
                  </Text>
                </View>
              </View>
            </View>
          ) : null
        }
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHead, { backgroundColor: c.bg }]}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>{section.title}</Text>
            <Text style={[styles.sectionNet, { color: section.net >= 0 ? brand.income : c.textSecondary }]}>
              {section.net >= 0 ? '+' : '−'}{formatCurrency(Math.abs(section.net), currency, rates)}
            </Text>
          </View>
        )}
        renderItem={({ item, index, section }) => (
          <View style={[
            styles.rowWrap,
            { backgroundColor: c.surface },
            index === 0 && styles.rowFirst,
            index === section.data.length - 1 && styles.rowLast,
          ]}>
            <TransactionRow
              t={item}
              currency={currency}
              rates={rates}
              last={index === section.data.length - 1}
              onPress={() => navigation.navigate('TransactionDetails', { transaction: item })}
            />
          </View>
        )}
        ListEmptyComponent={
          isLoading && transactions.length === 0 ? (
            <View style={[styles.rowWrap, styles.rowFirst, styles.rowLast, { backgroundColor: c.surface, marginTop: 8 }]}>
              <TransactionSkeleton rows={6} />
            </View>
          ) : hasFilters ? (
            <EmptyState icon="search" title="No matches" message="Try a different search or clear your filters." action="Clear filters" onAction={clearAll} />
          ) : (
            <EmptyState icon="receipt-outline" title="Nothing here yet" message="Every coffee, salary and bill you log shows up here." action="Add transaction" onAction={() => navigation.navigate('AddTransaction')} />
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  px: { paddingHorizontal: 20 },
  chips: { paddingHorizontal: 20, paddingVertical: 14, gap: 8 },
  summary: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 6, borderRadius: radius.lg, padding: 14 },
  summaryCell: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  summaryLabel: { fontSize: 11.5, fontWeight: '600' },
  summaryValue: { fontSize: 16, fontWeight: '900', marginTop: 1 },
  summaryDivider: { width: 1, marginHorizontal: 12 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '800' },
  sectionNet: { fontSize: 13, fontWeight: '800' },
  rowWrap: { marginHorizontal: 20, overflow: 'hidden' },
  rowFirst: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  rowLast: { borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.lg },
});
