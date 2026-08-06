import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Image, ScrollView, TextInput,
  ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform
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
  const { goals, streak, currency, exchangeRates, enableConversion, contributeToGoal, fetchGoalTimeline, fetchCoachMessage } = useStore();
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

  const bg = isDark ? '#0C0E14' : '#F6F1E7';
  const cardBg = isDark ? '#161923' : '#FFFFFF';
  const textPrimary = isDark ? '#EDEAE1' : '#211C13';
  const textSecondary = isDark ? '#9A98A6' : '#726A57';
  const glassBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(20,16,8,0.035)';
  const glassBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(20,16,8,0.09)';
  const ringTrack = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(20,16,8,0.08)';

  if (!goal) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }]}>
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
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.headerBtn, { backgroundColor: cardBg }]}>
          <Ionicons name="chevron-back" size={20} color={textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textPrimary }]} numberOfLines={1}>{goal.title}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.heroWrap}>
          {goal.imageUrl ? (
            <Image source={{ uri: goal.imageUrl }} style={styles.heroImage} />
          ) : (
            <LinearGradient colors={isDark ? ['#3a3226', '#181510'] : ['#EFE6D4', '#DDD0B4']} style={styles.heroImage}>
              <Text style={{ fontSize: 44 }}>{goal.emoji}</Text>
            </LinearGradient>
          )}
        </View>

        {/* Ring */}
        <View style={styles.ringSection}>
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
          <View style={styles.ringCenterAbs}>
            <Text style={[styles.ringPercentBig, { color: textPrimary }]}>{goal.percent}%</Text>
            <Text style={[styles.ringSubLabel, { color: textSecondary }]}>saved</Text>
          </View>
        </View>

        <View style={styles.bigStatsRow}>
          <View style={styles.bigStat}>
            <Text style={[styles.bigStatValue, { color: textPrimary }]}>{formatCurrency(goal.savedAmount, currency, enableConversion ? exchangeRates : null)}</Text>
            <Text style={[styles.bigStatLabel, { color: textSecondary }]}>Saved</Text>
          </View>
          <View style={styles.bigStat}>
            <Text style={[styles.bigStatValue, { color: textPrimary }]}>{formatCurrency(remaining, currency, enableConversion ? exchangeRates : null)}</Text>
            <Text style={[styles.bigStatLabel, { color: textSecondary }]}>Remaining</Text>
          </View>
        </View>

        {/* AI Coach */}
        {!!coachLine && (
          <View style={[styles.glassCard, { backgroundColor: glassBg, borderColor: glassBorder }]}>
            <Text style={[styles.eyebrow, { color: GOLD }]}>AI Coach</Text>
            <Text style={[styles.coachText, { color: textPrimary }]}>"{coachLine}"</Text>
          </View>
        )}

        {/* Add to goal */}
        <View style={[styles.glassCard, { backgroundColor: glassBg, borderColor: glassBorder }]}>
          {showAddInput ? (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={styles.addRow}>
                <TextInput
                  value={addAmount}
                  onChangeText={setAddAmount}
                  placeholder="Amount"
                  placeholderTextColor={textSecondary}
                  keyboardType="decimal-pad"
                  style={[styles.addInput, { color: textPrimary, borderColor: glassBorder }]}
                  autoFocus
                />
                <TouchableOpacity onPress={handleContribute} disabled={isContributing} style={styles.addConfirmBtn}>
                  <LinearGradient colors={[GOLD, EMERALD]} style={styles.addConfirmGradient}>
                    {isContributing ? <ActivityIndicator color="#FFF" size="small" /> : <Ionicons name="checkmark" size={18} color="#FFF" />}
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowAddInput(false)} style={styles.addCancelBtn}>
                  <Ionicons name="close" size={18} color={textSecondary} />
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          ) : (
            <TouchableOpacity onPress={() => setShowAddInput(true)} style={styles.addToGoalBtn}>
              <Ionicons name="add-circle" size={20} color={GOLD} />
              <Text style={[styles.addToGoalText, { color: textPrimary }]}>Add to this goal</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Streak */}
        {streak && streak.currentStreak > 0 && (
          <View style={[styles.glassCard, { backgroundColor: glassBg, borderColor: glassBorder, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
            <Text style={{ fontSize: 28 }}>🔥</Text>
            <View>
              <Text style={[styles.streakBig, { color: textPrimary }]}>{streak.currentStreak} day streak</Text>
              <Text style={[styles.streakSub, { color: textSecondary }]}>Longest: {streak.longestStreak} days</Text>
            </View>
          </View>
        )}

        {/* Milestones */}
        <View style={[styles.glassCard, { backgroundColor: glassBg, borderColor: glassBorder }]}>
          <Text style={[styles.eyebrow, { color: GOLD }]}>Milestones</Text>
          <View style={styles.milestoneRow}>
            {MILESTONES.map(m => {
              const reached = goal.milestonesReached.includes(m) || goal.percent >= m;
              return (
                <View key={m} style={styles.milestoneItem}>
                  {reached ? (
                    <LinearGradient colors={[GOLD, EMERALD]} style={styles.milestoneCircle} />
                  ) : (
                    <View style={[styles.milestoneCircle, { backgroundColor: ringTrack }]} />
                  )}
                  <Text style={[styles.milestoneLabel, { color: textSecondary }]}>{m}%</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Timeline */}
        <View style={[styles.glassCard, { backgroundColor: glassBg, borderColor: glassBorder }]}>
          <Text style={[styles.eyebrow, { color: GOLD }]}>Timeline</Text>
          {isLoadingTimeline ? (
            <ActivityIndicator color={GOLD} style={{ marginTop: 12 }} />
          ) : timeline.length === 0 ? (
            <Text style={{ color: textSecondary, fontSize: 13, marginTop: 8 }}>No contributions yet — add to this goal to start your timeline.</Text>
          ) : (
            <View style={styles.timeline}>
              {timeline.map((entry, i) => (
                <View key={entry._id} style={styles.timelineItem}>
                  <View style={[styles.timelineDot, { backgroundColor: GOLD }]} />
                  {i < timeline.length - 1 && <View style={[styles.timelineLine, { backgroundColor: ringTrack }]} />}
                  <View style={{ flex: 1, paddingBottom: 16 }}>
                    <Text style={[styles.timelineAmount, { color: textPrimary }]}>
                      {entry.amount >= 0 ? '+' : ''}{formatCurrency(entry.amount, currency, enableConversion ? exchangeRates : null)}
                    </Text>
                    <Text style={[styles.timelineDate, { color: textSecondary }]}>
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
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.celebrationOverlay} pointerEvents="none">
          <Animated.View entering={ZoomIn.springify()} style={[styles.celebrationCard, { backgroundColor: cardBg }]}>
            <LinearGradient colors={[GOLD, EMERALD]} style={styles.celebrationBadge}>
              <Text style={{ fontSize: 32 }}>🎉</Text>
            </LinearGradient>
            <Text style={[styles.celebrationTitle, { color: textPrimary }]}>{celebration}% reached!</Text>
            <Text style={[styles.celebrationSub, { color: textSecondary }]}>{goal.title} is getting closer.</Text>
          </Animated.View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 },
  headerBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', marginHorizontal: 8 },

  heroWrap: { height: 190, marginHorizontal: 20, borderRadius: 20, overflow: 'hidden' },
  heroImage: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },

  ringSection: { alignItems: 'center', justifyContent: 'center', marginTop: -40 },
  ringCenterAbs: { position: 'absolute', alignItems: 'center' },
  ringPercentBig: { fontSize: 30, fontWeight: '800' },
  ringSubLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },

  bigStatsRow: { flexDirection: 'row', justifyContent: 'center', gap: 40, marginTop: 8, marginBottom: 20 },
  bigStat: { alignItems: 'center' },
  bigStatValue: { fontSize: 17, fontWeight: '800' },
  bigStatLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },

  glassCard: { marginHorizontal: 20, marginBottom: 14, borderRadius: 16, borderWidth: 1, padding: 16 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  coachText: { fontSize: 15, fontStyle: 'italic', fontWeight: '600', lineHeight: 21 },

  addToGoalBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center' },
  addToGoalText: { fontSize: 15, fontWeight: '700' },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addInput: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, fontWeight: '600' },
  addConfirmBtn: { borderRadius: 12, overflow: 'hidden' },
  addConfirmGradient: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  addCancelBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  streakBig: { fontSize: 16, fontWeight: '800' },
  streakSub: { fontSize: 12, marginTop: 2 },

  milestoneRow: { flexDirection: 'row', justifyContent: 'space-between' },
  milestoneItem: { alignItems: 'center', gap: 4 },
  milestoneCircle: { width: 28, height: 28, borderRadius: 14 },
  milestoneLabel: { fontSize: 9.5, fontWeight: '600' },

  timeline: { marginTop: 6 },
  timelineItem: { flexDirection: 'row', position: 'relative', paddingLeft: 4 },
  timelineDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5, marginRight: 12 },
  timelineLine: { position: 'absolute', left: 7.5, top: 14, bottom: 0, width: 1.5 },
  timelineAmount: { fontSize: 14, fontWeight: '700' },
  timelineDate: { fontSize: 11.5, marginTop: 2 },

  celebrationOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  celebrationCard: { borderRadius: 24, padding: 32, alignItems: 'center', width: 260 },
  celebrationBadge: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  celebrationTitle: { fontSize: 22, fontWeight: '800' },
  celebrationSub: { fontSize: 13, marginTop: 6, textAlign: 'center' },
});
