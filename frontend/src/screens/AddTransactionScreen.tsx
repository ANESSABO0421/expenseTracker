import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import { useStore, API_URL } from '../store/useStore';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { parseSpokenTransaction } from '../utils/nlpParser';

// Map currency code → symbol
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥', CAD: 'CA$', AUD: 'A$',
};

const CATEGORIES = {
  expense: ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Travel', 'Other'],
  income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Rental', 'Business', 'Other'],
};

export default function AddTransactionScreen({ navigation }: any) {
  const { user, addTransaction, isLoading, currency, exchangeRates } = useStore();
  // Read enableConversion separately with a safe default
  const enableConversion = useStore((state) => state.enableConversion ?? false);
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>(undefined);
  const [isScanning, setIsScanning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  // Currency symbol derived from selected currency
  const currencySymbol = CURRENCY_SYMBOLS[currency] || currency;

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bg = isDark ? '#000000' : '#F2F2F7';
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#1C1C1E';
  const textSecondary = isDark ? '#8E8E93' : '#6C6C70';
  const inputBg = isDark ? '#2C2C2E' : '#F2F2F7';
  const separator = isDark ? '#2C2C2E' : '#E5E5EA';

  const isExpense = type === 'expense';
  const accentColor = isExpense ? '#FF3B30' : '#34C759';

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript;
    if (transcript) {
      const { amount: a, category: c, description: d } = parseSpokenTransaction(transcript);
      setAmount(a); setCategory(c); setDescription(d);
      Toast.show({ type: 'success', text1: 'Voice Recognized', text2: 'Transaction details extracted!' });
    }
    setIsRecording(false); setIsProcessingVoice(false);
  });

  useSpeechRecognitionEvent('error', (event) => {
    setIsRecording(false); setIsProcessingVoice(false);
    Toast.show({ type: 'error', text1: 'Recognition Failed', text2: 'Please try speaking again.' });
  });

  useSpeechRecognitionEvent('end', () => {
    setIsRecording(false); setIsProcessingVoice(false);
  });

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount))) {
      Toast.show({ type: 'error', text1: 'Invalid Amount', text2: 'Please enter a valid number.' });
      return;
    }
    if (!category.trim()) {
      Toast.show({ type: 'error', text1: 'Category Required', text2: 'Please enter a category.' });
      return;
    }
    if (user?._id) {
      const rate = exchangeRates && exchangeRates[currency] ? exchangeRates[currency] : 1;
      const baseAmount = Number(amount); // Always save raw amount — conversion is display-only

      await addTransaction({ user: user._id, amount: baseAmount, type, category, description, receiptUrl });
      Toast.show({ type: 'success', text1: 'Saved!', text2: 'Transaction added successfully.' });
      navigation.goBack();
    }
  };

  const processImageResult = async (result: any) => {
    if (result.canceled || !result.assets[0]?.base64) return;

    setIsScanning(true);
    try {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;

      const response = await fetch(`${API_URL}/scan-receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Image }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Server error during receipt scan');
      }

      const { receiptUrl: url, amount: extractedAmount, category: extractedCategory, description: extractedDesc } = data.data;

      if (url) setReceiptUrl(url);
      if (extractedAmount) setAmount(String(extractedAmount));
      if (extractedCategory) setCategory(extractedCategory);
      if (extractedDesc) setDescription(extractedDesc);

      Toast.show({
        type: 'success',
        text1: '✅ Receipt Scanned!',
        text2: `Extracted: ${extractedCategory} — ${currencySymbol}${extractedAmount}`,
      });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Scan Failed',
        text2: err.message || 'Could not read the receipt. Please try again.',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleScanReceipt = () => {
    Alert.alert(
      'Scan Receipt',
      'Choose an option to scan your receipt',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'Camera access is required.' });
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              quality: 0.6,
              base64: true,
            });
            processImageResult(result);
          }
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'Gallery access is required.' });
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              allowsEditing: true,
              quality: 0.6,
              base64: true,
            });
            processImageResult(result);
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const toggleRecording = async () => {
    try {
      if (isRecording) {
        ExpoSpeechRecognitionModule.stop();
        setIsRecording(false); setIsProcessingVoice(true);
      } else {
        const { status } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (status !== 'granted') return;
        ExpoSpeechRecognitionModule.start({ lang: 'en-US', interimResults: false });
        setIsRecording(true);
      }
    } catch {
      setIsRecording(false); setIsProcessingVoice(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: textPrimary }]}>New Entry</Text>
            <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.closeBtn, { backgroundColor: cardBg }]}>
              <Ionicons name="close" size={20} color={textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Type Toggle */}
          <View style={[styles.typeToggle, { backgroundColor: cardBg }]}>
            <TouchableOpacity
              style={[styles.typeBtn, isExpense && { backgroundColor: '#FF3B30' }]}
              onPress={() => setType('expense')}
            >
              <Ionicons name="arrow-up" size={16} color={isExpense ? '#FFF' : textSecondary} />
              <Text style={[styles.typeBtnText, { color: isExpense ? '#FFF' : textSecondary }]}>Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, !isExpense && { backgroundColor: '#34C759' }]}
              onPress={() => setType('income')}
            >
              <Ionicons name="arrow-down" size={16} color={!isExpense ? '#FFF' : textSecondary} />
              <Text style={[styles.typeBtnText, { color: !isExpense ? '#FFF' : textSecondary }]}>Income</Text>
            </TouchableOpacity>
          </View>

          {/* Amount Display */}
          <View style={[styles.amountCard, { backgroundColor: cardBg }]}>
            <Text style={[styles.amountLabel, { color: textSecondary }]}>Amount</Text>
            <View style={styles.amountRow}>
              <Text style={[styles.currencySymbol, { color: accentColor }]}>{currencySymbol}</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={isDark ? '#3A3A3C' : '#D1D1D6'}
                keyboardType="decimal-pad"
                style={[styles.amountInput, { color: textPrimary }]}
                autoFocus
              />
            </View>
            <View style={[styles.amountDivider, { backgroundColor: accentColor }]} />
          </View>

          {/* Category Chips */}
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <Text style={[styles.fieldLabel, { color: textSecondary }]}>Quick Select</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              <View style={styles.chipsRow}>
                {CATEGORIES[type].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: category === cat ? accentColor : cardBg,
                        borderColor: category === cat ? accentColor : separator,
                      }
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.chipText, { color: category === cat ? '#FFF' : textSecondary }]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Fields */}
          <View style={[styles.fieldsCard, { backgroundColor: cardBg }]}>
            <View style={styles.fieldRow}>
              <Ionicons name="pricetag-outline" size={18} color={textSecondary} style={{ marginRight: 14 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>Category</Text>
                <TextInput
                  value={category}
                  onChangeText={setCategory}
                  placeholder="Food, Rent, Salary..."
                  placeholderTextColor={isDark ? '#3A3A3C' : '#C7C7CC'}
                  style={[styles.fieldInput, { color: textPrimary }]}
                />
              </View>
            </View>

            <View style={[styles.fieldSeparator, { backgroundColor: separator }]} />

            <View style={styles.fieldRow}>
              <Ionicons name="document-text-outline" size={18} color={textSecondary} style={{ marginRight: 14 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>Notes</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Add details (optional)"
                  placeholderTextColor={isDark ? '#3A3A3C' : '#C7C7CC'}
                  style={[styles.fieldInput, { color: textPrimary }]}
                  multiline
                />
              </View>
            </View>
          </View>

          {/* AI Features Row */}
          <View style={styles.aiRow}>
            <TouchableOpacity
              onPress={toggleRecording}
              disabled={isProcessingVoice || isScanning}
              style={[
                styles.aiBtn,
                {
                  backgroundColor: isRecording ? 'rgba(255,59,48,0.12)' : cardBg,
                  borderColor: isRecording ? '#FF3B30' : separator,
                }
              ]}
            >
              {isProcessingVoice ? (
                <ActivityIndicator color="#FF3B30" size="small" />
              ) : (
                <>
                  <View style={[styles.aiBtnIcon, { backgroundColor: isRecording ? 'rgba(255,59,48,0.15)' : 'rgba(0,122,255,0.1)' }]}>
                    <Ionicons name={isRecording ? 'stop' : 'mic'} size={20} color={isRecording ? '#FF3B30' : '#007AFF'} />
                  </View>
                  <Text style={[styles.aiBtnText, { color: isRecording ? '#FF3B30' : textPrimary }]}>
                    {isRecording ? 'Stop' : 'Voice'}
                  </Text>
                  <Text style={[styles.aiBtnSub, { color: textSecondary }]}>AI input</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleScanReceipt}
              disabled={isScanning || isProcessingVoice}
              style={[styles.aiBtn, { backgroundColor: cardBg, borderColor: separator }]}
            >
              {isScanning ? (
                <ActivityIndicator color="#007AFF" size="small" />
              ) : (
                <>
                  <View style={[styles.aiBtnIcon, { backgroundColor: 'rgba(88,86,214,0.1)' }]}>
                    <Ionicons name="scan" size={20} color="#5856D6" />
                  </View>
                  <Text style={[styles.aiBtnText, { color: textPrimary }]}>Scan</Text>
                  <Text style={[styles.aiBtnSub, { color: textSecondary }]}>Receipt</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Save Button */}
          <TouchableOpacity onPress={handleSave} disabled={isLoading} activeOpacity={0.85} style={styles.saveWrapper}>
            <LinearGradient
              colors={isExpense ? ['#FF3B30', '#FF6B6B'] : ['#34C759', '#30D158']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveBtn}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.saveBtnText}>Save Transaction</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  typeToggle: { flexDirection: 'row', marginHorizontal: 20, borderRadius: 14, padding: 4, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 6 },
  typeBtnText: { fontSize: 15, fontWeight: '700' },
  amountCard: { marginHorizontal: 20, borderRadius: 20, padding: 24, marginBottom: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  amountLabel: { fontSize: 13, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  currencySymbol: { fontSize: 40, fontWeight: '700', marginRight: 4 },
  amountInput: { fontSize: 56, fontWeight: '700', letterSpacing: -2, minWidth: 120 },
  amountDivider: { height: 3, width: 80, borderRadius: 2, marginTop: 12, opacity: 0.6 },
  fieldLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
  chipsRow: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 14, fontWeight: '500' },
  fieldsCard: { marginHorizontal: 20, borderRadius: 20, overflow: 'hidden', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  fieldRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingVertical: 16 },
  fieldInput: { fontSize: 16, fontWeight: '500', marginTop: 2 },
  fieldSeparator: { height: StyleSheet.hairlineWidth, marginLeft: 52 },
  aiRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  aiBtn: { flex: 1, borderRadius: 16, borderWidth: 1, paddingVertical: 16, paddingHorizontal: 16, alignItems: 'center', gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  aiBtnIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  aiBtnText: { fontSize: 15, fontWeight: '700' },
  aiBtnSub: { fontSize: 12, fontWeight: '500' },
  saveWrapper: { marginHorizontal: 20 },
  saveBtn: { borderRadius: 16, paddingVertical: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 6 },
  saveBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
