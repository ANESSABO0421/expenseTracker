import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { useStore, GoalPlan } from '../store/useStore';
import { api } from '../utils/api';
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

  const deadlineDate = (): string | null => {
    if (!deadlineMonths) return null;
    const d = new Date();
    d.setMonth(d.getMonth() + deadlineMonths);
    return d.toISOString();
  };

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
      const response = await api.post(`/upload`, { base64Image });
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

  // Separator color for step dots (needs to be inline since it's a computed rgba)
  const separatorColor = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(30,24,12,0.1)';

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? 'bg-bgDark' : 'bg-bgLight'}`}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">

        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-2 pb-1">
          <TouchableOpacity
            onPress={goBack}
            className={`w-9 h-9 rounded-full items-center justify-center ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}
          >
            <Ionicons
              name={step === 1 ? 'close' : 'chevron-back'}
              size={20}
              color={isDark ? '#EDEAE1' : '#211C13'}
            />
          </TouchableOpacity>

          {/* Step dots */}
          <View className="flex-row items-center gap-[5px]">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View
                key={i}
                style={{
                  height: 6,
                  width: i === step - 1 ? 20 : 6,
                  borderRadius: 3,
                  backgroundColor: i < step ? GOLD : separatorColor,
                }}
              />
            ))}
          </View>

          <View className="w-9" />
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >

          {/* ── STEP 1 — category ── */}
          {step === 1 && (
            <View>
              <Text className="text-[11px] font-extrabold tracking-[1.2px] uppercase mb-2" style={{ color: GOLD }}>
                Step 1 of {TOTAL_STEPS}
              </Text>
              <Text
                className={`text-[30px] font-bold leading-[36px] tracking-tight ${isDark ? 'text-textDark' : 'text-textLight'}`}
              >
                What are you{'\n'}saving for?
              </Text>

              <View className="mt-6 gap-[10px]">
                {CATEGORY_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => selectCategory(opt)}
                    activeOpacity={0.8}
                    className={`flex-row items-center gap-[14px] p-4 rounded-2xl border ${
                      isDark
                        ? 'bg-cardDark border-white/[0.09]'
                        : 'bg-cardLight border-black/[0.1]'
                    }`}
                  >
                    <Text className="text-2xl">{opt.emoji}</Text>
                    <Text
                      className={`flex-1 text-base font-semibold ${isDark ? 'text-textDark' : 'text-textLight'}`}
                    >
                      {opt.label}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={isDark ? '#9A98A6' : '#726A57'} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ── STEP 2 — name + image ── */}
          {step === 2 && (
            <View>
              <Text className="text-[11px] font-extrabold tracking-[1.2px] uppercase mb-2" style={{ color: GOLD }}>
                Step 2 of {TOTAL_STEPS}
              </Text>
              <Text
                className={`text-[30px] font-bold leading-[36px] tracking-tight ${isDark ? 'text-textDark' : 'text-textLight'}`}
              >
                Make it real
              </Text>
              <Text className={`text-sm mt-2 leading-5 ${isDark ? 'text-subDark' : 'text-subLight'}`}>
                Give it a name, and a picture to look at every day.
              </Text>

              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder='e.g. MacBook Pro 14"'
                placeholderTextColor={isDark ? '#9A98A6' : '#726A57'}
                className={`mt-5 border rounded-[14px] px-4 py-[14px] text-base font-semibold ${
                  isDark
                    ? 'bg-cardDark text-textDark border-white/[0.09]'
                    : 'bg-cardLight text-textLight border-black/[0.1]'
                }`}
              />

              <TouchableOpacity
                onPress={() => pickImage(false)}
                disabled={isUploadingImage}
                activeOpacity={0.85}
                className={`mt-4 h-40 rounded-[18px] border overflow-hidden ${
                  isDark
                    ? 'bg-cardDark border-white/[0.09]'
                    : 'bg-cardLight border-black/[0.1]'
                }`}
              >
                {imageUri ? (
                  <Image source={{ uri: imageUri }} className="w-full h-full" />
                ) : (
                  <LinearGradient
                    colors={isDark ? ['#1B2032', '#161923'] : ['#FBF7EE', '#FFFFFF']}
                    className="w-full h-full items-center justify-center"
                  >
                    <Text className="text-[34px]">{category?.emoji || '🎯'}</Text>
                  </LinearGradient>
                )}
                <View className="absolute bottom-0 left-0 right-0 flex-row gap-1.5 items-center justify-center py-2.5 bg-black/[0.45]">
                  {isUploadingImage ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="camera" size={16} color="#FFF" />
                      <Text className="text-white text-[13px] font-bold">
                        {imageUri ? 'Change photo' : 'Add a photo'}
                      </Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => pickImage(true)} className="self-center mt-2.5">
                <Text className={`text-[13px] font-semibold ${isDark ? 'text-subDark' : 'text-subLight'}`}>
                  or take a photo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => title.trim() ? goNext() : Toast.show({ type: 'error', text1: 'Name your goal' })}
                className="mt-[26px]"
              >
                <LinearGradient
                  colors={[GOLD, EMERALD]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="rounded-2xl py-[17px] items-center justify-center"
                >
                  <Text className="text-white text-base font-bold">Continue</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP 3 — target amount ── */}
          {step === 3 && (
            <View>
              <Text className="text-[11px] font-extrabold tracking-[1.2px] uppercase mb-2" style={{ color: GOLD }}>
                Step 3 of {TOTAL_STEPS}
              </Text>
              <Text
                className={`text-[30px] font-bold leading-[36px] tracking-tight ${isDark ? 'text-textDark' : 'text-textLight'}`}
              >
                How much do{'\n'}you need?
              </Text>

              <View
                className={`mt-5 border rounded-[18px] p-6 flex-row items-center justify-center gap-1.5 ${
                  isDark
                    ? 'bg-cardDark border-white/[0.09]'
                    : 'bg-cardLight border-black/[0.1]'
                }`}
              >
                <Text className="text-[32px] font-bold" style={{ color: GOLD }}>
                  {CURRENCY_SYMBOLS[currency] || currency}
                </Text>
                <TextInput
                  value={targetAmount}
                  onChangeText={setTargetAmount}
                  placeholder="0"
                  placeholderTextColor={isDark ? '#9A98A6' : '#726A57'}
                  keyboardType="decimal-pad"
                  autoFocus
                  className={`text-[40px] font-bold min-w-[100px] ${isDark ? 'text-textDark' : 'text-textLight'}`}
                />
              </View>

              {avgMonthlySaving > 0 && (
                <Text className={`text-[12.5px] mt-2.5 ${isDark ? 'text-subDark' : 'text-subLight'}`}>
                  ≈ {formatCurrency(avgMonthlySaving, currency, enableConversion ? exchangeRates : null)}/mo is your average recent saving rate.
                </Text>
              )}

              <TouchableOpacity onPress={handleAmountNext} className="mt-[26px]">
                <LinearGradient
                  colors={[GOLD, EMERALD]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="rounded-2xl py-[17px] items-center justify-center"
                >
                  <Text className="text-white text-base font-bold">Continue</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP 4 — deadline ── */}
          {step === 4 && (
            <View>
              <Text className="text-[11px] font-extrabold tracking-[1.2px] uppercase mb-2" style={{ color: GOLD }}>
                Step 4 of {TOTAL_STEPS}
              </Text>
              <Text
                className={`text-[30px] font-bold leading-[36px] tracking-tight ${isDark ? 'text-textDark' : 'text-textLight'}`}
              >
                By when?
              </Text>

              <View className="mt-5 gap-[10px]">
                {DEADLINE_PRESETS.map(p => {
                  const isSelected = deadlineMonths === p.months;
                  return (
                    <TouchableOpacity
                      key={p.label}
                      onPress={() => setDeadlineMonths(p.months)}
                      className={`flex-row items-center p-4 rounded-[14px] border ${
                        isSelected
                          ? 'border-gold'
                          : isDark
                            ? 'bg-cardDark border-white/[0.09]'
                            : 'bg-cardLight border-black/[0.1]'
                      }`}
                      style={isSelected ? { backgroundColor: 'rgba(212,178,106,0.12)', borderColor: GOLD } : undefined}
                    >
                      <Text
                        className={`flex-1 text-base font-semibold ${isDark ? 'text-textDark' : 'text-textLight'}`}
                      >
                        {p.label}
                      </Text>
                      {isSelected && <Ionicons name="checkmark-circle" size={20} color={GOLD} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity onPress={handleDeadlineNext} className="mt-[26px]">
                <LinearGradient
                  colors={[GOLD, EMERALD]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="rounded-2xl py-[17px] items-center justify-center"
                >
                  <Text className="text-white text-base font-bold">Generate my plan</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP 5 — AI plan ── */}
          {step === 5 && (
            <View>
              <Text className="text-[11px] font-extrabold tracking-[1.2px] uppercase mb-2" style={{ color: GOLD }}>
                Step 5 of {TOTAL_STEPS}
              </Text>
              <Text
                className={`text-[30px] font-bold leading-[36px] tracking-tight ${isDark ? 'text-textDark' : 'text-textLight'}`}
              >
                Your plan
              </Text>

              {isGeneratingPlan || !plan ? (
                <View className="py-[60px] items-center">
                  <ActivityIndicator size="large" color={GOLD} />
                  <Text className={`mt-3 text-[13px] ${isDark ? 'text-subDark' : 'text-subLight'}`}>
                    Thinking this through...
                  </Text>
                </View>
              ) : (
                <>
                  {/* Motivational quote */}
                  <View
                    className={`mt-5 border rounded-[18px] p-5 ${
                      isDark
                        ? 'bg-cardDark border-white/[0.09]'
                        : 'bg-cardLight border-black/[0.1]'
                    }`}
                  >
                    <Text
                      className="text-[17px] italic font-semibold leading-6 text-center"
                      style={{ color: GOLD }}
                    >
                      "{plan.motivationalLine}"
                    </Text>
                  </View>

                  {/* Stats row */}
                  <View className="flex-row gap-2.5 mt-4">
                    {[
                      { value: plan.requiredMonthly, label: 'Monthly' },
                      { value: plan.requiredWeekly, label: 'Weekly' },
                      { value: plan.requiredDaily, label: 'Daily' },
                    ].map(({ value, label }) => (
                      <View
                        key={label}
                        className={`flex-1 border rounded-[14px] py-4 items-center ${
                          isDark
                            ? 'bg-cardDark border-white/[0.09]'
                            : 'bg-cardLight border-black/[0.1]'
                        }`}
                      >
                        <Text
                          className={`text-[15px] font-extrabold ${isDark ? 'text-textDark' : 'text-textLight'}`}
                        >
                          {formatCurrency(value, currency, enableConversion ? exchangeRates : null)}
                        </Text>
                        <Text
                          className={`text-[10.5px] font-bold uppercase tracking-[0.5px] mt-1 ${isDark ? 'text-subDark' : 'text-subLight'}`}
                        >
                          {label}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <Text
                    className={`text-[12.5px] mt-2.5 text-center ${isDark ? 'text-subDark' : 'text-subLight'}`}
                  >
                    Projected completion:{' '}
                    {new Date(plan.projectedCompletionDate).toLocaleDateString('en-US', {
                      month: 'long', day: 'numeric', year: 'numeric',
                    })}
                  </Text>

                  <TouchableOpacity
                    onPress={handleCommit}
                    disabled={isCreating}
                    className="mt-[26px]"
                  >
                    <LinearGradient
                      colors={[GOLD, EMERALD]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      className="rounded-2xl py-[17px] items-center justify-center"
                    >
                      {isCreating
                        ? <ActivityIndicator color="#FFF" />
                        : <Text className="text-white text-base font-bold">I'm in</Text>
                      }
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
