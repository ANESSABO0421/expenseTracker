import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Image, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useStore, Transaction } from '../store/useStore';
import { formatCurrency, toBaseAmount, toDisplayAmount } from '../utils/formatCurrency';
import { useTheme, brand, radius, shadow } from '../theme';
import { categoryMeta } from '../theme/categories';
import { IconButton, PrimaryButton, GhostButton, CategoryIcon } from '../components/ui';

type IconName = keyof typeof Ionicons.glyphMap;

export default function TransactionDetailsScreen({ route, navigation }: any) {
  const { transaction: initial } = route.params as { transaction: Transaction };
  const { updateTransaction, deleteTransaction, currency, exchangeRates, enableConversion, transactions } = useStore();
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const rates = enableConversion ? exchangeRates : null;

  // Prefer the live copy from the store so edits show immediately.
  const transaction = transactions.find(t => t._id === initial._id) ?? initial;

  // The edit field works in the display currency, like the rest of the screen
  const displayAmount = String(Math.round(toDisplayAmount(transaction.amount, currency, rates) * 100) / 100);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [amount, setAmount] = useState(displayAmount);
  const [category, setCategory] = useState(transaction.category);
  const [description, setDescription] = useState(transaction.description || '');

  const isIncome = transaction.type === 'income';
  const meta = categoryMeta(transaction.category);
  const date = new Date(transaction.date);

  const handleDelete = () => {
    Alert.alert('Delete transaction', 'This can’t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteTransaction(transaction._id);
          navigation.goBack();
        },
      },
    ]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Untouched amount keeps its exact stored value (no conversion round-trip drift)
    const stored = amount === displayAmount ? transaction.amount : toBaseAmount(parseFloat(amount) || 0, currency, rates);
    await updateTransaction(transaction._id, { amount: stored, category, description });
    setIsSaving(false);
    setIsEditing(false);
  };

  // Re-sync the fields with the stored transaction each time editing starts
  const startEdit = () => {
    setAmount(displayAmount);
    setCategory(transaction.category);
    setDescription(transaction.description || '');
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setAmount(displayAmount);
    setCategory(transaction.category);
    setDescription(transaction.description || '');
    setIsEditing(false);
  };

  const rows: { icon: IconName; label: string; value: string }[] = [
    { icon: 'pricetag-outline', label: 'Category', value: transaction.category },
    { icon: isIncome ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline', label: 'Type', value: isIncome ? 'Income' : 'Expense' },
    { icon: 'calendar-outline', label: 'Date', value: date.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }) },
    { icon: 'time-outline', label: 'Time', value: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <IconButton icon="close" onPress={() => (isEditing ? cancelEdit() : navigation.goBack())} />
          <Text style={[styles.headerTitle, { color: c.text }]}>{isEditing ? 'Edit transaction' : 'Transaction'}</Text>
          {isEditing ? <View style={{ width: 42 }} /> : <IconButton icon="create-outline" onPress={startEdit} />}
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {/* Hero */}
          <Animated.View entering={FadeInDown.duration(400)} style={[styles.hero, { backgroundColor: c.surface }, shadow(c, 2)]}>
            <View style={[styles.heroGlow, { backgroundColor: meta.color + '14' }]} />
            <CategoryIcon category={transaction.category} size={68} rounded={24} />
            <Text style={[styles.heroCategory, { color: c.textSecondary }]}>{transaction.category}</Text>
            <Text style={[styles.heroAmount, { color: isIncome ? brand.income : c.text }]} numberOfLines={1} adjustsFontSizeToFit>
              {isIncome ? '+' : '−'}{formatCurrency(transaction.amount, currency, rates)}
            </Text>
            <View style={[styles.statusPill, { backgroundColor: isIncome ? c.incomeSoft : c.expenseSoft }]}>
              <Ionicons name="checkmark-circle" size={13} color={isIncome ? brand.income : brand.expense} />
              <Text style={[styles.statusText, { color: isIncome ? brand.income : brand.expense }]}>
                {isIncome ? 'Received' : 'Paid'}
              </Text>
            </View>

            {/* Perforation */}
            <View style={styles.perfRow}>
              <View style={[styles.notch, { backgroundColor: c.bg, left: -30 }]} />
              <View style={[styles.dash, { borderColor: c.border }]} />
              <View style={[styles.notch, { backgroundColor: c.bg, right: -30 }]} />
            </View>

            {isEditing ? (
              <View style={{ width: '100%', gap: 14 }}>
                <EditField label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
                <EditField label="Category" value={category} onChangeText={setCategory} />
                <EditField label="Note" value={description} onChangeText={setDescription} multiline placeholder="Add a note" />
              </View>
            ) : (
              <View style={{ width: '100%' }}>
                {rows.map(r => (
                  <View key={r.label} style={styles.row}>
                    <Ionicons name={r.icon} size={17} color={c.textTertiary} />
                    <Text style={[styles.rowLabel, { color: c.textSecondary }]}>{r.label}</Text>
                    <Text style={[styles.rowValue, { color: c.text }]} numberOfLines={1}>{r.value}</Text>
                  </View>
                ))}
                {transaction.description ? (
                  <View style={[styles.note, { backgroundColor: c.surfaceAlt }]}>
                    <Text style={[styles.noteLabel, { color: c.textSecondary }]}>NOTE</Text>
                    <Text style={[styles.noteText, { color: c.text }]}>{transaction.description}</Text>
                  </View>
                ) : null}
              </View>
            )}
          </Animated.View>

          {transaction.receiptUrl && !isEditing && (
            <Animated.View entering={FadeInDown.delay(100).duration(400)} style={{ marginTop: 18 }}>
              <Text style={[styles.receiptLabel, { color: c.text }]}>Receipt</Text>
              <Image source={{ uri: transaction.receiptUrl }} style={[styles.receipt, { backgroundColor: c.surfaceAlt }]} resizeMode="cover" />
            </Animated.View>
          )}
        </ScrollView>

        <View style={[styles.bottomBar, { backgroundColor: c.surface, borderTopColor: c.border, paddingBottom: Math.max(insets.bottom, 14) }]}>
          {isEditing ? (
            <>
              <GhostButton title="Cancel" onPress={cancelEdit} style={{ flex: 1 }} />
              <PrimaryButton title="Save changes" icon="checkmark" onPress={handleSave} loading={isSaving} style={{ flex: 2 }} />
            </>
          ) : (
            <>
              <GhostButton title="Delete" icon="trash-outline" color={brand.expense} onPress={handleDelete} style={{ flex: 1 }} />
              <PrimaryButton title="Edit" icon="create-outline" onPress={startEdit} style={{ flex: 1 }} />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function EditField({ label, ...props }: React.ComponentProps<typeof TextInput> & { label: string }) {
  const { c } = useTheme();
  return (
    <View>
      <Text style={[styles.editLabel, { color: c.textSecondary }]}>{label}</Text>
      <TextInput
        placeholderTextColor={c.textTertiary}
        selectionColor={brand.primary}
        {...props}
        style={[styles.editInput, { color: c.text, backgroundColor: c.surfaceAlt, borderColor: c.border }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  headerTitle: { fontSize: 17, fontWeight: '800' },

  hero: { borderRadius: 26, padding: 22, alignItems: 'center', overflow: 'hidden' },
  heroGlow: { position: 'absolute', top: -80, width: 260, height: 200, borderRadius: 130 },
  heroCategory: { fontSize: 14, fontWeight: '700', marginTop: 14 },
  heroAmount: { fontSize: 42, fontWeight: '900', letterSpacing: -1.5, marginTop: 4 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginTop: 10 },
  statusText: { fontSize: 12, fontWeight: '800' },

  perfRow: { width: '100%', height: 28, justifyContent: 'center', marginVertical: 14 },
  notch: { position: 'absolute', width: 28, height: 28, borderRadius: 14 },
  dash: { borderTopWidth: 1.5, borderStyle: 'dashed', marginHorizontal: 6 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  rowLabel: { fontSize: 14.5, fontWeight: '600', width: 80 },
  rowValue: { flex: 1, textAlign: 'right', fontSize: 14.5, fontWeight: '800' },
  note: { borderRadius: radius.md, padding: 14, marginTop: 10 },
  noteLabel: { fontSize: 10.5, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  noteText: { fontSize: 14.5, fontWeight: '500', lineHeight: 20 },

  receiptLabel: { fontSize: 16, fontWeight: '900', marginBottom: 10 },
  receipt: { width: '100%', height: 240, borderRadius: radius.lg },

  editLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6 },
  editInput: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, fontWeight: '700' },

  bottomBar: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth },
});
