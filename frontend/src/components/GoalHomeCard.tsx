import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useColorScheme } from 'nativewind';
import { Goal, useStore } from '../store/useStore';
import { formatCurrency } from '../utils/formatCurrency';
import { Ionicons } from '@expo/vector-icons';

const GOLD = '#D4B26A';
const EMERALD = '#48C79A';
const FIRE_RED = '#FF6B35';

const RING_RADIUS = 36;
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

  const ringTrack = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(20,16,8,0.07)';
  const cardBg = isDark ? '#161923' : '#FFFFFF';

  const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
  const left = daysLeft(goal.deadline);
  const dashOffset = RING_CIRCUMFERENCE * (1 - goal.percent / 100);
  const pct = goal.percent;

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      style={{
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: cardBg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDark ? 0.35 : 0.12,
        shadowRadius: 20,
        elevation: 6,
      }}
    >
      {/* ── Hero image ── */}
      <View style={{ height: 140 }}>
        {goal.imageUrl ? (
          <Image source={{ uri: goal.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={isDark ? ['#3a3226', '#1d1710'] : ['#EDE3CE', '#D8C89A']}
            style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}
          >
            <Text style={{ fontSize: 38 }}>{goal.emoji}</Text>
          </LinearGradient>
        )}
        {/* Gradient scrim */}
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.62)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0.3 }}
          end={{ x: 0, y: 1 }}
        />
        {/* Goal title */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14 }}>
          <Text style={{ color: '#FFF', fontSize: 20, fontWeight: '800', letterSpacing: -0.3 }}>
            {goal.title}
          </Text>
          {left !== null && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
              <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.75)" />
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '600' }}>
                {left} days left
              </Text>
            </View>
          )}
        </View>

        {/* Streak pill — top right */}
        {streak && streak.currentStreak >= 1 && (
          <View style={{ position: 'absolute', top: 10, right: 10 }}>
            <LinearGradient
              colors={[FIRE_RED, GOLD]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 }}
            >
              <Text style={{ fontSize: 12 }}>🔥</Text>
              <Text style={{ color: '#FFF', fontSize: 11.5, fontWeight: '800' }}>
                {streak.currentStreak}d
              </Text>
            </LinearGradient>
          </View>
        )}
      </View>

      {/* ── AI coach line ── */}
      {!!coachLine && (
        <View style={{
          marginHorizontal: 14, marginTop: 12,
          backgroundColor: isDark ? 'rgba(212,178,106,0.1)' : 'rgba(212,178,106,0.12)',
          borderRadius: 12, padding: 10,
          borderLeftWidth: 3, borderLeftColor: GOLD,
        }}>
          <Text
            style={{ fontSize: 12.5, fontStyle: 'italic', fontWeight: '600', lineHeight: 17, color: isDark ? '#EDEAE1' : '#3a2f1e' }}
            numberOfLines={2}
          >
            "{coachLine}"
          </Text>
        </View>
      )}

      {/* ── Stats + ring ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 14, gap: 12 }}>
        {/* Stats */}
        <View style={{ flex: 1, gap: 8 }}>
          <View>
            <Text style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7, color: EMERALD }}>
              Saved
            </Text>
            <Text style={{ fontSize: 17, fontWeight: '800', color: isDark ? '#EDEAE1' : '#211C13', marginTop: 1 }}>
              {formatCurrency(goal.savedAmount, currency, enableConversion ? exchangeRates : null)}
            </Text>
          </View>
          <View>
            <Text style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7, color: isDark ? '#9A98A6' : '#A09070' }}>
              Still need
            </Text>
            <Text style={{ fontSize: 17, fontWeight: '800', color: isDark ? '#EDEAE1' : '#211C13', marginTop: 1 }}>
              {formatCurrency(remaining, currency, enableConversion ? exchangeRates : null)}
            </Text>
          </View>
        </View>

        {/* Ring */}
        <View style={{ width: 90, height: 90, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={90} height={90} viewBox="0 0 90 90">
            <Defs>
              <SvgGradient id="ringGradHome" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor={GOLD} />
                <Stop offset="100%" stopColor={EMERALD} />
              </SvgGradient>
            </Defs>
            <Circle cx="45" cy="45" r={RING_RADIUS} stroke={ringTrack} strokeWidth="9" fill="none" />
            <Circle
              cx="45" cy="45" r={RING_RADIUS}
              stroke="url(#ringGradHome)" strokeWidth="9" fill="none"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              rotation="-90" origin="45,45"
            />
          </Svg>
          <View style={{ position: 'absolute', alignItems: 'center' }}>
            <Text style={{ fontSize: 17, fontWeight: '900', color: isDark ? '#EDEAE1' : '#211C13', letterSpacing: -0.5 }}>
              {pct}%
            </Text>
          </View>
        </View>
      </View>

      {/* ── Progress bar ── */}
      <View style={{ marginHorizontal: 14, marginBottom: 14 }}>
        <View style={{ height: 5, borderRadius: 3, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <LinearGradient
            colors={[GOLD, EMERALD]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ height: '100%', width: `${Math.min(100, pct)}%`, borderRadius: 3 }}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}
