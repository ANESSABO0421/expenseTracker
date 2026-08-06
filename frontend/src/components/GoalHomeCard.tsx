import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useColorScheme } from 'nativewind';
import { Goal, useStore } from '../store/useStore';
import { formatCurrency } from '../utils/formatCurrency';

const GOLD = '#D4B26A';
const EMERALD = '#48C79A';

const RING_RADIUS = 34;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function daysLeft(deadline: string | null): number | null {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export default function GoalHomeCard({ goal, onPress }: { goal: Goal; onPress: () => void }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { currency, exchangeRates, enableConversion, fetchCoachMessage, streak } = useStore();

  const [coachLine, setCoachLine] = useState(goal.lastCoachMessage || '');

  useEffect(() => {
    if (!goal.lastCoachMessage) {
      fetchCoachMessage(goal._id).then(msg => msg && setCoachLine(msg));
    }
  }, [goal._id]);

  // Computed rgba values that can't be expressed as Tailwind classes
  const ringTrack = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(20,16,8,0.08)';
  const glassBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(20,16,8,0.035)';
  const glassBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(20,16,8,0.09)';

  const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
  const left = daysLeft(goal.deadline);
  const dashOffset = RING_CIRCUMFERENCE * (1 - goal.percent / 100);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className={`rounded-[22px] overflow-hidden shadow-lg ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 4,
      }}
    >
      {/* Hero image / gradient */}
      <View className="h-[130px] justify-end relative">
        {goal.imageUrl ? (
          <Image source={{ uri: goal.imageUrl }} className="absolute inset-0 w-full h-full" />
        ) : (
          <LinearGradient
            colors={isDark ? ['#3a3226', '#181510'] : ['#EFE6D4', '#DDD0B4']}
            className="absolute inset-0 w-full h-full items-center justify-center"
          >
            <Text className="text-[30px]">{goal.emoji}</Text>
          </LinearGradient>
        )}
        {/* Scrim */}
        <View className="absolute inset-0 bg-black/[0.28]" />
        {/* Title */}
        <Text className="text-white text-xl font-extrabold p-4 pb-3">
          {goal.title}
        </Text>
      </View>

      {/* AI Coach line */}
      {!!coachLine && (
        <Text
          className="text-[13px] italic font-semibold px-4 pt-3 leading-[18px]"
          style={{ color: GOLD }}
          numberOfLines={2}
        >
          "{coachLine}"
        </Text>
      )}

      {/* Stats panel */}
      <View
        className="m-3.5 mt-3 rounded-2xl border p-3.5"
        style={{ backgroundColor: glassBg, borderColor: glassBorder }}
      >
        <View className="flex-row items-center">
          {/* Left stats */}
          <View className="flex-1">
            <View className="mb-2">
              <Text className={`text-[15px] font-extrabold ${isDark ? 'text-textDark' : 'text-textLight'}`}>
                {formatCurrency(goal.savedAmount, currency, enableConversion ? exchangeRates : null)}
              </Text>
              <Text
                className={`text-[10.5px] font-semibold uppercase tracking-[0.4px] mt-[1px] ${isDark ? 'text-subDark' : 'text-subLight'}`}
              >
                Saved
              </Text>
            </View>
            <View className="mb-2">
              <Text className={`text-[15px] font-extrabold ${isDark ? 'text-textDark' : 'text-textLight'}`}>
                {formatCurrency(remaining, currency, enableConversion ? exchangeRates : null)}
              </Text>
              <Text
                className={`text-[10.5px] font-semibold uppercase tracking-[0.4px] mt-[1px] ${isDark ? 'text-subDark' : 'text-subLight'}`}
              >
                Remaining
              </Text>
            </View>
            {left !== null && (
              <View className="mb-2">
                <Text className={`text-[15px] font-extrabold ${isDark ? 'text-textDark' : 'text-textLight'}`}>
                  {left}d
                </Text>
                <Text
                  className={`text-[10.5px] font-semibold uppercase tracking-[0.4px] mt-[1px] ${isDark ? 'text-subDark' : 'text-subLight'}`}
                >
                  Days left
                </Text>
              </View>
            )}
          </View>

          {/* Progress ring */}
          <View className="w-[84px] h-[84px] items-center justify-center">
            <Svg width={84} height={84} viewBox="0 0 84 84">
              <Defs>
                <SvgGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0%" stopColor={GOLD} />
                  <Stop offset="100%" stopColor={EMERALD} />
                </SvgGradient>
              </Defs>
              <Circle cx="42" cy="42" r={RING_RADIUS} stroke={ringTrack} strokeWidth="8" fill="none" />
              <Circle
                cx="42" cy="42" r={RING_RADIUS}
                stroke="url(#ringGrad)" strokeWidth="8" fill="none"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                rotation="-90" origin="42,42"
              />
            </Svg>
            <View className="absolute items-center">
              <Text className={`text-base font-extrabold ${isDark ? 'text-textDark' : 'text-textLight'}`}>
                {goal.percent}%
              </Text>
            </View>
          </View>
        </View>

        {/* Streak pill */}
        {streak && streak.currentStreak >= 2 && (
          <LinearGradient
            colors={['#E8786A', GOLD]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="self-start mt-1.5 px-3 py-[5px] rounded-full"
          >
            <Text className="text-[#1a1408] text-[11.5px] font-extrabold">
              🔥 {streak.currentStreak} day streak
            </Text>
          </LinearGradient>
        )}
      </View>
    </TouchableOpacity>
  );
}
