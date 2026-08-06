import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Image, ScrollView, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import Toast from 'react-native-toast-message';
import { useStore, GoalContribution } from '../store/useStore';
import { formatCurrency } from '../utils/formatCurrency';

const GOLD = '#D4B26A';
const EMERALD = '#48C79A';
const MILESTONES = [5, 10, 25, 50, 75, 90, 100];

const RING_RADIUS = 60;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

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

  // Colors that can't be expressed as Tailwind classes (computed rgba, etc.)
  const ringTrack = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(20,16,8,0.08)';
  const glassBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(20,16,8,0.035)';
  const glassBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(20,16,8,0.09)';

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
        <ActivityIndicator color={GOLD} />
      </SafeAreaView>
    );
  }

  const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
  const dashOffset = RING_CIRCUMFERENCE * (1 - goal.percent / 100);

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
        text1: 'Added!',
        text2: `You're now ${result.goal.percent}% of the way to ${goal.title}.`,
      });
      if (result.milestonesCrossed.length > 0) {
        setCelebration(Math.max(...result.milestonesCrossed));
        setTimeout(() => setCelebration(null), 1800);
      }
      loadTimeline();
    }
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? 'bg-bgDark' : 'bg-bgLight'}`}
      edges={['top', 'bottom']}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-2.5">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className={`w-9 h-9 rounded-full items-center justify-center ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}
        >
          <Ionicons name="chevron-back" size={20} color={isDark ? '#EDEAE1' : '#211C13'} />
        </TouchableOpacity>
        <Text
          className={`flex-1 text-center text-base font-bold mx-2 ${isDark ? 'text-textDark' : 'text-textLight'}`}
          numberOfLines={1}
        >
          {goal.title}
        </Text>
        {/* Delete button */}
        <TouchableOpacity
          onPress={handleDeleteGoal}
          className={`w-9 h-9 rounded-full items-center justify-center ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}
        >
          <Ionicons name="trash-outline" size={18} color="#F43F5E" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Hero image */}
        <View className="h-[190px] mx-5 rounded-[20px] overflow-hidden">
          {goal.imageUrl ? (
            <Image source={{ uri: goal.imageUrl }} className="w-full h-full" />
          ) : (
            <LinearGradient
              colors={isDark ? ['#3a3226', '#181510'] : ['#EFE6D4', '#DDD0B4']}
              className="w-full h-full items-center justify-center"
            >
              <Text className="text-[44px]">{goal.emoji}</Text>
            </LinearGradient>
          )}
        </View>

        {/* Progress ring */}
        <View className="items-center justify-center" style={{ marginTop: -40 }}>
          <Svg width={148} height={148} viewBox="0 0 148 148">
            <Defs>
              <SvgGradient id="ringGradDetail" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor={GOLD} />
                <Stop offset="100%" stopColor={EMERALD} />
              </SvgGradient>
            </Defs>
            <Circle cx="74" cy="74" r={RING_RADIUS} stroke={ringTrack} strokeWidth="12" fill="none" />
            <Circle
              cx="74" cy="74" r={RING_RADIUS}
              stroke="url(#ringGradDetail)" strokeWidth="12" fill="none"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              rotation="-90" origin="74,74"
            />
          </Svg>
          <View className="absolute items-center">
            <Text
              className={`text-[30px] font-extrabold ${isDark ? 'text-textDark' : 'text-textLight'}`}
            >
              {goal.percent}%
            </Text>
            <Text
              className={`text-[11px] font-semibold uppercase tracking-[0.5px] mt-0.5 ${isDark ? 'text-subDark' : 'text-subLight'}`}
            >
              saved
            </Text>
          </View>
        </View>

        {/* Big stats */}
        <View className="flex-row justify-center gap-10 mt-2 mb-5">
          {[
            { value: goal.savedAmount, label: 'Saved' },
            { value: remaining, label: 'Remaining' },
          ].map(({ value, label }) => (
            <View key={label} className="items-center">
              <Text className={`text-[17px] font-extrabold ${isDark ? 'text-textDark' : 'text-textLight'}`}>
                {formatCurrency(value, currency, enableConversion ? exchangeRates : null)}
              </Text>
              <Text
                className={`text-[11px] font-semibold uppercase tracking-[0.5px] mt-0.5 ${isDark ? 'text-subDark' : 'text-subLight'}`}
              >
                {label}
              </Text>
            </View>
          ))}
        </View>

        {/* AI Coach */}
        {!!coachLine && (
          <View
            className="mx-5 mb-3.5 rounded-2xl border p-4"
            style={{ backgroundColor: glassBg, borderColor: glassBorder }}
          >
            <Text className="text-[11px] font-extrabold tracking-[1px] uppercase mb-2" style={{ color: GOLD }}>
              AI Coach
            </Text>
            <Text
              className={`text-[15px] italic font-semibold leading-[21px] ${isDark ? 'text-textDark' : 'text-textLight'}`}
            >
              "{coachLine}"
            </Text>
          </View>
        )}

        {/* Add to goal */}
        <View
          className="mx-5 mb-3.5 rounded-2xl border p-4"
          style={{ backgroundColor: glassBg, borderColor: glassBorder }}
        >
          {showAddInput ? (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View className="flex-row gap-2 items-center">
                <TextInput
                  value={addAmount}
                  onChangeText={setAddAmount}
                  placeholder="Amount"
                  placeholderTextColor={isDark ? '#9A98A6' : '#726A57'}
                  keyboardType="decimal-pad"
                  autoFocus
                  className={`flex-1 border rounded-xl px-[14px] py-2.5 text-[15px] font-semibold ${
                    isDark ? 'text-textDark' : 'text-textLight'
                  }`}
                  style={{ borderColor: glassBorder }}
                />
                <TouchableOpacity
                  onPress={handleContribute}
                  disabled={isContributing}
                  className="rounded-xl overflow-hidden"
                >
                  <LinearGradient colors={[GOLD, EMERALD]} className="w-10 h-10 items-center justify-center">
                    {isContributing
                      ? <ActivityIndicator color="#FFF" size="small" />
                      : <Ionicons name="checkmark" size={18} color="#FFF" />
                    }
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowAddInput(false)}
                  className="w-10 h-10 items-center justify-center"
                >
                  <Ionicons name="close" size={18} color={isDark ? '#9A98A6' : '#726A57'} />
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          ) : (
            <TouchableOpacity
              onPress={() => setShowAddInput(true)}
              className="flex-row items-center gap-2.5 justify-center"
            >
              <Ionicons name="add-circle" size={20} color={GOLD} />
              <Text className={`text-[15px] font-bold ${isDark ? 'text-textDark' : 'text-textLight'}`}>
                Add to this goal
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Streak */}
        {streak && streak.currentStreak > 0 && (
          <View
            className="mx-5 mb-3.5 rounded-2xl border p-4 flex-row items-center gap-3"
            style={{ backgroundColor: glassBg, borderColor: glassBorder }}
          >
            <Text className="text-[28px]">🔥</Text>
            <View>
              <Text className={`text-base font-extrabold ${isDark ? 'text-textDark' : 'text-textLight'}`}>
                {streak.currentStreak} day streak
              </Text>
              <Text className={`text-xs mt-0.5 ${isDark ? 'text-subDark' : 'text-subLight'}`}>
                Longest: {streak.longestStreak} days
              </Text>
            </View>
          </View>
        )}

        {/* Milestones */}
        <View
          className="mx-5 mb-3.5 rounded-2xl border p-4"
          style={{ backgroundColor: glassBg, borderColor: glassBorder }}
        >
          <Text className="text-[11px] font-extrabold tracking-[1px] uppercase mb-2" style={{ color: GOLD }}>
            Milestones
          </Text>
          <View className="flex-row justify-between">
            {MILESTONES.map(m => {
              const reached = goal.milestonesReached.includes(m) || goal.percent >= m;
              return (
                <View key={m} className="items-center gap-1">
                  {reached ? (
                    <LinearGradient
                      colors={[GOLD, EMERALD]}
                      className="w-7 h-7 rounded-full"
                    />
                  ) : (
                    <View className="w-7 h-7 rounded-full" style={{ backgroundColor: ringTrack }} />
                  )}
                  <Text
                    className={`text-[9.5px] font-semibold ${isDark ? 'text-subDark' : 'text-subLight'}`}
                  >
                    {m}%
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Timeline */}
        <View
          className="mx-5 mb-3.5 rounded-2xl border p-4"
          style={{ backgroundColor: glassBg, borderColor: glassBorder }}
        >
          <Text className="text-[11px] font-extrabold tracking-[1px] uppercase mb-2" style={{ color: GOLD }}>
            Timeline
          </Text>
          {isLoadingTimeline ? (
            <ActivityIndicator color={GOLD} className="mt-3" />
          ) : timeline.length === 0 ? (
            <Text className={`text-[13px] mt-2 ${isDark ? 'text-subDark' : 'text-subLight'}`}>
              No contributions yet — add to this goal to start your timeline.
            </Text>
          ) : (
            <View className="mt-1.5">
              {timeline.map((entry, i) => (
                <View key={entry._id} className="flex-row relative pl-1">
                  <View
                    className="w-2 h-2 rounded-full mt-[5px] mr-3"
                    style={{ backgroundColor: GOLD }}
                  />
                  {i < timeline.length - 1 && (
                    <View
                      className="absolute left-[7.5px] top-[14px] bottom-0 w-[1.5px]"
                      style={{ backgroundColor: ringTrack }}
                    />
                  )}
                  <View className="flex-1 pb-4">
                    <Text className={`text-[14px] font-bold ${isDark ? 'text-textDark' : 'text-textLight'}`}>
                      {entry.amount >= 0 ? '+' : ''}{formatCurrency(entry.amount, currency, enableConversion ? exchangeRates : null)}
                    </Text>
                    <Text className={`text-[11.5px] mt-0.5 ${isDark ? 'text-subDark' : 'text-subLight'}`}>
                      {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' · '}Total: {formatCurrency(entry.runningTotal, currency, enableConversion ? exchangeRates : null)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

      </ScrollView>

      {/* Milestone celebration overlay */}
      {celebration !== null && (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={StyleSheet.absoluteFill}
          className="items-center justify-center bg-black/50"
          pointerEvents="none"
        >
          <Animated.View
            entering={ZoomIn.springify()}
            className={`rounded-[24px] p-8 items-center w-[260px] ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}
          >
            <LinearGradient
              colors={[GOLD, EMERALD]}
              className="w-[72px] h-[72px] rounded-full items-center justify-center mb-3.5"
            >
              <Text className="text-[32px]">🎉</Text>
            </LinearGradient>
            <Text className={`text-[22px] font-extrabold ${isDark ? 'text-textDark' : 'text-textLight'}`}>
              {celebration}% reached!
            </Text>
            <Text className={`text-[13px] mt-1.5 text-center ${isDark ? 'text-subDark' : 'text-subLight'}`}>
              {goal.title} is getting closer.
            </Text>
          </Animated.View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}
