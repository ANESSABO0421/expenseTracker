import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { useStore, API_URL, GoalPlan } from '../store/useStore';
import { formatCurrency } from '../utils/formatCurrency';

const GOLD = '#D4B26A';
const EMERALD = '#48C79A';

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥', CAD: 'CA$', AUD: 'A$',
};

const CATEGORY_OPTIONS: { key: string; label: string; emoji: string; category: string }[] = [
  { key: 'macbook', label: 'MacBook', emoji: '💻', category: 'tech' },
  { key: 'phone', label: 'Phone', emoji: '📱', category: 'tech' },
  { key: 'car', label: 'Car', emoji: '🚗', category: 'vehicle' },
  { key: 'home', label: 'Home', emoji: '🏠', category: 'home' },
  { key: 'travel', label: 'Travel', emoji: '✈️', category: 'travel' },
  { key: 'education', label: 'Education', emoji: '🎓', category: 'education' },
  { key: 'wedding', label: 'Wedding', emoji: '❤️', category: 'wedding' },
  { key: 'gaming', label: 'Gaming Setup', emoji: '🎮', category: 'gaming' },
  { key: 'custom', label: 'Custom Goal', emoji: '🎯', category: 'custom' },
];

const DEADLINE_PRESETS = [
  { label: '3 months', months: 3 },
  { label: '6 months', months: 6 },
  { label: '1 year', months: 12 },
  { label: '2 years', months: 24 },
  { label: 'No deadline', months: null as number | null },
];

const TOTAL_STEPS = 5;

export default function GoalCreationScreen({ navigation }: any) {
  const { user, currency, exchangeRates, enableConversion, getGoalPlan, createGoal, transactions } = useStore();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<typeof CATEGORY_OPTIONS[0] | null>(null);
  const [title, setTitle] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [targetAmount, setTargetAmount] = useState('');
  const [deadlineMonths, setDeadlineMonths] = useState<number | null | undefined>(undefined);
  const [plan, setPlan] = useState<GoalPlan | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const bg = isDark ? '#0C0E14' : '#F6F1E7';
  const cardBg = isDark ? '#161923' : '#FFFFFF';
  const surface2 = isDark ? '#1B2032' : '#FBF7EE';
  const textPrimary = isDark ? '#EDEAE1' : '#211C13';
  const textSecondary = isDark ? '#9A98A6' : '#726A57';
  const separator = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(30,24,12,0.1)';

  const deadlineDate = (): string | null => {
    if (!deadlineMonths) return null;
    const d = new Date();
    d.setMonth(d.getMonth() + deadlineMonths);
    return d.toISOString();
  };

  const avgMonthlySaving = (() => {
    // Rough estimate from the user's own history: trailing income - expense, monthly.
    if (!transactions?.length) return 0;
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const months = Math.max(1, transactions.length / 15); // rough spread estimate
    return Math.max(0, Math.round((income - expense) / months));
  })();

  const goNext = () => setStep(s => Math.min(TOTAL_STEPS, s + 1));
  const goBack = () => {
    if (step === 1) { navigation.goBack(); return; }
    setStep(s => s - 1);
  };

  const selectCategory = (opt: typeof CATEGORY_OPTIONS[0]) => {
    setCategory(opt);
    if (opt.key !== 'custom') setTitle(opt.label);
    else setTitle('');
    goNext();
  };

  const pickImage = async (fromCamera: boolean) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      Toast.show({ type: 'error', text1: 'Permission needed', text2: 'Allow access to add a photo.' });
      return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7, base64: true, aspect: [4, 3] })
      : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.7, base64: true, aspect: [4, 3] });

    if (result.canceled || !result.assets[0]?.base64) return;

    setImageUri(result.assets[0].uri);
    setIsUploadingImage(true);
    try {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      const response = await axios.post(`${API_URL}/upload`, { base64Image });
      setImageUrl(response.data.data.receiptUrl);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Upload failed', text2: 'Using the default look instead.' });
      setImageUri(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const generatePlan = async () => {
    setIsGeneratingPlan(true);
    const result = await getGoalPlan({
      title,
      targetAmount: Number(targetAmount),
      deadline: deadlineDate(),
      avgMonthlySaving,
    });
    setPlan(result);
    setIsGeneratingPlan(false);
  };

  const handleAmountNext = () => {
    const amt = Number(targetAmount);
    if (!amt || amt <= 0) {
      Toast.show({ type: 'error', text1: 'Enter a target amount', text2: 'How much are you saving toward this?' });
      return;
    }
    goNext();
  };

  const handleDeadlineNext = () => {
    if (deadlineMonths === undefined) {
      Toast.show({ type: 'error', text1: 'Pick a timeframe', text2: 'Even "No deadline" is a valid choice.' });
      return;
    }
    goNext();
    generatePlan();
  };

  const handleCommit = async () => {
    if (!user?._id || !plan) return;
    setIsCreating(true);
    const goal = await createGoal({
      user: user._id,
      title,
      category: (category?.category || 'custom') as any,
      emoji: category?.emoji || '🎯',
      imageUrl: imageUrl || undefined,
      targetAmount: Number(targetAmount),
      deadline: deadlineDate(),
      requiredMonthly: plan.requiredMonthly,
      requiredWeekly: plan.requiredWeekly,
      requiredDaily: plan.requiredDaily,
      projectedCompletionDate: plan.projectedCompletionDate,
    } as any);
    setIsCreating(false);
    if (goal) {
      navigation.replace('GoalDetail', { goalId: goal._id });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={[styles.headerBtn, { backgroundColor: cardBg }]}>
            <Ionicons name={step === 1 ? 'close' : 'chevron-back'} size={20} color={textPrimary} />
          </TouchableOpacity>
          <View style={styles.dotsRow}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.stepDot,
                  { backgroundColor: i < step ? GOLD : separator, width: i === step - 1 ? 20 : 6 },
                ]}
              />
            ))}
          </View>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

          {/* STEP 1 — category */}
          {step === 1 && (
            <View>
              <Text style={[styles.eyebrow, { color: GOLD }]}>Step 1 of {TOTAL_STEPS}</Text>
              <Text style={[styles.stepTitle, { color: textPrimary }]}>What are you{'\n'}saving for?</Text>
              <View style={{ marginTop: 24, gap: 10 }}>
                {CATEGORY_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => selectCategory(opt)}
                    style={[styles.categoryCard, { backgroundColor: cardBg, borderColor: separator }]}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 24 }}>{opt.emoji}</Text>
                    <Text style={[styles.categoryLabel, { color: textPrimary }]}>{opt.label}</Text>
                    <Ionicons name="chevron-forward" size={16} color={textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* STEP 2 — name + image */}
          {step === 2 && (
            <View>
              <Text style={[styles.eyebrow, { color: GOLD }]}>Step 2 of {TOTAL_STEPS}</Text>
              <Text style={[styles.stepTitle, { color: textPrimary }]}>Make it real</Text>
              <Text style={[styles.stepSub, { color: textSecondary }]}>Give it a name, and a picture to look at every day.</Text>

              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. MacBook Pro 14&quot;"
                placeholderTextColor={textSecondary}
                style={[styles.textInput, { backgroundColor: cardBg, color: textPrimary, borderColor: separator }]}
              />

              <TouchableOpacity
                onPress={() => pickImage(false)}
                disabled={isUploadingImage}
                style={[styles.imagePicker, { backgroundColor: cardBg, borderColor: separator }]}
                activeOpacity={0.85}
              >
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                ) : (
                  <LinearGradient colors={[surface2, cardBg]} style={styles.imagePlaceholder}>
                    <Text style={{ fontSize: 34 }}>{category?.emoji || '🎯'}</Text>
                  </LinearGradient>
                )}
                <View style={styles.imagePickerOverlay}>
                  {isUploadingImage ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="camera" size={16} color="#FFF" />
                      <Text style={styles.imagePickerText}>{imageUri ? 'Change photo' : 'Add a photo'}</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => pickImage(true)} style={{ alignSelf: 'center', marginTop: 10 }}>
                <Text style={{ color: textSecondary, fontSize: 13, fontWeight: '600' }}>or take a photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => title.trim() ? goNext() : Toast.show({ type: 'error', text1: 'Name your goal' })}
                style={styles.primaryBtnWrap}
              >
                <LinearGradient colors={[GOLD, EMERALD]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>Continue</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3 — target amount */}
          {step === 3 && (
            <View>
              <Text style={[styles.eyebrow, { color: GOLD }]}>Step 3 of {TOTAL_STEPS}</Text>
              <Text style={[styles.stepTitle, { color: textPrimary }]}>How much do{'\n'}you need?</Text>
              <View style={[styles.amountCard, { backgroundColor: cardBg, borderColor: separator }]}>
                <Text style={{ fontSize: 32, fontWeight: '700', color: GOLD }}>
                  {CURRENCY_SYMBOLS[currency] || currency}
                </Text>
                <TextInput
                  value={targetAmount}
                  onChangeText={setTargetAmount}
                  placeholder="0"
                  placeholderTextColor={textSecondary}
                  keyboardType="decimal-pad"
                  style={[styles.amountInput, { color: textPrimary }]}
                  autoFocus
                />
              </View>
              {avgMonthlySaving > 0 && (
                <Text style={[styles.hint, { color: textSecondary }]}>
                  ≈ {formatCurrency(avgMonthlySaving, currency, enableConversion ? exchangeRates : null)}/mo is your average recent saving rate.
                </Text>
              )}
              <TouchableOpacity onPress={handleAmountNext} style={styles.primaryBtnWrap}>
                <LinearGradient colors={[GOLD, EMERALD]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>Continue</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 4 — deadline */}
          {step === 4 && (
            <View>
              <Text style={[styles.eyebrow, { color: GOLD }]}>Step 4 of {TOTAL_STEPS}</Text>
              <Text style={[styles.stepTitle, { color: textPrimary }]}>By when?</Text>
              <View style={{ marginTop: 20, gap: 10 }}>
                {DEADLINE_PRESETS.map(p => (
                  <TouchableOpacity
                    key={p.label}
                    onPress={() => setDeadlineMonths(p.months)}
                    style={[
                      styles.deadlineOption,
                      {
                        backgroundColor: deadlineMonths === p.months ? 'rgba(212,178,106,0.12)' : cardBg,
                        borderColor: deadlineMonths === p.months ? GOLD : separator,
                      },
                    ]}
                  >
                    <Text style={[styles.categoryLabel, { color: textPrimary }]}>{p.label}</Text>
                    {deadlineMonths === p.months && <Ionicons name="checkmark-circle" size={20} color={GOLD} />}
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity onPress={handleDeadlineNext} style={styles.primaryBtnWrap}>
                <LinearGradient colors={[GOLD, EMERALD]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>Generate my plan</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 5 — AI plan */}
          {step === 5 && (
            <View>
              <Text style={[styles.eyebrow, { color: GOLD }]}>Step 5 of {TOTAL_STEPS}</Text>
              <Text style={[styles.stepTitle, { color: textPrimary }]}>Your plan</Text>

              {isGeneratingPlan || !plan ? (
                <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={GOLD} />
                  <Text style={{ color: textSecondary, marginTop: 12, fontSize: 13 }}>Thinking this through...</Text>
                </View>
              ) : (
                <>
                  <View style={[styles.planQuoteCard, { backgroundColor: cardBg, borderColor: separator }]}>
                    <Text style={[styles.planQuote, { color: GOLD }]}>"{plan.motivationalLine}"</Text>
                  </View>
                  <View style={styles.planStatsRow}>
                    <View style={[styles.planStat, { backgroundColor: cardBg, borderColor: separator }]}>
                      <Text style={[styles.planStatValue, { color: textPrimary }]}>
                        {formatCurrency(plan.requiredMonthly, currency, enableConversion ? exchangeRates : null)}
                      </Text>
                      <Text style={[styles.planStatLabel, { color: textSecondary }]}>Monthly</Text>
                    </View>
                    <View style={[styles.planStat, { backgroundColor: cardBg, borderColor: separator }]}>
                      <Text style={[styles.planStatValue, { color: textPrimary }]}>
                        {formatCurrency(plan.requiredWeekly, currency, enableConversion ? exchangeRates : null)}
                      </Text>
                      <Text style={[styles.planStatLabel, { color: textSecondary }]}>Weekly</Text>
                    </View>
                    <View style={[styles.planStat, { backgroundColor: cardBg, borderColor: separator }]}>
                      <Text style={[styles.planStatValue, { color: textPrimary }]}>
                        {formatCurrency(plan.requiredDaily, currency, enableConversion ? exchangeRates : null)}
                      </Text>
                      <Text style={[styles.planStatLabel, { color: textSecondary }]}>Daily</Text>
                    </View>
                  </View>
                  <Text style={[styles.hint, { color: textSecondary, textAlign: 'center' }]}>
                    Projected completion: {new Date(plan.projectedCompletionDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </Text>

                  <TouchableOpacity onPress={handleCommit} disabled={isCreating} style={styles.primaryBtnWrap}>
                    <LinearGradient colors={[GOLD, EMERALD]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtn}>
                      {isCreating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>I'm in</Text>}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  headerBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dotsRow: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  stepDot: { height: 6, borderRadius: 3 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 },
  stepTitle: { fontSize: 30, fontWeight: '700', letterSpacing: -0.5, lineHeight: 36 },
  stepSub: { fontSize: 14, marginTop: 8, lineHeight: 20 },

  categoryCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, borderWidth: 1 },
  categoryLabel: { flex: 1, fontSize: 16, fontWeight: '600' },

  textInput: { marginTop: 20, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontWeight: '600' },

  imagePicker: { marginTop: 16, height: 160, borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  imagePreview: { width: '100%', height: '100%' },
  imagePlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  imagePickerOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, backgroundColor: 'rgba(0,0,0,0.45)' },
  imagePickerText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  amountCard: { marginTop: 20, borderWidth: 1, borderRadius: 18, padding: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  amountInput: { fontSize: 40, fontWeight: '700', minWidth: 100 },
  hint: { fontSize: 12.5, marginTop: 10 },

  deadlineOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 1 },

  planQuoteCard: { marginTop: 20, borderWidth: 1, borderRadius: 18, padding: 20 },
  planQuote: { fontSize: 17, fontStyle: 'italic', fontWeight: '600', lineHeight: 24, textAlign: 'center' },
  planStatsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  planStat: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  planStatValue: { fontSize: 15, fontWeight: '800' },
  planStatLabel: { fontSize: 10.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 },

  primaryBtnWrap: { marginTop: 26 },
  primaryBtn: { borderRadius: 16, paddingVertical: 17, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
