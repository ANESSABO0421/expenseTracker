import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
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

  const cardBg = isDark ? '#161923' : '#FFFFFF';
  const textPrimary = isDark ? '#EDEAE1' : '#211C13';
  const textSecondary = isDark ? '#9A98A6' : '#726A57';
  const glassBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(20,16,8,0.035)';
  const glassBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(20,16,8,0.09)';
  const ringTrack = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(20,16,8,0.08)';

  const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
  const left = daysLeft(goal.deadline);
  const dashOffset = RING_CIRCUMFERENCE * (1 - goal.percent / 100);

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.card, { backgroundColor: cardBg }]}>
      <View style={styles.heroWrap}>
        {goal.imageUrl ? (
          <Image source={{ uri: goal.imageUrl }} style={styles.heroImage} />
        ) : (
          <LinearGradient colors={isDark ? ['#3a3226', '#181510'] : ['#EFE6D4', '#DDD0B4']} style={styles.heroImage}>
            <Text style={{ fontSize: 30 }}>{goal.emoji}</Text>
          </LinearGradient>
        )}
        <View style={styles.heroScrim} />
        <Text style={styles.heroTitle}>{goal.title}</Text>
      </View>

      {!!coachLine && (
        <Text style={[styles.coachLine, { color: GOLD }]} numberOfLines={2}>"{coachLine}"</Text>
      )}

      <View style={[styles.statPanel, { backgroundColor: glassBg, borderColor: glassBorder }]}>
        <View style={styles.statRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.miniStat}>
              <Text style={[styles.miniStatValue, { color: textPrimary }]}>
                {formatCurrency(goal.savedAmount, currency, enableConversion ? exchangeRates : null)}
              </Text>
              <Text style={[styles.miniStatLabel, { color: textSecondary }]}>Saved</Text>
            </View>
            <View style={styles.miniStat}>
              <Text style={[styles.miniStatValue, { color: textPrimary }]}>
                {formatCurrency(remaining, currency, enableConversion ? exchangeRates : null)}
              </Text>
              <Text style={[styles.miniStatLabel, { color: textSecondary }]}>Remaining</Text>
            </View>
            {left !== null && (
              <View style={styles.miniStat}>
                <Text style={[styles.miniStatValue, { color: textPrimary }]}>{left}d</Text>
                <Text style={[styles.miniStatLabel, { color: textSecondary }]}>Days left</Text>
              </View>
            )}
          </View>

          <View style={styles.ringWrap}>
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
            <View style={styles.ringCenter}>
              <Text style={[styles.ringPercent, { color: textPrimary }]}>{goal.percent}%</Text>
            </View>
          </View>
        </View>

        {streak && streak.currentStreak >= 2 && (
          <LinearGradient colors={['#E8786A', GOLD]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.streakPill}>
            <Text style={styles.streakText}>🔥 {streak.currentStreak} day streak</Text>
          </LinearGradient>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 22, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 4 },
  heroWrap: { height: 130, justifyContent: 'flex-end', position: 'relative' },
  heroImage: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  heroScrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.28)' },
  heroTitle: { color: '#FFF', fontSize: 20, fontWeight: '800', padding: 16, paddingBottom: 12 },
  coachLine: { fontSize: 13, fontStyle: 'italic', fontWeight: '600', paddingHorizontal: 16, paddingTop: 12, lineHeight: 18 },
  statPanel: { margin: 14, marginTop: 12, borderRadius: 16, borderWidth: 1, padding: 14 },
  statRow: { flexDirection: 'row', alignItems: 'center' },
  miniStat: { marginBottom: 8 },
  miniStatValue: { fontSize: 15, fontWeight: '800' },
  miniStatLabel: { fontSize: 10.5, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 1 },
  ringWrap: { width: 84, height: 84, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  ringPercent: { fontSize: 16, fontWeight: '800' },
  streakPill: { alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  streakText: { color: '#1a1408', fontSize: 11.5, fontWeight: '800' },
});
