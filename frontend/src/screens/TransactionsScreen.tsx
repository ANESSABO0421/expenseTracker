import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useStore, Transaction } from '../store/useStore';
import AnimatedCard from '../components/AnimatedCard';
import { formatCurrency } from '../utils/formatCurrency';

export default function TransactionsScreen({ navigation }: any) {
  const { transactions, currency, exchangeRates, enableConversion } = useStore();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bg = isDark ? '#000000' : '#F2F2F7';
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#1C1C1E';
  const textSecondary = isDark ? '#8E8E93' : '#6C6C70';
  const separator = isDark ? '#2C2C2E' : '#E5E5EA';

  const [selectedMonth, setSelectedMonth] = useState<string>('All');

  // Extract unique months from transactions
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach(t => {
      const date = new Date(t.date);
      const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      months.add(monthYear);
    });
    // Sort descending (latest first)
    const sorted = Array.from(months).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    return ['All', ...sorted];
  }, [transactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (selectedMonth === 'All') return transactions;
    return transactions.filter(t => {
      const date = new Date(t.date);
      const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      return monthYear === selectedMonth;
    });
  }, [transactions, selectedMonth]);

  const renderTransaction = ({ item: t, index }: { item: Transaction, index: number }) => {
    const isIncome = t.type === 'income';
    return (
      <AnimatedCard delay={index * 50}>
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
              {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
          <Text style={[styles.txAmount, { color: isIncome ? '#34C759' : textPrimary }]}>
            {isIncome ? '+' : '-'}{formatCurrency(t.amount, currency, enableConversion ? exchangeRates : null)}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={textSecondary} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </AnimatedCard>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Transactions</Text>
      </View>

      {/* Month Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {availableMonths.map((month) => {
            const isSelected = selectedMonth === month;
            return (
              <TouchableOpacity
                key={month}
                onPress={() => setSelectedMonth(month)}
                style={[
                  styles.filterChip,
                  { backgroundColor: isSelected ? '#007AFF' : cardBg }
                ]}
              >
                <Text style={[
                  styles.filterText,
                  { color: isSelected ? '#FFFFFF' : textPrimary }
                ]}>
                  {month}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Transactions List */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item._id || Math.random().toString()}
        renderItem={renderTransaction}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color={textSecondary} style={{ marginBottom: 16, opacity: 0.5 }} />
            <Text style={[styles.emptyText, { color: textSecondary }]}>No transactions found.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  txInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  txCategory: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  txDate: {
    fontSize: 13,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
  }
});
