import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Goal, useStore } from '../store/useStore';
import { formatCurrency } from '../utils/formatCurrency';
import PressableScale from './ui/PressableScale';
import { useTheme, brand, shadow } from '../theme';

const RING = 30;
const CIRC = 2 * Math.PI * RING;

function daysLeft(deadline: string | null): number | null {
  if (!deadline) return null;
  return Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000));
}

export default function GoalHomeCard({ goal, onPress }: { goal: Goal; onPress: () => void }) {
  const { c, isDark } = useTheme();
  const { currency, exchangeRates, enableConversion, fetchCoachMessage, streak } = useStore();
  const rates = enableConversion ? exchangeRates : null;
  const [coachLine, setCoachLine] = useState(goal.lastCoachMessage || '');

  useEffect(() => {
    if (!goal.lastCoachMessage) {
      fetchCoachMessage(goal._id).then(msg => msg && setCoachLine(msg));
    }
  }, [goal._id]);

  const pct = Math.min(100, goal.percent);
  const left = daysLeft(goal.deadline);

  return (
    <PressableScale onPress={onPress} scaleTo={0.98} style={[styles.card, { backgroundColor: c.surface }, shadow(c, 2)]}>
      {/* Hero */}
      <View style={styles.hero}>
        {goal.imageUrl ? (
          <Image source={{ uri: goal.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={isDark ? ['#3A2E22', '#1A1510'] : ['#FFE7D6', '#FFD0B5']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { alignItems: 'flex-end', justifyContent: 'center', paddingRight: 28 }]}
          >
            <Text style={{ fontSize: 56, opacity: 0.9 }}>{goal.emoji}</Text>
          </LinearGradient>
        )}
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.65)']}
          start={{ x: 0, y: 0.2 }} end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroTopRow}>
          <View style={styles.tag}>
            <Ionicons name="flag" size={11} color="#FFF" />
            <Text style={styles.tagText}>SAVINGS GOAL</Text>
          </View>
          {streak && streak.currentStreak >= 1 && (
            <LinearGradient colors={[brand.fire, brand.gold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.tag}>
              <Text style={{ fontSize: 11 }}>🔥</Text>
              <Text style={styles.tagText}>{streak.currentStreak} DAY STREAK</Text>
            </LinearGradient>
          )}
        </View>
        <View style={styles.heroBottom}>
          <Text style={styles.heroTitle} numberOfLines={1}>{goal.title}</Text>
          {left !== null && (
            <Text style={styles.heroSub}>{left} days left</Text>
          )}
        </View>
      </View>

      {/* Stats + ring */}
      <View style={styles.body}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.amount, { color: c.text }]}>
            {formatCurrency(goal.savedAmount, currency, rates)}
            <Text style={[styles.of, { color: c.textTertiary }]}>  of {formatCurrency(goal.targetAmount, currency, rates)}</Text>
          </Text>
          <View style={[styles.track, { backgroundColor: c.surfaceAlt }]}>
            <LinearGradient
              colors={[brand.gold, brand.emerald]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ height: '100%', width: `${pct}%`, borderRadius: 4 }}
            />
          </View>
          {!!coachLine && (
            <View style={styles.coachRow}>
              <Ionicons name="sparkles" size={12} color={brand.gold} />
              <Text style={[styles.coach, { color: c.textSecondary }]} numberOfLines={2}>{coachLine}</Text>
            </View>
          )}
        </View>

        <View style={styles.ringWrap}>
          <Svg width={76} height={76} viewBox="0 0 76 76">
            <Defs>
              <SvgGradient id="ringGradHome" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor={brand.gold} />
                <Stop offset="100%" stopColor={brand.emerald} />
              </SvgGradient>
            </Defs>
            <Circle cx="38" cy="38" r={RING} stroke={c.surfaceAlt} strokeWidth="8" fill="none" />
            <Circle
              cx="38" cy="38" r={RING}
              stroke="url(#ringGradHome)" strokeWidth="8" fill="none"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - pct / 100)}
              strokeLinecap="round"
              rotation="-90" origin="38,38"
            />
          </Svg>
          <Text style={[styles.pct, { color: c.text }]}>{goal.percent}%</Text>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 22, overflow: 'hidden' },
  hero: { height: 120, justifyContent: 'space-between' },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 12 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.35)', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20 },
  tagText: { color: '#FFF', fontSize: 9.5, fontWeight: '900', letterSpacing: 0.8 },
  heroBottom: { paddingHorizontal: 14, paddingBottom: 12 },
  heroTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', letterSpacing: -0.4 },
  heroSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600', marginTop: 2 },
  body: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14 },
  amount: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  of: { fontSize: 12.5, fontWeight: '600' },
  track: { height: 7, borderRadius: 4, overflow: 'hidden', marginTop: 10 },
  coachRow: { flexDirection: 'row', gap: 6, marginTop: 10, alignItems: 'flex-start' },
  coach: { flex: 1, fontSize: 12.5, fontWeight: '600', lineHeight: 17, fontStyle: 'italic' },
  ringWrap: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center' },
  pct: { position: 'absolute', fontSize: 15, fontWeight: '900', letterSpacing: -0.4 },
});
