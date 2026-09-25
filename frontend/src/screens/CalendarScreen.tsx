import React, { useState, useMemo, useRef } from 'react';
import { useScrollToTop } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore, Transaction } from '../store/useStore';
import { formatCurrency } from '../utils/formatCurrency';
import { useTheme, brand, radius, shadow } from '../theme';
import { ScreenTitle, Card, TransactionRow, EmptyState, PressableScale } from '../components/ui';

// Local YYYY-MM-DD (toISOString would shift late-evening entries to the next day)
const localKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function CalendarScreen({ navigation }: any) {
  const { c, isDark } = useTheme();
  const { transactions, currency, exchangeRates, enableConversion } = useStore();
  const rates = enableConversion ? exchangeRates : null;
  const todayKey = localKey(new Date());
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);
  const [visibleMonth, setVisibleMonth] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() + 1 }; });

  const { markedDates, dayTx, dayTotals, monthTotals } = useMemo(() => {
    const marks: Record<string, any> = {};
    const txMap: Record<string, Transaction[]> = {};
    const totals: Record<string, { income: number; expense: number }> = {};
    const month = { income: 0, expense: 0 };

    transactions.forEach(t => {
      const d = new Date(t.date);
      const key = localKey(d);
      (txMap[key] ||= []).push(t);
      const tot = (totals[key] ||= { income: 0, expense: 0 });
      if (t.type === 'income') tot.income += t.amount; else tot.expense += t.amount;
      if (d.getFullYear() === visibleMonth.y && d.getMonth() + 1 === visibleMonth.m) {
        if (t.type === 'income') month.income += t.amount; else month.expense += t.amount;
      }
    });

    Object.keys(totals).forEach(key => {
      const dots = [];
      if (totals[key].income > 0) dots.push({ key: 'income', color: brand.income, selectedDotColor: '#FFF' });
      if (totals[key].expense > 0) dots.push({ key: 'expense', color: brand.primary, selectedDotColor: '#FFF' });
      marks[key] = { dots };
    });
    marks[selectedDate] = { ...(marks[selectedDate] || {}), selected: true, selectedColor: brand.primary };

    return { markedDates: marks, dayTx: txMap, dayTotals: totals, monthTotals: month };
  }, [transactions, selectedDate, visibleMonth]);

  const currentTx = dayTx[selectedDate] || [];
  const current = dayTotals[selectedDate] || { income: 0, expense: 0 };
  const monthName = new Date(visibleMonth.y, visibleMonth.m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      <ScreenTitle
        title="Calendar"
        subtitle={monthName}
        right={selectedDate !== todayKey ? (
          <PressableScale onPress={() => setSelectedDate(todayKey)} style={[styles.todayBtn, { backgroundColor: c.primarySoft }]}>
            <Text style={styles.todayText}>Today</Text>
          </PressableScale>
        ) : undefined}
      />

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>
        <View style={styles.px}>
          <Card padded={false} style={{ overflow: 'hidden', paddingBottom: 6 }}>
            <Calendar
              key={isDark ? 'dark' : 'light'}
              current={selectedDate}
              onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
              onMonthChange={(m: DateData) => setVisibleMonth({ y: m.year, m: m.month })}
              markingType="multi-dot"
              markedDates={markedDates}
              enableSwipeMonths
              renderArrow={(dir: 'left' | 'right') => (
                <View style={[styles.arrow, { backgroundColor: c.surfaceAlt }]}>
                  <Ionicons name={dir === 'left' ? 'chevron-back' : 'chevron-forward'} size={16} color={c.text} />
                </View>
              )}
              theme={{
                calendarBackground: c.surface,
                textSectionTitleColor: c.textTertiary,
                selectedDayBackgroundColor: brand.primary,
                selectedDayTextColor: '#FFFFFF',
                todayTextColor: brand.primary,
                dayTextColor: c.text,
                textDisabledColor: c.textTertiary,
                monthTextColor: c.text,
                arrowColor: brand.primary,
                textDayFontWeight: '600',
                textMonthFontWeight: '900',
                textDayHeaderFontWeight: '700',
                textMonthFontSize: 17,
                textDayFontSize: 15,
                textDayHeaderFontSize: 12,
              }}
            />
          </Card>

          {/* Month summary */}
          <View style={[styles.monthStrip, { backgroundColor: c.surface }, shadow(c, 1)]}>
            <View style={styles.monthCell}>
              <Text style={[styles.monthLabel, { color: c.textSecondary }]}>Earned this month</Text>
              <Text style={[styles.monthValue, { color: brand.income }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatCurrency(monthTotals.income, currency, rates)}
              </Text>
            </View>
            <View style={[styles.monthDivider, { backgroundColor: c.divider }]} />
            <View style={styles.monthCell}>
              <Text style={[styles.monthLabel, { color: c.textSecondary }]}>Spent this month</Text>
              <Text style={[styles.monthValue, { color: c.text }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatCurrency(monthTotals.expense, currency, rates)}
              </Text>
            </View>
          </View>

          {/* Selected day */}
          <View style={styles.dayHead}>
            <Text style={[styles.dayTitle, { color: c.text }]}>
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
            <View style={styles.dayChips}>
              {current.income > 0 && (
                <View style={[styles.dayChip, { backgroundColor: c.incomeSoft }]}>
                  <Text style={[styles.dayChipText, { color: brand.income }]}>+{formatCurrency(current.income, currency, rates)}</Text>
                </View>
              )}
              {current.expense > 0 && (
                <View style={[styles.dayChip, { backgroundColor: c.primarySoft }]}>
                  <Text style={[styles.dayChipText, { color: brand.primary }]}>−{formatCurrency(current.expense, currency, rates)}</Text>
                </View>
              )}
            </View>
          </View>

          <Card padded={false} style={{ overflow: 'hidden' }}>
            {currentTx.length === 0 ? (
              <EmptyState
                icon="calendar-outline"
                title="A quiet day"
                message="No transactions on this date."
                action="Add one"
                onAction={() => navigation.navigate('AddTransaction')}
                compact
              />
            ) : (
              currentTx.map((t, i) => (
                <TransactionRow
                  key={t._id}
                  t={t}
                  currency={currency}
                  rates={rates}
                  last={i === currentTx.length - 1}
                  onPress={() => navigation.navigate('TransactionDetails', { transaction: t })}
                />
              ))
            )}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  px: { paddingHorizontal: 20 },
  todayBtn: { paddingHorizontal: 14, height: 36, borderRadius: 18, justifyContent: 'center' },
  todayText: { color: brand.primary, fontSize: 13.5, fontWeight: '800' },
  arrow: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  monthStrip: { flexDirection: 'row', borderRadius: radius.lg, padding: 16, marginTop: 14 },
  monthCell: { flex: 1 },
  monthLabel: { fontSize: 12, fontWeight: '700' },
  monthValue: { fontSize: 19, fontWeight: '900', marginTop: 3, letterSpacing: -0.4 },
  monthDivider: { width: 1, marginHorizontal: 14 },
  dayHead: { marginTop: 22, marginBottom: 12, gap: 8 },
  dayTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  dayChips: { flexDirection: 'row', gap: 8 },
  dayChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  dayChipText: { fontSize: 12.5, fontWeight: '800' },
});
