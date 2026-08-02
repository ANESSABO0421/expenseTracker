import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useStore } from '../store/useStore';
import { BackgroundGradient } from '../components/BackgroundGradient';
import { GlassCard } from '../components/GlassCard';

export default function TransactionDetailsScreen({ route, navigation }: any) {
  const { transaction } = route.params;
  const { updateTransaction, deleteTransaction, currency, exchangeRates } = useStore();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [isEditing, setIsEditing] = useState(false);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [category, setCategory] = useState(transaction.category);
  const [description, setDescription] = useState(transaction.description || '');

  const handleDelete = () => {
    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            await deleteTransaction(transaction._id);
            navigation.goBack();
          }
        }
      ]
    );
  };

  const handleSave = async () => {
    const updatedData = {
      amount: parseFloat(amount) || 0,
      category,
      description
    };
    await updateTransaction(transaction._id, updatedData);
    setIsEditing(false);
  };

  const isIncome = transaction.type === 'income';
  const displayAmount = (parseFloat(amount) || transaction.amount);
  // Display amount converted to selected currency
  const convertedAmount = exchangeRates && exchangeRates[currency] ? displayAmount * exchangeRates[currency] : displayAmount;
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(convertedAmount);

  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.iconBtn, { backgroundColor: isDark ? '#111' : '#FFF' }]}>
            <Ionicons name="close" size={24} color={isDark ? '#FFF' : '#111'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#FFF' : '#111' }]}>
            {isEditing ? 'Edit Transaction' : 'Details'}
          </Text>
          <TouchableOpacity onPress={() => isEditing ? handleSave() : setIsEditing(true)} style={[styles.iconBtn, { backgroundColor: isDark ? '#111' : '#FFF' }]}>
            <Ionicons name={isEditing ? "checkmark" : "pencil"} size={20} color={isDark ? '#FFF' : '#111'} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <GlassCard style={styles.mainCard} intensity={isDark ? 40 : 80}>
            
            <View style={[styles.iconCircle, { backgroundColor: isIncome ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
              <Ionicons name={isIncome ? 'arrow-down' : 'arrow-up'} size={40} color={isIncome ? '#10B981' : '#EF4444'} />
            </View>
            
            {isEditing ? (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Amount (Base USD)</Text>
                <TextInput
                  style={[styles.input, { color: isDark ? '#FFF' : '#111', borderColor: isDark ? '#333' : '#E5E7EB' }]}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                />
                
                <Text style={[styles.label, { color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 16 }]}>Category</Text>
                <TextInput
                  style={[styles.input, { color: isDark ? '#FFF' : '#111', borderColor: isDark ? '#333' : '#E5E7EB' }]}
                  value={category}
                  onChangeText={setCategory}
                />
                
                <Text style={[styles.label, { color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 16 }]}>Description</Text>
                <TextInput
                  style={[styles.input, { color: isDark ? '#FFF' : '#111', borderColor: isDark ? '#333' : '#E5E7EB' }]}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                />
              </View>
            ) : (
              <>
                <Text style={[styles.amountText, { color: isIncome ? '#10B981' : (isDark ? '#FFF' : '#111') }]}>
                  {isIncome ? '+' : '-'}{formattedAmount}
                </Text>
                
                <View style={styles.detailsRow}>
                  <Text style={[styles.detailLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Category</Text>
                  <Text style={[styles.detailValue, { color: isDark ? '#FFF' : '#111' }]}>{transaction.category}</Text>
                </View>
                
                <View style={styles.detailsRow}>
                  <Text style={[styles.detailLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Date</Text>
                  <Text style={[styles.detailValue, { color: isDark ? '#FFF' : '#111' }]}>{new Date(transaction.date).toLocaleString()}</Text>
                </View>
                
                {transaction.description ? (
                  <View style={styles.detailsRow}>
                    <Text style={[styles.detailLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Note</Text>
                    <Text style={[styles.detailValue, { color: isDark ? '#FFF' : '#111' }]}>{transaction.description}</Text>
                  </View>
                ) : null}

                {transaction.receiptUrl && (
                  <View style={styles.receiptContainer}>
                    <Text style={[styles.detailLabel, { color: isDark ? '#9CA3AF' : '#6B7280', marginBottom: 12 }]}>Receipt</Text>
                    <Image source={{ uri: transaction.receiptUrl }} style={styles.receiptImage} resizeMode="cover" />
                  </View>
                )}
              </>
            )}
          </GlassCard>

          {!isEditing && (
            <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={styles.deleteText}>Delete Transaction</Text>
            </TouchableOpacity>
          )}

        </ScrollView>
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 24 },
  mainCard: { padding: 32, alignItems: 'center', borderRadius: 40 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  amountText: { fontSize: 48, fontWeight: '900', trackingTighter: -2, marginBottom: 32 },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(150,150,150,0.2)' },
  detailLabel: { fontSize: 16, fontWeight: '600' },
  detailValue: { fontSize: 16, fontWeight: '700' },
  receiptContainer: { width: '100%', marginTop: 24 },
  receiptImage: { width: '100%', height: 200, borderRadius: 16 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 32, padding: 16, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 24 },
  deleteText: { color: '#EF4444', fontSize: 16, fontWeight: '700', marginLeft: 8 },
  inputGroup: { width: '100%' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' },
  input: { borderWidth: 1, borderRadius: 16, padding: 16, fontSize: 16, fontWeight: '600' }
});
