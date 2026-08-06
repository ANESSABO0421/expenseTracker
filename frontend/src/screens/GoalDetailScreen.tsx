import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Image, ScrollView, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Alert, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Animated, {
  FadeIn, FadeOut, ZoomIn,
  useSharedValue, withRepeat, withSequence, withTiming,
  useAnimatedStyle, Easing,
} from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import Toast from 'react-native-toast-message';
import { useStore, GoalContribution } from '../store/useStore';
import { formatCurrency } from '../utils/formatCurrency';

const GOLD = '#D4B26A';
const EMERALD = '#48C79A';
const FIRE_RED = '#FF6B35';
const MILESTONES = [5, 10, 25, 50, 75, 90, 100];

const RING_RADIUS = 68;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function GoalDetailScreen({ route, navigation }: any) {
  const { goalId } = route.params;
  const { goals, streak, currency, exchangeRates, enableConversion, contributeToGoal, fetchGoalTimeline, fetchCoachMessage, deleteGoal } = useStore();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const goal = goals.find(g => g._id === goalId);

  const [timeline, setTimeline] = useState<GoalContribution[]>([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(true);
  const [coachLine, setCoachLine] = useState(goal?.lastCoachMessage || '');
  const [addAmount, setAddAmount] = useState('');
  const [isContributing, setIsContributing] = useState(false);
  const [showAddInput, setShowAddInput] = useState(false);
  const [celebration, setCelebration] = useState<number | null>(null);

  // Streak fire pulse animation
  const fireScale = useSharedValue(1);
  const fireOpacity = useSharedValue(0.9);
  useEffect(() => {
    fireScale.value = withRepeat(
      withSequence(
        withTiming(1.18, { duration: 700, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 700, easing: Easing.in(Easing.ease) }),
      ),
      -1, false
    );
    fireOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700 }),
        withTiming(0.75, { duration: 700 }),
      ),
      -1, false
    );
  }, []);

  const fireAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fireScale.value }],
    opacity: fireOpacity.value,
  }));

  // Colors
  const ringTrack = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(20,16,8,0.07)';
  const glassBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.85)';
  const glassBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(20,16,8,0.08)';
  const surfaceBg = isDark ? '#161923' : '#FFFFFF';

  const handleDeleteGoal = () => {
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete "${goal?.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const ok = await deleteGoal(goalId);
            if (ok) navigation.goBack();
          },
        },
      ]
    );
  };

  const loadTimeline = useCallback(async () => {
    setIsLoadingTimeline(true);
    const entries = await fetchGoalTimeline(goalId);
    setTimeline(entries);
    setIsLoadingTimeline(false);
  }, [goalId]);

  useEffect(() => {
    loadTimeline();
    if (!goal?.lastCoachMessage) {
      fetchCoachMessage(goalId).then(msg => msg && setCoachLine(msg));
    }
  }, [goalId]);

  if (!goal) {
    return (
      <SafeAreaView className={`flex-1 items-center justify-center ${isDark ? 'bg-bgDark' : 'bg-bgLight'}`}>
        <ActivityIndicator color={GOLD} size="large" />
      </SafeAreaView>
    );
  }

  const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
  const dashOffset = RING_CIRCUMFERENCE * (1 - goal.percent / 100);
  const pct = goal.percent;

  const handleContribute = async () => {
    const amt = Number(addAmount);
    if (!amt || amt <= 0) {
      Toast.show({ type: 'error', text1: 'Enter an amount' });
      return;
    }
    setIsContributing(true);
    const result = await contributeToGoal(goalId, amt, { source: 'manual' });
    setIsContributing(false);
    setAddAmount('');
    setShowAddInput(false);
    if (result) {
      Toast.show({
        type: 'success',
        text1: 'Added! 🎯',
        text2: `${result.goal.percent}% saved toward ${goal.title}.`,
      });
      if (result.milestonesCrossed.length > 0) {
        setCelebration(Math.max(...result.milestonesCrossed));
        setTimeout(() => setCelebration(null), 2200);
      }
      loadTimeline();
    }
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? 'bg-bgDark' : 'bg-bgLight'}`}
      edges={['top', 'bottom']}
    >
      {/* ── Header ── */}
      <View className="flex-row items-center justify-between px-5 pt-1 pb-2">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className={`w-9 h-9 rounded-full items-center justify-center ${isDark ? 'bg-cardDark' : 'bg-white'}`}
          style={{ shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 }}
        >
          <Ionicons name="chevron-back" size={20} color={isDark ? '#EDEAE1' : '#211C13'} />
        </TouchableOpacity>

        <Text
          className={`flex-1 text-center text-[17px] font-bold mx-3 ${isDark ? 'text-textDark' : 'text-textLight'}`}
          numberOfLines={1}
        >
          {goal.title}
        </Text>

        <TouchableOpacity
          onPress={handleDeleteGoal}
          className={`w-9 h-9 rounded-full items-center justify-center ${isDark ? 'bg-cardDark' : 'bg-white'}`}
          style={{ shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 }}
        >
          <Ionicons name="trash-outline" size={18} color="#F43F5E" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Hero + Ring fused block ── */}
        <View className="mx-4">
          {/* Hero image */}
          <View style={{ height: 210, borderRadius: 24, overflow: 'hidden' }}>
            {goal.imageUrl ? (
              <Image source={{ uri: goal.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <LinearGradient
                colors={isDark ? ['#3a3226', '#1d1710'] : ['#EDE3CE', '#D8C89A']}
                style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}
              >
                <Text style={{ fontSize: 60 }}>{goal.emoji}</Text>
              </LinearGradient>
            )}
            {/* Scrim for ring readability */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.55)']}
              style={[StyleSheet.absoluteFill]}
              start={{ x: 0, y: 0.4 }}
              end={{ x: 0, y: 1 }}
            />
            {/* Target label bottom-left */}
            <View style={{ position: 'absolute', bottom: 14, left: 16 }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                Goal
              </Text>
              <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '800' }}>
                {formatCurrency(goal.targetAmount, currency, enableConversion ? exchangeRates : null)}
              </Text>
            </View>
          </View>

          {/* Ring card — sits below hero, slightly overlapping */}
          <View
            style={{
              marginTop: -32,
              borderRadius: 24,
              padding: 20,
              backgroundColor: surfaceBg,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: isDark ? 0.3 : 0.1,
              shadowRadius: 20,
              elevation: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
              {/* Ring */}
              <View style={{ width: 160, height: 160, alignItems: 'center', justifyContent: 'center' }}>
                <Svg width={160} height={160} viewBox="0 0 160 160">
                  <Defs>
                    <SvgGradient id="ringGradDetail" x1="0" y1="0" x2="1" y2="1">
                      <Stop offset="0%" stopColor={GOLD} />
                      <Stop offset="100%" stopColor={EMERALD} />
                    </SvgGradient>
                  </Defs>
                  {/* Track */}
                  <Circle cx="80" cy="80" r={RING_RADIUS} stroke={ringTrack} strokeWidth="14" fill="none" />
                  {/* Progress */}
                  <Circle
                    cx="80" cy="80" r={RING_RADIUS}
                    stroke="url(#ringGradDetail)" strokeWidth="14" fill="none"
                    strokeDasharray={RING_CIRCUMFERENCE}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    rotation="-90" origin="80,80"
                  />
                </Svg>
                <View style={{ position: 'absolute', alignItems: 'center' }}>
                  <Text style={{
                    fontSize: 34, fontWeight: '900',
                    color: isDark ? '#EDEAE1' : '#211C13',
                    letterSpacing: -1,
                  }}>
                    {pct}%
                  </Text>
                  <Text style={{
                    fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
                    letterSpacing: 1, color: isDark ? '#9A98A6' : '#726A57', marginTop: 2,
                  }}>
                    saved
                  </Text>
                </View>
              </View>

              {/* Stats column */}
              <View style={{ flex: 1, gap: 14 }}>
                <View>
                  <Text style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, color: EMERALD, marginBottom: 3 }}>
                    Saved
                  </Text>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: isDark ? '#EDEAE1' : '#211C13' }}>
                    {formatCurrency(goal.savedAmount, currency, enableConversion ? exchangeRates : null)}
                  </Text>
                </View>
                <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }} />
                <View>
                  <Text style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, color: isDark ? '#9A98A6' : '#B8A882', marginBottom: 3 }}>
                    Still need
                  </Text>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: isDark ? '#EDEAE1' : '#211C13' }}>
                    {formatCurrency(remaining, currency, enableConversion ? exchangeRates : null)}
                  </Text>
                </View>
                {goal.deadline && (
                  <>
                    <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }} />
                    <View>
                      <Text style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, color: GOLD, marginBottom: 3 }}>
                        Deadline
                      </Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#EDEAE1' : '#211C13' }}>
                        {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Mini progress bar */}
            <View style={{ marginTop: 18, height: 6, borderRadius: 3, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)', overflow: 'hidden' }}>
              <LinearGradient
                colors={[GOLD, EMERALD]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ height: '100%', width: `${Math.min(100, pct)}%`, borderRadius: 3 }}
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
              <Text style={{ fontSize: 10.5, fontWeight: '600', color: isDark ? '#9A98A6' : '#A09070' }}>0%</Text>
              <Text style={{ fontSize: 10.5, fontWeight: '600', color: isDark ? '#9A98A6' : '#A09070' }}>100%</Text>
            </View>
          </View>
        </View>

        {/* ── AI Coach ── */}
        {!!coachLine && (
          <View style={{ marginHorizontal: 16, marginTop: 14 }}>
            <LinearGradient
              colors={isDark ? ['rgba(212,178,106,0.12)', 'rgba(72,199,154,0.08)'] : ['rgba(212,178,106,0.15)', 'rgba(72,199,154,0.08)']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 20,
                padding: 18,
                borderWidth: 1,
                borderColor: 'rgba(212,178,106,0.3)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <LinearGradient
                  colors={[GOLD, EMERALD]}
                  style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="sparkles" size={14} color="#FFF" />
                </LinearGradient>
                <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', color: GOLD }}>
                  AI Coach
                </Text>
              </View>
              <Text style={{
                fontSize: 15, fontStyle: 'italic', fontWeight: '600', lineHeight: 22,
                color: isDark ? '#EDEAE1' : '#3a2f1e',
              }}>
                "{coachLine}"
              </Text>
            </LinearGradient>
          </View>
        )}

        {/* ── Add to goal CTA ── */}
        <View style={{ marginHorizontal: 16, marginTop: 14 }}>
          {showAddInput ? (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View
                style={{
                  backgroundColor: surfaceBg,
                  borderRadius: 20,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: glassBorder,
                  flexDirection: 'row',
                  gap: 10,
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOpacity: 0.06,
                  shadowRadius: 12,
                  elevation: 3,
                }}
              >
                <TextInput
                  value={addAmount}
                  onChangeText={setAddAmount}
                  placeholder="Amount"
                  placeholderTextColor={isDark ? '#9A98A6' : '#B0A485'}
                  keyboardType="decimal-pad"
                  autoFocus
                  style={{
                    flex: 1,
                    fontSize: 22,
                    fontWeight: '800',
                    color: isDark ? '#EDEAE1' : '#211C13',
                    padding: 0,
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowAddInput(false)}
                  style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' }}
                >
                  <Ionicons name="close" size={18} color={isDark ? '#9A98A6' : '#726A57'} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleContribute}
                  disabled={isContributing}
                  style={{ borderRadius: 16, overflow: 'hidden' }}
                >
                  <LinearGradient
                    colors={[GOLD, EMERALD]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ paddingHorizontal: 20, height: 44, alignItems: 'center', justifyContent: 'center' }}
                  >
                    {isContributing
                      ? <ActivityIndicator color="#FFF" size="small" />
                      : <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 15 }}>Add</Text>
                    }
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          ) : (
            <TouchableOpacity
              onPress={() => setShowAddInput(true)}
              activeOpacity={0.85}
              style={{ borderRadius: 20, overflow: 'hidden' }}
            >
              <LinearGradient
                colors={[GOLD, EMERALD]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: 20 }}
              >
                <Ionicons name="add-circle" size={22} color="#FFF" />
                <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '800' }}>Add to this goal</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Streak card — PREMIUM redesign ── */}
        {streak && streak.currentStreak > 0 && (
          <View style={{ marginHorizontal: 16, marginTop: 14 }}>
            <LinearGradient
              colors={isDark
                ? ['#2D1810', '#1A0F08']
                : ['#FFF5ED', '#FFEDE0']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 24,
                padding: 20,
                borderWidth: 1.5,
                borderColor: isDark ? 'rgba(255,107,53,0.35)' : 'rgba(255,107,53,0.25)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                {/* Animated fire */}
                <Animated.View style={[fireAnimStyle, {
                  width: 60, height: 60, borderRadius: 30,
                  backgroundColor: isDark ? 'rgba(255,107,53,0.2)' : 'rgba(255,107,53,0.15)',
                  alignItems: 'center', justifyContent: 'center',
                }]}>
                  <Text style={{ fontSize: 30 }}>🔥</Text>
                </Animated.View>

                {/* Streak info */}
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 28, fontWeight: '900', letterSpacing: -0.5,
                    color: FIRE_RED,
                  }}>
                    {streak.currentStreak}
                    <Text style={{ fontSize: 16, fontWeight: '700', color: isDark ? '#EDEAE1' : '#3A1F0A' }}>
                      {' '}day{streak.currentStreak !== 1 ? 's' : ''}
                    </Text>
                  </Text>
                  <Text style={{
                    fontSize: 13, fontWeight: '700', textTransform: 'uppercase',
                    letterSpacing: 0.8, color: FIRE_RED, marginTop: 1,
                  }}>
                    🏆 Saving streak
                  </Text>
                </View>

                {/* Best badge */}
                <View style={{
                  backgroundColor: isDark ? 'rgba(255,107,53,0.2)' : 'rgba(255,107,53,0.12)',
                  borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8,
                  alignItems: 'center',
                }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#FF9A6C' : FIRE_RED, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Best
                  </Text>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: isDark ? '#EDEAE1' : '#3A1F0A', letterSpacing: -0.5 }}>
                    {streak.longestStreak}
                  </Text>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: isDark ? '#9A98A6' : '#A0805A' }}>
                    days
                  </Text>
                </View>
              </View>

              {/* Mini streak bar — last 7 days placeholder dots */}
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 16, alignItems: 'center' }}>
                {Array.from({ length: 7 }).map((_, i) => {
                  const active = i >= 7 - streak.currentStreak;
                  return (
                    <LinearGradient
                      key={i}
                      colors={active ? [FIRE_RED, GOLD] : ['transparent', 'transparent']}
                      style={{
                        flex: 1,
                        height: 5,
                        borderRadius: 3,
                        backgroundColor: active ? undefined : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
                      }}
                    />
                  );
                })}
              </View>
              <Text style={{ fontSize: 10.5, fontWeight: '600', color: isDark ? '#9A98A6' : '#A0805A', marginTop: 5 }}>
                Last 7 days
              </Text>
            </LinearGradient>
          </View>
        )}

        {/* ── Milestones ── */}
        <View style={{
          marginHorizontal: 16, marginTop: 14,
          backgroundColor: surfaceBg,
          borderRadius: 24, padding: 20,
          borderWidth: 1, borderColor: glassBorder,
          shadowColor: '#000', shadowOpacity: isDark ? 0.15 : 0.05, shadowRadius: 12, elevation: 3,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', color: GOLD }}>
              Milestones
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#9A98A6' : '#A09070' }}>
              {MILESTONES.filter(m => goal.percent >= m).length}/{MILESTONES.length}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            {MILESTONES.map((m, idx) => {
              const reached = goal.milestonesReached.includes(m) || goal.percent >= m;
              const isNext = !reached && MILESTONES[idx - 1] !== undefined && (goal.percent >= (MILESTONES[idx - 1] ?? 0));
              return (
                <View key={m} style={{ alignItems: 'center', gap: 6, flex: 1 }}>
                  {reached ? (
                    <LinearGradient
                      colors={[GOLD, EMERALD]}
                      style={{
                        width: 32, height: 32, borderRadius: 16,
                        alignItems: 'center', justifyContent: 'center',
                        shadowColor: GOLD, shadowOpacity: 0.4, shadowRadius: 6, elevation: 4,
                      }}
                    >
                      <Ionicons name="checkmark" size={16} color="#FFF" />
                    </LinearGradient>
                  ) : (
                    <View style={{
                      width: 32, height: 32, borderRadius: 16,
                      backgroundColor: isNext
                        ? (isDark ? 'rgba(212,178,106,0.15)' : 'rgba(212,178,106,0.12)')
                        : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'),
                      borderWidth: isNext ? 1.5 : 0,
                      borderColor: isNext ? GOLD : 'transparent',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isNext && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: GOLD, opacity: 0.5 }} />}
                    </View>
                  )}
                  <Text style={{
                    fontSize: 9, fontWeight: '700', letterSpacing: 0.3,
                    color: reached ? (isDark ? '#EDEAE1' : '#211C13') : (isDark ? '#9A98A6' : '#B0A080'),
                  }}>
                    {m}%
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Timeline ── */}
        <View style={{
          marginHorizontal: 16, marginTop: 14,
          backgroundColor: surfaceBg,
          borderRadius: 24, padding: 20,
          borderWidth: 1, borderColor: glassBorder,
          shadowColor: '#000', shadowOpacity: isDark ? 0.15 : 0.05, shadowRadius: 12, elevation: 3,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', color: GOLD }}>
              Timeline
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
          </View>

          {isLoadingTimeline ? (
            <ActivityIndicator color={GOLD} style={{ marginVertical: 20 }} />
          ) : timeline.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
              <Text style={{ fontSize: 32, marginBottom: 10 }}>📋</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#9A98A6' : '#A09070', textAlign: 'center', lineHeight: 20 }}>
                No contributions yet.{'\n'}Tap "Add to this goal" to begin.
              </Text>
            </View>
          ) : (
            <View>
              {timeline.map((entry, i) => (
                <View key={entry._id} style={{ flexDirection: 'row', gap: 14 }}>
                  {/* Dot + line column */}
                  <View style={{ alignItems: 'center', width: 16 }}>
                    <LinearGradient
                      colors={[GOLD, EMERALD]}
                      style={{ width: 14, height: 14, borderRadius: 7, marginTop: 3 }}
                    />
                    {i < timeline.length - 1 && (
                      <View style={{ flex: 1, width: 2, backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', marginTop: 4, marginBottom: 0 }} />
                    )}
                  </View>
                  {/* Content */}
                  <View style={{ flex: 1, paddingBottom: i < timeline.length - 1 ? 18 : 0 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: EMERALD }}>
                      {entry.amount >= 0 ? '+' : ''}{formatCurrency(entry.amount, currency, enableConversion ? exchangeRates : null)}
                    </Text>
                    <Text style={{ fontSize: 11.5, marginTop: 2, color: isDark ? '#9A98A6' : '#A09070', fontWeight: '600' }}>
                      {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                    <View style={{
                      marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 6,
                      backgroundColor: isDark ? 'rgba(72,199,154,0.1)' : 'rgba(72,199,154,0.1)',
                      alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
                    }}>
                      <Text style={{ fontSize: 10.5, fontWeight: '700', color: EMERALD }}>
                        Total: {formatCurrency(entry.runningTotal, currency, enableConversion ? exchangeRates : null)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

      </ScrollView>

      {/* ── Milestone celebration overlay ── */}
      {celebration !== null && (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)' }]}
          pointerEvents="none"
        >
          <Animated.View
            entering={ZoomIn.springify().damping(12)}
            style={{
              width: 280,
              borderRadius: 28,
              overflow: 'hidden',
              backgroundColor: surfaceBg,
              shadowColor: GOLD,
              shadowOpacity: 0.3,
              shadowRadius: 30,
              elevation: 20,
            }}
          >
            <LinearGradient
              colors={[GOLD, EMERALD]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{ paddingVertical: 32, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 52 }}>🎉</Text>
              <Text style={{ fontSize: 26, fontWeight: '900', color: '#FFF', marginTop: 10, letterSpacing: -0.5 }}>
                {celebration}% Reached!
              </Text>
            </LinearGradient>
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: isDark ? '#9A98A6' : '#726A57', textAlign: 'center', lineHeight: 21 }}>
                {goal.title} is getting closer — keep the momentum going! 🚀
              </Text>
            </View>
          </Animated.View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}
