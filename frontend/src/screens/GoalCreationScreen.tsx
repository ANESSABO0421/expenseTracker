import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Image, StyleSheet, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInRight, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { useStore, GoalPlan } from '../store/useStore';
import { api } from '../utils/api';
import { formatCurrency, toBaseAmount } from '../utils/formatCurrency';
import { useTheme, brand, radius, shadow, CURRENCY_SYMBOLS } from '../theme';
import { IconButton, PressableScale, PrimaryButton } from '../components/ui';

const { width } = Dimensions.get('window');
const TILE_W = (width - 40 - 20) / 3;
const GOAL_GRADIENT = [brand.gold, brand.emerald] as const;

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
  { label: '3 months', months: 3, icon: 'flash' as const },
  { label: '6 months', months: 6, icon: 'walk' as const },
  { label: '1 year', months: 12, icon: 'calendar' as const },
  { label: '2 years', months: 24, icon: 'hourglass' as const },
  { label: 'No deadline', months: null as number | null, icon: 'infinite' as const },
];

const TOTAL_STEPS = 5;
const STEP_TITLES = ['', 'What are you\nsaving for?', 'Make it real', 'How much do\nyou need?', 'By when?', 'Your plan'];

export default function GoalCreationScreen({ navigation }: any) {
  const { user, currency, exchangeRates, enableConversion, getGoalPlan, createGoal, transactions } = useStore();
  const { c, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const rates = enableConversion ? exchangeRates : null;

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

  const progress = useSharedValue(1 / TOTAL_STEPS);
  useEffect(() => { progress.value = withTiming(step / TOTAL_STEPS, { duration: 350 }); }, [step]);
  const progressStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  const deadlineDate = (months = deadlineMonths): string | null => {
    if (!months) return null;
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d.toISOString();
  };

  // Target is typed in the display currency; the goal is stored in the base currency
  const targetBase = toBaseAmount(Number(targetAmount) || 0, currency, rates);

  const avgMonthlySaving = (() => {
    if (!transactions?.length) return 0;
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const months = Math.max(1, transactions.length / 15);
    return Math.max(0, Math.round((income - expense) / months));
  })();

  const goNext = () => setStep(s => Math.min(TOTAL_STEPS, s + 1));
  const goBack = () => {
    if (step === 1) { navigation.goBack(); return; }
    setStep(s => s - 1);
  };

  const selectCategory = (opt: typeof CATEGORY_OPTIONS[0]) => {
    setCategory(opt);
    setTitle(opt.key !== 'custom' ? opt.label : '');
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
      const response = await api.post(`/upload`, { base64Image });
      setImageUrl(response.data.data.receiptUrl);
    } catch {
      Toast.show({ type: 'error', text1: 'Upload failed', text2: 'Using the default look instead.' });
      setImageUri(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const generatePlan = async () => {
    setIsGeneratingPlan(true);
    const result = await getGoalPlan({ title, targetAmount: targetBase, deadline: deadlineDate(), avgMonthlySaving });
    setPlan(result);
    setIsGeneratingPlan(false);
  };

  const handleNameNext = () => (title.trim() ? goNext() : Toast.show({ type: 'error', text1: 'Name your goal' }));

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
      targetAmount: targetBase,
      deadline: deadlineDate(),
      requiredMonthly: plan.requiredMonthly,
      requiredWeekly: plan.requiredWeekly,
      requiredDaily: plan.requiredDaily,
      projectedCompletionDate: plan.projectedCompletionDate,
    } as any);
    setIsCreating(false);
    if (goal) navigation.replace('GoalDetail', { goalId: goal._id });
  };

  const cta: Record<number, { title: string; onPress: () => void; loading?: boolean; disabled?: boolean } | null> = {
    1: null,
    2: { title: 'Continue', onPress: handleNameNext, disabled: isUploadingImage },
    3: { title: 'Continue', onPress: handleAmountNext },
    4: { title: 'Generate my plan', onPress: handleDeadlineNext },
    5: { title: "I'm in", onPress: handleCommit, loading: isCreating, disabled: isGeneratingPlan || !plan },
  };
  const current = cta[step];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Header + progress */}
        <View style={styles.header}>
          <IconButton icon={step === 1 ? 'close' : 'chevron-back'} onPress={goBack} />
          <View style={{ flex: 1, marginHorizontal: 16 }}>
            <View style={[styles.progressTrack, { backgroundColor: c.surfaceAlt }]}>
              <Animated.View style={[styles.progressFill, progressStyle]}>
                <LinearGradient colors={GOAL_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
              </Animated.View>
            </View>
          </View>
          <Text style={[styles.stepCount, { color: c.textSecondary }]}>{step}/{TOTAL_STEPS}</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Animated.View key={step} entering={FadeInRight.duration(280)}>
            <Text style={styles.eyebrow}>STEP {step} OF {TOTAL_STEPS}</Text>
            <Text style={[styles.title, { color: c.text }]}>{STEP_TITLES[step]}</Text>

            {/* Step 1 — category */}
            {step === 1 && (
              <View style={styles.grid}>
                {CATEGORY_OPTIONS.map(opt => (
                  <PressableScale key={opt.key} onPress={() => selectCategory(opt)} scaleTo={0.93}
                    style={[styles.tile, { backgroundColor: c.surface, borderColor: category?.key === opt.key ? brand.gold : c.border }, shadow(c, 1)]}>
                    <View style={[styles.tileEmoji, { backgroundColor: c.surfaceAlt }]}>
                      <Text style={{ fontSize: 28 }}>{opt.emoji}</Text>
                    </View>
                    <Text style={[styles.tileLabel, { color: c.text }]} numberOfLines={1}>{opt.label}</Text>
                  </PressableScale>
                ))}
              </View>
            )}

            {/* Step 2 — name + image */}
            {step === 2 && (
              <View>
                <Text style={[styles.sub, { color: c.textSecondary }]}>Give it a name, and a picture to look at every day.</Text>
                <View style={[styles.inputWrap, { backgroundColor: c.surface, borderColor: c.border }]}>
                  <Text style={{ fontSize: 22 }}>{category?.emoji || '🎯'}</Text>
                  <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder='e.g. MacBook Pro 14"'
                    placeholderTextColor={c.textTertiary}
                    style={[styles.input, { color: c.text }]}
                    selectionColor={brand.gold}
                    autoFocus
                  />
                </View>

                <PressableScale onPress={() => pickImage(false)} disabled={isUploadingImage} scaleTo={0.98}
                  style={[styles.photo, { backgroundColor: c.surface, borderColor: c.border }]}>
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} />
                  ) : (
                    <LinearGradient colors={isDark ? ['#2A2418', '#16171D'] : ['#FFF6EA', '#FFFFFF']} style={[StyleSheet.absoluteFill, styles.center]}>
                      <View style={[styles.photoIcon, { backgroundColor: 'rgba(212,178,106,0.18)' }]}>
                        <Ionicons name="image" size={26} color={brand.gold} />
                      </View>
                      <Text style={[styles.photoHint, { color: c.textSecondary }]}>Tap to add a cover photo</Text>
                    </LinearGradient>
                  )}
                  {(imageUri || isUploadingImage) && (
                    <View style={styles.photoBar}>
                      {isUploadingImage ? <ActivityIndicator color="#FFF" /> : (
                        <>
                          <Ionicons name="camera" size={15} color="#FFF" />
                          <Text style={styles.photoBarText}>Change photo</Text>
                        </>
                      )}
                    </View>
                  )}
                </PressableScale>

                <PressableScale onPress={() => pickImage(true)} style={styles.cameraLink}>
                  <Ionicons name="camera-outline" size={16} color={brand.primary} />
                  <Text style={styles.cameraLinkText}>Take a photo instead</Text>
                </PressableScale>
              </View>
            )}

            {/* Step 3 — target amount */}
            {step === 3 && (
              <View>
                <View style={[styles.amountCard, { backgroundColor: c.surface }, shadow(c, 1)]}>
                  <Text style={[styles.amountSymbol, { color: brand.gold }]}>{CURRENCY_SYMBOLS[currency] || currency}</Text>
                  <TextInput
                    value={targetAmount}
                    onChangeText={setTargetAmount}
                    placeholder="0"
                    placeholderTextColor={c.textTertiary}
                    keyboardType="decimal-pad"
                    autoFocus
                    selectionColor={brand.gold}
                    style={[styles.amountInput, { color: c.text }]}
                  />
                </View>
                {avgMonthlySaving > 0 && (
                  <View style={[styles.hint, { backgroundColor: c.incomeSoft }]}>
                    <Ionicons name="trending-up" size={16} color={brand.income} />
                    <Text style={[styles.hintText, { color: c.text }]}>
                      You save about <Text style={{ fontWeight: '900' }}>{formatCurrency(avgMonthlySaving, currency, rates)}/mo</Text> on average.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Step 4 — deadline */}
            {step === 4 && (
              <View style={{ gap: 10, marginTop: 20 }}>
                {DEADLINE_PRESETS.map(p => {
                  const selected = deadlineMonths === p.months;
                  const d = deadlineDate(p.months);
                  const perMonth = p.months && Number(targetAmount) ? Number(targetAmount) / p.months : null;
                  return (
                    <PressableScale key={p.label} onPress={() => setDeadlineMonths(p.months)} scaleTo={0.98}
                      style={[styles.option, { backgroundColor: selected ? 'rgba(212,178,106,0.12)' : c.surface, borderColor: selected ? brand.gold : c.border }]}>
                      <View style={[styles.optionIcon, { backgroundColor: selected ? brand.gold : c.surfaceAlt }]}>
                        <Ionicons name={p.icon} size={18} color={selected ? '#FFF' : c.textSecondary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.optionTitle, { color: c.text }]}>{p.label}</Text>
                        <Text style={[styles.optionSub, { color: c.textSecondary }]}>
                          {d ? `By ${new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : 'Save at your own pace'}
                          {perMonth ? ` · ~${formatCurrency(perMonth, currency, null)}/mo` : ''}
                        </Text>
                      </View>
                      <View style={[styles.radio, { borderColor: selected ? brand.gold : c.border }]}>
                        {selected && <View style={styles.radioDot} />}
                      </View>
                    </PressableScale>
                  );
                })}
              </View>
            )}

            {/* Step 5 — AI plan */}
            {step === 5 && (
              isGeneratingPlan || !plan ? (
                <View style={styles.thinking}>
                  <ActivityIndicator size="large" color={brand.gold} />
                  <Text style={[styles.thinkingText, { color: c.textSecondary }]}>Crafting your plan…</Text>
                </View>
              ) : (
                <View style={{ marginTop: 20 }}>
                  <LinearGradient colors={GOAL_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.planHero}>
                    <View style={styles.planBlob} />
                    <Text style={styles.planEmoji}>{category?.emoji || '🎯'}</Text>
                    <Text style={styles.planTitle} numberOfLines={1}>{title}</Text>
                    <Text style={styles.planTarget}>{formatCurrency(Number(targetAmount), currency, null)}</Text>
                    <Text style={styles.planQuote}>“{plan.motivationalLine}”</Text>
                  </LinearGradient>

                  <View style={styles.planStats}>
                    {[
                      { value: plan.requiredMonthly, label: 'Monthly' },
                      { value: plan.requiredWeekly, label: 'Weekly' },
                      { value: plan.requiredDaily, label: 'Daily' },
                    ].map(({ value, label }) => (
                      <View key={label} style={[styles.planStat, { backgroundColor: c.surface }, shadow(c, 1)]}>
                        <Text style={[styles.planStatValue, { color: c.text }]} numberOfLines={1} adjustsFontSizeToFit>
                          {formatCurrency(value, currency, rates)}
                        </Text>
                        <Text style={[styles.planStatLabel, { color: c.textSecondary }]}>{label.toUpperCase()}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={[styles.hint, { backgroundColor: c.surfaceAlt, marginTop: 14 }]}>
                    <Ionicons name="flag" size={15} color={brand.gold} />
                    <Text style={[styles.hintText, { color: c.text }]}>
                      Projected finish{' '}
                      <Text style={{ fontWeight: '900' }}>
                        {new Date(plan.projectedCompletionDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </Text>
                    </Text>
                  </View>
                </View>
              )
            )}
          </Animated.View>
        </ScrollView>

        {current && (
          <View style={[styles.bottomBar, { backgroundColor: c.bg, paddingBottom: Math.max(insets.bottom, 16) }]}>
            <PrimaryButton
              title={current.title}
              onPress={current.onPress}
              loading={current.loading}
              disabled={current.disabled}
              colors={GOAL_GRADIENT}
              trailing={step < 5 ? <Ionicons name="arrow-forward" size={18} color="#FFF" /> : undefined}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 6 },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4, overflow: 'hidden' },
  stepCount: { fontSize: 13, fontWeight: '800', minWidth: 28, textAlign: 'right' },

  eyebrow: { color: brand.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1.3, marginBottom: 8, marginTop: 8 },
  title: { fontSize: 31, fontWeight: '900', lineHeight: 37, letterSpacing: -0.8 },
  sub: { fontSize: 14.5, lineHeight: 21, marginTop: 8 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 22 },
  tile: { width: TILE_W, alignItems: 'center', paddingVertical: 16, borderRadius: 18, borderWidth: 1.5, gap: 10 },
  tileEmoji: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { fontSize: 12.5, fontWeight: '800', paddingHorizontal: 4 },

  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 16, marginTop: 20 },
  input: { flex: 1, fontSize: 17, fontWeight: '700', paddingVertical: 16 },
  photo: { height: 180, borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginTop: 14 },
  photoIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  photoHint: { fontSize: 13.5, fontWeight: '700', marginTop: 10 },
  photoBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, backgroundColor: 'rgba(0,0,0,0.45)' },
  photoBarText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  cameraLink: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', marginTop: 14, padding: 6 },
  cameraLinkText: { color: brand.primary, fontSize: 14, fontWeight: '800' },

  amountCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 22, paddingVertical: 30, marginTop: 22 },
  amountSymbol: { fontSize: 34, fontWeight: '800' },
  amountInput: { fontSize: 48, fontWeight: '900', minWidth: 100, letterSpacing: -1.5, paddingVertical: 0 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: radius.md, padding: 14, marginTop: 14 },
  hintText: { flex: 1, fontSize: 13.5, lineHeight: 19 },

  option: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 18, borderWidth: 1.5 },
  optionIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  optionTitle: { fontSize: 16, fontWeight: '800' },
  optionSub: { fontSize: 12.5, fontWeight: '500', marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: brand.gold },

  thinking: { paddingVertical: 70, alignItems: 'center' },
  thinkingText: { marginTop: 14, fontSize: 14, fontWeight: '600' },
  planHero: { borderRadius: 24, padding: 22, overflow: 'hidden' },
  planBlob: { position: 'absolute', width: 180, height: 180, borderRadius: 90, top: -70, right: -50, backgroundColor: 'rgba(255,255,255,0.15)' },
  planEmoji: { fontSize: 36 },
  planTitle: { color: '#FFF', fontSize: 22, fontWeight: '900', marginTop: 8, letterSpacing: -0.4 },
  planTarget: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: '800', marginTop: 2 },
  planQuote: { color: '#FFF', fontSize: 15, fontStyle: 'italic', fontWeight: '600', lineHeight: 22, marginTop: 14 },
  planStats: { flexDirection: 'row', gap: 10, marginTop: 14 },
  planStat: { flex: 1, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 8, alignItems: 'center' },
  planStatValue: { fontSize: 16, fontWeight: '900' },
  planStatLabel: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.6, marginTop: 4 },

  bottomBar: { paddingHorizontal: 20, paddingTop: 10 },
});
