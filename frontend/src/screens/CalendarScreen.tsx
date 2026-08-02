import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import { useStore, Transaction } from '../store/useStore';
import { formatCurrency } from '../utils/formatCurrency';

export default function CalendarScreen({ navigation }: any) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { transactions, currency, exchangeRates } = useStore();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const bg = isDark ? '#000000' : '#F2F2F7';
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#1C1C1E';
  const textSecondary = isDark ? '#8E8E93' : '#6C6C70';
  const separator = isDark ? '#2C2C2E' : '#E5E5EA';

  const { markedDates, dayTransactions, dailyTotals } = useMemo(() => {
    const marks: Record<string, any> = {};
    const dayTxMap: Record<string, Transaction[]> = {};
    const totalsMap: Record<string, { income: number; expense: number }> = {};

    transactions.forEach(t => {
      const dateStr = new Date(t.date).toISOString().split('T')[0];
      if (!dayTxMap[dateStr]) {
        dayTxMap[dateStr] = [];
        totalsMap[dateStr] = { income: 0, expense: 0 };
        marks[dateStr] = { dots: [] };
      }
      dayTxMap[dateStr].push(t);
      if (t.type === 'income') totalsMap[dateStr].income += t.amount;
      else totalsMap[dateStr].expense += t.amount;
    });

    Object.keys(totalsMap).forEach(dateStr => {
      const dots = [];
      if (totalsMap[dateStr].income > 0) dots.push({ key: 'income', color: '#34C759' });
      if (totalsMap[dateStr].expense > 0) dots.push({ key: 'expense', color: '#FF3B30' });
      marks[dateStr] = { dots, selected: dateStr === selectedDate, selectedColor: '#007AFF' };
    });

    if (!marks[selectedDate]) {
      marks[selectedDate] = { selected: true, selectedColor: '#007AFF' };
    } else {
      marks[selectedDate].selected = true;
      marks[selectedDate].selectedColor = '#007AFF';
    }

    return { markedDates: marks, dayTransactions: dayTxMap, dailyTotals: totalsMap };
  }, [transactions, selectedDate]);

  const currentDayTxs = dayTransactions[selectedDate] || [];
  const currentTotals = dailyTotals[selectedDate] || { income: 0, expense: 0 };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: separator }]}>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Calendar</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Calendar */}
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <Calendar
            current={selectedDate}
            onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
            markingType="multi-dot"
            markedDates={markedDates}
            theme={{
              calendarBackground: cardBg,
              textSectionTitleColor: textSecondary,
              selectedDayBackgroundColor: '#007AFF',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#007AFF',
              dayTextColor: textPrimary,
              textDisabledColor: isDark ? '#3A3A3C' : '#D1D1D6',
              monthTextColor: textPrimary,
              arrowColor: '#007AFF',
            }}
          />
        </View>

        {/* Daily Summary */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: cardBg }]}>
            <View style={[styles.summaryDot, { backgroundColor: 'rgba(52, 199, 89, 0.12)' }]}>
              <Ionicons name="arrow-down" size={14} color="#34C759" />
            </View>
            <Text style={[styles.summaryLabel, { color: textSecondary }]}>Income</Text>
            <Text style={[styles.summaryValue, { color: '#34C759' }]}>
              {formatCurrency(currentTotals.income, currency, exchangeRates)}
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: cardBg }]}>
            <View style={[styles.summaryDot, { backgroundColor: 'rgba(255, 59, 48, 0.12)' }]}>
              <Ionicons name="arrow-up" size={14} color="#FF3B30" />
            </View>
            <Text style={[styles.summaryLabel, { color: textSecondary }]}>Expense</Text>
            <Text style={[styles.summaryValue, { color: '#FF3B30' }]}>
              {formatCurrency(currentTotals.expense, currency, exchangeRates)}
            </Text>
          </View>
        </View>

        {/* Transactions for Selected Day */}
        <Text style={[styles.dayTitle, { color: textPrimary }]}>
          {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>

        {currentDayTxs.length === 0 ? (
          <View style={[styles.card, { backgroundColor: cardBg, alignItems: 'center', paddingVertical: 36 }]}>
            <Ionicons name="calendar-outline" size={32} color={textSecondary} />
            <Text style={[styles.emptyText, { color: textSecondary }]}>No transactions on this day</Text>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            {currentDayTxs.map((item, i) => (
              <TouchableOpacity
                key={item._id}
                style={[styles.txRow, { borderBottomColor: separator, borderBottomWidth: i < currentDayTxs.length - 1 ? StyleSheet.hairlineWidth : 0 }]}
                onPress={() => navigation.navigate('TransactionDetails', { transaction: item })}
                activeOpacity={0.7}
              >
                <View style={[styles.txIcon, { backgroundColor: item.type === 'income' ? 'rgba(52, 199, 89, 0.12)' : 'rgba(255, 59, 48, 0.12)' }]}>
                  <Ionicons name={item.type === 'income' ? 'arrow-down' : 'arrow-up'} size={16} color={item.type === 'income' ? '#34C759' : '#FF3B30'} />
                </View>
                <View style={styles.txInfo}>
                  <Text style={[styles.txCategory, { color: textPrimary }]}>{item.category}</Text>
                  {item.description ? <Text style={[styles.txDesc, { color: textSecondary }]}>{item.description}</Text> : null}
                </View>
                <Text style={[styles.txAmount, { color: item.type === 'income' ? '#34C759' : textPrimary }]}>
                  {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount, currency, exchangeRates)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  card: { marginHorizontal: 20, marginBottom: 16, borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 16 },
  summaryCard: { flex: 1, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  summaryDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  summaryLabel: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: '700' },
  dayTitle: { fontSize: 18, fontWeight: '700', paddingHorizontal: 20, marginBottom: 12 },
  emptyText: { marginTop: 12, fontSize: 15, fontWeight: '500' },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  txIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txInfo: { flex: 1 },
  txCategory: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  txDesc: { fontSize: 13 },
  txAmount: { fontSize: 16, fontWeight: '600' },
});
