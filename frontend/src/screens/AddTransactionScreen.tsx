import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet, Alert, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring, withRepeat, withTiming } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useStore } from '../store/useStore';
import { api } from '../utils/api';
import { parseSpokenTransaction } from '../utils/nlpParser';
import { toBaseAmount } from '../utils/formatCurrency';
import { useTheme, brand, radius, shadow, CURRENCY_SYMBOLS } from '../theme';
import { QUICK_CATEGORIES, categoryMeta } from '../theme/categories';
import { PressableScale, IconButton, PrimaryButton } from '../components/ui';

const { width } = Dimensions.get('window');
const TOGGLE_W = width - 40;
const TILE_W = (width - 40 - 30) / 4;
const QUICK_AMOUNTS = [10, 50, 100, 500];

export default function AddTransactionScreen({ navigation, route }: any) {
  const { user, addTransaction, isLoading, currency, enableConversion, exchangeRates } = useStore();
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const initialAction = route?.params?.action as 'scan' | 'voice' | undefined;

  const [type, setType] = useState<'expense' | 'income'>(route?.params?.type ?? 'expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>(undefined);
  const [isScanning, setIsScanning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  const currencySymbol = CURRENCY_SYMBOLS[currency] || currency;
  const isExpense = type === 'expense';
  const accent = isExpense ? brand.expense : brand.income;

  // Sliding toggle
  const slide = useSharedValue(isExpense ? 0 : 1);
  useEffect(() => { slide.value = withSpring(isExpense ? 0 : 1, { damping: 18, stiffness: 180 }); }, [isExpense]);
  const sliderStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slide.value * ((TOGGLE_W - 8) / 2) }],
    backgroundColor: slide.value < 0.5 ? brand.expense : brand.income,
  }));

  // Recording pulse
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = isRecording ? withRepeat(withTiming(1.25, { duration: 700 }), -1, true) : withTiming(1);
  }, [isRecording]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript;
    if (transcript) {
      const { amount: a, category: cat, description: d } = parseSpokenTransaction(transcript);
      setAmount(a); setCategory(cat); setDescription(d);
      Toast.show({ type: 'success', text1: 'Voice recognized', text2: 'Transaction details extracted!' });
    }
    setIsRecording(false); setIsProcessingVoice(false);
  });
  useSpeechRecognitionEvent('error', () => {
    setIsRecording(false); setIsProcessingVoice(false);
    Toast.show({ type: 'error', text1: 'Recognition failed', text2: 'Please try speaking again.' });
  });
  useSpeechRecognitionEvent('end', () => { setIsRecording(false); setIsProcessingVoice(false); });

  // Launched from a Home quick action
  useEffect(() => {
    if (!initialAction) return;
    const id = setTimeout(() => (initialAction === 'scan' ? handleScanReceipt() : toggleRecording()), 450);
    return () => clearTimeout(id);
  }, []);

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Toast.show({ type: 'error', text1: 'Invalid amount', text2: 'Please enter a valid number.' });
      return;
    }
    if (!category.trim()) {
      Toast.show({ type: 'error', text1: 'Pick a category', text2: 'Choose one below or type your own.' });
      return;
    }
    if (user?._id) {
      // Typed in the display currency; stored in the base currency
      const stored = toBaseAmount(Number(amount), currency, enableConversion ? exchangeRates : null);
      await addTransaction({ user: user._id, amount: stored, type, category: category.trim(), description, receiptUrl });
      Toast.show({ type: 'success', text1: 'Saved!', text2: `${isExpense ? 'Expense' : 'Income'} of ${currencySymbol}${amount} added.` });
      navigation.goBack();
    }
  };

  const processImageResult = async (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || !result.assets[0]?.base64) return;
    setIsScanning(true);
    try {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      const response = await api.post(`/scan-receipt`, { base64Image });
      const data = response.data;
      if (!data.success) throw new Error(data.message || 'Server error during receipt scan');

      const { receiptUrl: url, amount: a, category: cat, description: d } = data.data;
      if (url) setReceiptUrl(url);
      if (a) setAmount(String(a));
      if (cat) setCategory(cat);
      if (d) setDescription(d);
      setType('expense');
      Toast.show({ type: 'success', text1: 'Receipt scanned', text2: `Extracted: ${cat} — ${currencySymbol}${a}` });
    } catch (err: any) {
      Toast.show({
        type: 'error', text1: 'Scan failed',
        text2: err?.response?.data?.message || err.message || 'Could not read the receipt. Please try again.',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleScanReceipt = () => {
    Alert.alert('Scan receipt', 'Choose a source', [
      {
        text: 'Take Photo',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Toast.show({ type: 'error', text1: 'Permission denied', text2: 'Camera access is required.' });
            return;
          }
          processImageResult(await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.6, base64: true }));
        },
      },
      {
        text: 'Choose from Gallery',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Toast.show({ type: 'error', text1: 'Permission denied', text2: 'Gallery access is required.' });
            return;
          }
          processImageResult(await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.6, base64: true }));
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
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

  const bumpAmount = (n: number) => {
    const next = (Number(amount) || 0) + n;
    setAmount(String(Math.round(next * 100) / 100));
  };

  const switchType = (t: 'expense' | 'income') => {
    if (t === type) return;
    setType(t);
    if (category && !QUICK_CATEGORIES[t].includes(category)) setCategory('');
  };

  const isCustomCategory = !!category && !QUICK_CATEGORIES[type].includes(category);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <IconButton icon="close" onPress={() => navigation.goBack()} />
          <Text style={[styles.headerTitle, { color: c.text }]}>New transaction</Text>
          <View style={{ width: 42 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>
          {/* Type toggle */}
          <View style={[styles.toggle, { backgroundColor: c.surfaceAlt }]}>
            <Animated.View style={[styles.toggleSlider, sliderStyle]} />
            {(['expense', 'income'] as const).map(t => {
              const active = t === type;
              return (
                <PressableScale key={t} onPress={() => switchType(t)} style={styles.toggleBtn} scaleTo={0.97}>
                  <Ionicons name={t === 'expense' ? 'arrow-up' : 'arrow-down'} size={16} color={active ? '#FFF' : c.textSecondary} />
                  <Text style={[styles.toggleText, { color: active ? '#FFF' : c.textSecondary }]}>
                    {t === 'expense' ? 'Expense' : 'Income'}
                  </Text>
                </PressableScale>
              );
            })}
          </View>

          {/* Amount */}
          <View style={styles.amountBlock}>
            <Text style={[styles.amountLabel, { color: c.textSecondary }]}>How much?</Text>
            <View style={styles.amountRow}>
              <Text style={[styles.currency, { color: accent }]}>{currencySymbol}</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
                placeholderTextColor={c.textTertiary}
                keyboardType="decimal-pad"
                style={[styles.amountInput, { color: c.text }]}
                autoFocus={!initialAction}
                selectionColor={accent}
              />
            </View>
            <View style={styles.quickAmounts}>
              {QUICK_AMOUNTS.map(n => (
                <PressableScale key={n} onPress={() => bumpAmount(n)} style={[styles.quickAmt, { borderColor: c.border, backgroundColor: c.surface }]}>
                  <Text style={[styles.quickAmtText, { color: c.text }]}>+{currencySymbol}{n}</Text>
                </PressableScale>
              ))}
            </View>
          </View>

          {/* AI helpers */}
          <View style={styles.aiRow}>
            <PressableScale
              onPress={toggleRecording}
              disabled={isProcessingVoice || isScanning}
              style={[styles.aiBtn, { backgroundColor: isRecording ? c.expenseSoft : c.surface, borderColor: isRecording ? brand.expense : c.border }]}
            >
              <Animated.View style={[styles.aiIcon, { backgroundColor: isRecording ? brand.expense : 'rgba(122,90,248,0.14)' }, pulseStyle]}>
                {isProcessingVoice
                  ? <ActivityIndicator size="small" color="#7A5AF8" />
                  : <Ionicons name={isRecording ? 'stop' : 'mic'} size={18} color={isRecording ? '#FFF' : '#7A5AF8'} />}
              </Animated.View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.aiTitle, { color: isRecording ? brand.expense : c.text }]}>
                  {isRecording ? 'Listening…' : 'Say it'}
                </Text>
                <Text style={[styles.aiSub, { color: c.textSecondary }]} numberOfLines={1}>
                  {isRecording ? 'Tap to stop' : '"$12 on lunch"'}
                </Text>
              </View>
            </PressableScale>

            <PressableScale
              onPress={handleScanReceipt}
              disabled={isScanning || isProcessingVoice}
              style={[styles.aiBtn, { backgroundColor: c.surface, borderColor: receiptUrl ? brand.income : c.border }]}
            >
              <View style={[styles.aiIcon, { backgroundColor: 'rgba(46,144,250,0.14)' }]}>
                {isScanning
                  ? <ActivityIndicator size="small" color="#2E90FA" />
                  : <Ionicons name={receiptUrl ? 'checkmark' : 'scan'} size={18} color={receiptUrl ? brand.income : '#2E90FA'} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.aiTitle, { color: c.text }]}>{isScanning ? 'Reading…' : receiptUrl ? 'Attached' : 'Scan bill'}</Text>
                <Text style={[styles.aiSub, { color: c.textSecondary }]} numberOfLines={1}>AI auto-fill</Text>
              </View>
            </PressableScale>
          </View>

          {/* Categories */}
          <Text style={[styles.sectionLabel, { color: c.text }]}>Category</Text>
          <View style={styles.grid}>
            {QUICK_CATEGORIES[type].map(cat => {
              const meta = categoryMeta(cat);
              const active = category === cat;
              return (
                <PressableScale
                  key={cat}
                  onPress={() => setCategory(cat)}
                  scaleTo={0.92}
                  style={[
                    styles.tile,
                    { backgroundColor: active ? meta.color + '14' : c.surface, borderColor: active ? meta.color : c.border },
                  ]}
                >
                  <View style={[styles.tileIcon, { backgroundColor: active ? meta.color : meta.color + '1A' }]}>
                    <Ionicons name={meta.icon} size={20} color={active ? '#FFF' : meta.color} />
                  </View>
                  <Text style={[styles.tileText, { color: active ? c.text : c.textSecondary }]} numberOfLines={1}>{cat}</Text>
                  {active && (
                    <Animated.View entering={FadeIn.duration(150)} style={[styles.tileCheck, { backgroundColor: meta.color, borderColor: c.bg }]}>
                      <Ionicons name="checkmark" size={10} color="#FFF" />
                    </Animated.View>
                  )}
                </PressableScale>
              );
            })}
          </View>

          {/* Details */}
          <View style={[styles.fields, { backgroundColor: c.surface }, shadow(c, 1)]}>
            <View style={styles.field}>
              <Ionicons name="pricetag-outline" size={18} color={isCustomCategory ? brand.primary : c.textTertiary} />
              <TextInput
                value={isCustomCategory ? category : ''}
                onChangeText={setCategory}
                placeholder="Or type a custom category"
                placeholderTextColor={c.textTertiary}
                style={[styles.fieldInput, { color: c.text }]}
              />
            </View>
            <View style={[styles.fieldDivider, { backgroundColor: c.divider }]} />
            <View style={styles.field}>
              <Ionicons name="create-outline" size={18} color={c.textTertiary} />
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Add a note (optional)"
                placeholderTextColor={c.textTertiary}
                style={[styles.fieldInput, { color: c.text }]}
                multiline
              />
            </View>
          </View>
        </ScrollView>

        {/* Sticky checkout-style bar */}
        <View style={[styles.bottomBar, { backgroundColor: c.surface, borderTopColor: c.border, paddingBottom: Math.max(insets.bottom, 14) }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.barMeta, { color: c.textSecondary }]} numberOfLines={1}>
              {isExpense ? 'Expense' : 'Income'}{category ? ` · ${category}` : ''}
            </Text>
            <Text style={[styles.barAmount, { color: c.text }]} numberOfLines={1}>
              {currencySymbol}{amount || '0'}
            </Text>
          </View>
          <PrimaryButton
            title="Save"
            icon="checkmark"
            onPress={handleSave}
            loading={isLoading}
            colors={isExpense ? [brand.primary, brand.expense] : [brand.income, '#0E9384']}
            style={{ minWidth: 150 }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  headerTitle: { fontSize: 17, fontWeight: '800' },

  toggle: { flexDirection: 'row', marginHorizontal: 20, borderRadius: 16, padding: 4 },
  toggleSlider: { position: 'absolute', top: 4, bottom: 4, left: 4, width: (TOGGLE_W - 8) / 2, borderRadius: 12 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  toggleText: { fontSize: 15, fontWeight: '800' },

  amountBlock: { alignItems: 'center', paddingTop: 26, paddingBottom: 8 },
  amountLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  amountRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  currency: { fontSize: 36, fontWeight: '800', marginRight: 4 },
  amountInput: { fontSize: 58, fontWeight: '900', letterSpacing: -2, minWidth: 80, textAlign: 'center', paddingVertical: 0 },
  quickAmounts: { flexDirection: 'row', gap: 8, marginTop: 14 },
  quickAmt: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1 },
  quickAmtText: { fontSize: 13, fontWeight: '800' },

  aiRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 22 },
  aiBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16, borderWidth: 1 },
  aiIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  aiTitle: { fontSize: 14.5, fontWeight: '800' },
  aiSub: { fontSize: 12, fontWeight: '500', marginTop: 1 },

  sectionLabel: { fontSize: 16, fontWeight: '900', paddingHorizontal: 20, marginTop: 26, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20 },
  tile: { width: TILE_W, alignItems: 'center', paddingVertical: 12, borderRadius: 16, borderWidth: 1.5, gap: 7 },
  tileIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  tileText: { fontSize: 11.5, fontWeight: '700', paddingHorizontal: 2 },
  tileCheck: { position: 'absolute', top: -5, right: -5, width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },

  fields: { marginHorizontal: 20, marginTop: 16, borderRadius: radius.lg },
  field: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, minHeight: 54 },
  fieldInput: { flex: 1, fontSize: 15, fontWeight: '600', paddingVertical: 14 },
  fieldDivider: { height: StyleSheet.hairlineWidth, marginLeft: 46 },

  bottomBar: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth },
  barMeta: { fontSize: 12.5, fontWeight: '700' },
  barAmount: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5, marginTop: 1 },
});
