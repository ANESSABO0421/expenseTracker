import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, Image, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Animated, {
  FadeIn, FadeOut, ZoomIn, FadeInDown,
  useSharedValue, withRepeat, withSequence, withTiming, useAnimatedStyle, Easing,
} from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { useStore, GoalContribution } from '../store/useStore';
import { formatCurrency, toBaseAmount, toDisplayAmount } from '../utils/formatCurrency';
import { useTheme, brand, radius, shadow, CURRENCY_SYMBOLS } from '../theme';
import { IconButton, PressableScale, PrimaryButton } from '../components/ui';

const GOAL_GRADIENT = [brand.gold, brand.emerald] as const;
const MILESTONES = [5, 10, 25, 50, 75, 90, 100];
const RING_RADIUS = 58;
const RING_CIRC = 2 * Math.PI * RING_RADIUS;

export default function GoalDetailScreen({ route, navigation }: any) {
  const { goalId } = route.params;
  const { goals, streak, currency, exchangeRates, enableConversion, contributeToGoal, fetchGoalTimeline, fetchCoachMessage, deleteGoal } = useStore();
  const { c, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const rates = enableConversion ? exchangeRates : null;
  const fmt = (n: number) => formatCurrency(n, currency, rates);
  const symbol = CURRENCY_SYMBOLS[currency] || currency;

  const goal = goals.find(g => g._id === goalId);

  const [timeline, setTimeline] = useState<GoalContribution[]>([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(true);
  const [coachLine, setCoachLine] = useState(goal?.lastCoachMessage || '');
  const [addAmount, setAddAmount] = useState('');
  const [isContributing, setIsContributing] = useState(false);
  const [showAddInput, setShowAddInput] = useState(false);
  const [celebration, setCelebration] = useState<number | null>(null);

  const fireScale = useSharedValue(1);
  useEffect(() => {
    fireScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 700, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 700, easing: Easing.in(Easing.ease) }),
      ), -1, false);
  }, []);
  const fireStyle = useAnimatedStyle(() => ({ transform: [{ scale: fireScale.value }] }));

  const loadTimeline = useCallback(async () => {
    setIsLoadingTimeline(true);
    setTimeline(await fetchGoalTimeline(goalId));
    setIsLoadingTimeline(false);
  }, [goalId]);

  useEffect(() => {
    loadTimeline();
    if (!goal?.lastCoachMessage) fetchCoachMessage(goalId).then(msg => msg && setCoachLine(msg));
  }, [goalId]);

  if (!goal) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor: c.bg }]}>
        <ActivityIndicator color={brand.gold} size="large" />
      </SafeAreaView>
    );
  }

  const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
  const pct = goal.percent;
  const daysLeft = goal.deadline ? Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000)) : null;
  const reachedCount = MILESTONES.filter(m => goal.milestonesReached.includes(m) || pct >= m).length;

  const handleDeleteGoal = () => {
    Alert.alert('Delete goal', `Delete "${goal.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => { if (await deleteGoal(goalId)) navigation.goBack(); },
      },
    ]);
  };

  const handleContribute = async () => {
    const amt = Number(addAmount);
    if (!amt || amt <= 0) {
      Toast.show({ type: 'error', text1: 'Enter an amount' });
      return;
    }
    setIsContributing(true);
    // Typed in the display currency; stored in the base currency
    const result = await contributeToGoal(goalId, toBaseAmount(amt, currency, rates), { source: 'manual' });
    setIsContributing(false);
    setAddAmount('');
    setShowAddInput(false);
    if (result) {
      Toast.show({ type: 'success', text1: 'Added! 🎯', text2: `${result.goal.percent}% saved toward ${goal.title}.` });
      if (result.milestonesCrossed.length > 0) {
        setCelebration(Math.max(...result.milestonesCrossed));
        setTimeout(() => setCelebration(null), 2200);
      }
      loadTimeline();
    }
  };

  const quickAdds = [
    { v: goal.requiredDaily, label: 'day' },
    { v: goal.requiredWeekly, label: 'week' },
    { v: goal.requiredMonthly, label: 'month' },
  ].filter(q => q.v > 0).map(q => ({ ...q, v: Math.ceil(toDisplayAmount(q.v, currency, rates)) }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <IconButton icon="chevron-back" onPress={() => navigation.goBack()} />
          <Text style={[styles.headerTitle, { color: c.text }]} numberOfLines={1}>{goal.title}</Text>
          <IconButton icon="trash-outline" color={brand.expense} onPress={handleDeleteGoal} />
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Hero */}
          <View style={styles.px}>
            <View style={styles.hero}>
              {goal.imageUrl ? (
                <Image source={{ uri: goal.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : (
                <LinearGradient colors={isDark ? ['#3A2E22', '#1A1510'] : ['#FFE7D6', '#FFD0B5']} style={[StyleSheet.absoluteFill, styles.center]}>
                  <Text style={{ fontSize: 72 }}>{goal.emoji}</Text>
                </LinearGradient>
              )}
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} start={{ x: 0, y: 0.4 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
              <View style={styles.heroBottom}>
                <Text style={styles.heroLabel}>TARGET</Text>
                <Text style={styles.heroTarget}>{fmt(goal.targetAmount)}</Text>
              </View>
              {daysLeft !== null && (
                <View style={styles.heroPill}>
                  <Ionicons name="time" size={12} color="#FFF" />
                  <Text style={styles.heroPillText}>{daysLeft} days left</Text>
                </View>
              )}
            </View>

            {/* Progress card */}
            <Animated.View entering={FadeInDown.duration(450)} style={[styles.progressCard, { backgroundColor: c.surface }, shadow(c, 2)]}>
              <View style={styles.ringRow}>
                <View style={styles.ringWrap}>
                  <Svg width={140} height={140} viewBox="0 0 140 140">
                    <Defs>
                      <SvgGradient id="ringGradDetail" x1="0" y1="0" x2="1" y2="1">
                        <Stop offset="0%" stopColor={brand.gold} />
                        <Stop offset="100%" stopColor={brand.emerald} />
                      </SvgGradient>
                    </Defs>
                    <Circle cx="70" cy="70" r={RING_RADIUS} stroke={c.surfaceAlt} strokeWidth="13" fill="none" />
                    <Circle
                      cx="70" cy="70" r={RING_RADIUS}
                      stroke="url(#ringGradDetail)" strokeWidth="13" fill="none"
                      strokeDasharray={RING_CIRC}
                      strokeDashoffset={RING_CIRC * (1 - Math.min(100, pct) / 100)}
                      strokeLinecap="round"
                      rotation="-90" origin="70,70"
                    />
                  </Svg>
                  <View style={[StyleSheet.absoluteFill, styles.center]}>
                    <Text style={[styles.ringPct, { color: c.text }]}>{pct}%</Text>
                    <Text style={[styles.ringLabel, { color: c.textSecondary }]}>SAVED</Text>
                  </View>
                </View>

                <View style={{ flex: 1, gap: 12 }}>
                  <Stat label="Saved" value={fmt(goal.savedAmount)} color={brand.emerald} />
                  <View style={[styles.divider, { backgroundColor: c.divider }]} />
                  <Stat label="Still need" value={fmt(remaining)} color={c.textSecondary} />
                  {goal.deadline && (
                    <>
                      <View style={[styles.divider, { backgroundColor: c.divider }]} />
                      <Stat label="Deadline" small color={brand.gold}
                        value={new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} />
                    </>
                  )}
                </View>
              </View>

              {goal.requiredMonthly > 0 && (
                <View style={[styles.paceRow, { backgroundColor: c.surfaceAlt }]}>
                  {[
                    { l: 'Daily', v: goal.requiredDaily },
                    { l: 'Weekly', v: goal.requiredWeekly },
                    { l: 'Monthly', v: goal.requiredMonthly },
                  ].map((p, i) => (
                    <React.Fragment key={p.l}>
                      {i > 0 && <View style={[styles.paceDivider, { backgroundColor: c.border }]} />}
                      <View style={styles.pace}>
                        <Text style={[styles.paceValue, { color: c.text }]} numberOfLines={1} adjustsFontSizeToFit>{fmt(p.v)}</Text>
                        <Text style={[styles.paceLabel, { color: c.textSecondary }]}>{p.l}</Text>
                      </View>
                    </React.Fragment>
                  ))}
                </View>
              )}
            </Animated.View>
          </View>

          {/* AI coach */}
          {!!coachLine && (
            <View style={[styles.px, { marginTop: 14 }]}>
              <View style={[styles.coach, { backgroundColor: isDark ? 'rgba(212,178,106,0.10)' : '#FFF8EC', borderColor: 'rgba(212,178,106,0.35)' }]}>
                <View style={styles.coachHead}>
                  <LinearGradient colors={GOAL_GRADIENT} style={styles.coachBadge}>
                    <Ionicons name="sparkles" size={13} color="#FFF" />
                  </LinearGradient>
                  <Text style={styles.coachLabel}>AI COACH</Text>
                </View>
                <Text style={[styles.coachText, { color: c.text }]}>“{coachLine}”</Text>
              </View>
            </View>
          )}

          {/* Streak */}
          {streak && streak.currentStreak > 0 && (
            <View style={[styles.px, { marginTop: 14 }]}>
              <LinearGradient
                colors={isDark ? ['#2D1810', '#1A0F08'] : ['#FFF3EA', '#FFE6D5']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={[styles.streak, { borderColor: 'rgba(255,107,53,0.3)' }]}
              >
                <Animated.View style={[styles.fire, fireStyle]}>
                  <Text style={{ fontSize: 28 }}>🔥</Text>
                </Animated.View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.streakCount}>
                    {streak.currentStreak}
                    <Text style={[styles.streakUnit, { color: c.text }]}> day{streak.currentStreak !== 1 ? 's' : ''}</Text>
                  </Text>
                  <Text style={styles.streakLabel}>SAVING STREAK</Text>
                  <View style={styles.streakBars}>
                    {Array.from({ length: 7 }).map((_, i) => (
                      <View key={i} style={[styles.streakBar, { backgroundColor: i >= 7 - streak.currentStreak ? brand.fire : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)') }]} />
                    ))}
                  </View>
                </View>
                <View style={[styles.best, { backgroundColor: 'rgba(255,107,53,0.14)' }]}>
                  <Text style={styles.bestLabel}>BEST</Text>
                  <Text style={[styles.bestValue, { color: c.text }]}>{streak.longestStreak}</Text>
                  <Text style={[styles.bestUnit, { color: c.textSecondary }]}>days</Text>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Milestones */}
          <View style={[styles.px, { marginTop: 14 }]}>
            <View style={[styles.panel, { backgroundColor: c.surface }, shadow(c, 1)]}>
              <View style={styles.panelHead}>
                <Text style={[styles.panelTitle, { color: c.text }]}>Milestones</Text>
                <Text style={[styles.panelMeta, { color: c.textSecondary }]}>{reachedCount}/{MILESTONES.length}</Text>
              </View>
              <View style={styles.milestones}>
                <View style={[styles.milestoneLine, { backgroundColor: c.surfaceAlt }]} />
                {MILESTONES.map((m, idx) => {
                  const reached = goal.milestonesReached.includes(m) || pct >= m;
                  const isNext = !reached && (idx === 0 || pct >= MILESTONES[idx - 1]);
                  return (
                    <View key={m} style={styles.milestone}>
                      {reached ? (
                        <LinearGradient colors={GOAL_GRADIENT} style={styles.milestoneDot}>
                          <Ionicons name="checkmark" size={15} color="#FFF" />
                        </LinearGradient>
                      ) : (
                        <View style={[styles.milestoneDot, {
                          backgroundColor: isNext ? 'rgba(212,178,106,0.15)' : c.surfaceAlt,
                          borderWidth: isNext ? 1.5 : 0, borderColor: brand.gold,
                        }]}>
                          {isNext && <View style={styles.nextDot} />}
                        </View>
                      )}
                      <Text style={[styles.milestoneText, { color: reached ? c.text : c.textTertiary }]}>{m}%</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Timeline */}
          <View style={[styles.px, { marginTop: 14 }]}>
            <View style={[styles.panel, { backgroundColor: c.surface }, shadow(c, 1)]}>
              <View style={styles.panelHead}>
                <Text style={[styles.panelTitle, { color: c.text }]}>Contributions</Text>
                <Text style={[styles.panelMeta, { color: c.textSecondary }]}>{timeline.length}</Text>
              </View>
              {isLoadingTimeline ? (
                <ActivityIndicator color={brand.gold} style={{ marginVertical: 20 }} />
              ) : timeline.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <Text style={{ fontSize: 30, marginBottom: 8 }}>🌱</Text>
                  <Text style={[styles.emptyText, { color: c.textSecondary }]}>No contributions yet.{'\n'}Every journey starts with the first deposit.</Text>
                </View>
              ) : (
                timeline.map((entry, i) => (
                  <View key={entry._id} style={{ flexDirection: 'row', gap: 14 }}>
                    <View style={{ alignItems: 'center', width: 14 }}>
                      <LinearGradient colors={GOAL_GRADIENT} style={styles.tlDot} />
                      {i < timeline.length - 1 && <View style={[styles.tlLine, { backgroundColor: c.surfaceAlt }]} />}
                    </View>
                    <View style={[styles.tlBody, i < timeline.length - 1 && { paddingBottom: 18 }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.tlAmount}>{entry.amount >= 0 ? '+' : ''}{fmt(entry.amount)}</Text>
                        <Text style={[styles.tlDate, { color: c.textSecondary }]}>
                          {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Text>
                      </View>
                      <View style={[styles.tlTotal, { backgroundColor: 'rgba(72,199,154,0.12)' }]}>
                        <Text style={styles.tlTotalText}>{fmt(entry.runningTotal)}</Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        </ScrollView>

        {/* Sticky add-money bar */}
        <View style={[styles.bottomBar, { backgroundColor: c.surface, borderTopColor: c.border, paddingBottom: Math.max(insets.bottom, 14) }]}>
          {showAddInput ? (
            <Animated.View entering={FadeIn.duration(180)}>
              {quickAdds.length > 0 && (
                <View style={styles.quickRow}>
                  {quickAdds.map(q => (
                    <PressableScale key={q.label} onPress={() => setAddAmount(String(q.v))} style={[styles.quick, { borderColor: c.border }]}>
                      <Text style={[styles.quickText, { color: c.text }]}>{symbol}{q.v}</Text>
                      <Text style={[styles.quickSub, { color: c.textTertiary }]}>per {q.label}</Text>
                    </PressableScale>
                  ))}
                </View>
              )}
              <View style={styles.addRow}>
                <View style={[styles.addInput, { backgroundColor: c.surfaceAlt }]}>
                  <Text style={[styles.addSymbol, { color: brand.gold }]}>{symbol}</Text>
                  <TextInput
                    value={addAmount}
                    onChangeText={setAddAmount}
                    placeholder="Amount"
                    placeholderTextColor={c.textTertiary}
                    keyboardType="decimal-pad"
                    autoFocus
                    selectionColor={brand.gold}
                    style={[styles.addText, { color: c.text }]}
                  />
                </View>
                <IconButton icon="close" tint={c.surfaceAlt} onPress={() => setShowAddInput(false)} />
                <PrimaryButton title="Add" onPress={handleContribute} loading={isContributing} colors={GOAL_GRADIENT} />
              </View>
            </Animated.View>
          ) : (
            <PrimaryButton title="Add money to this goal" icon="add-circle" onPress={() => setShowAddInput(true)} colors={GOAL_GRADIENT} />
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Milestone celebration */}
      {celebration !== null && (
        <Animated.View entering={FadeIn} exiting={FadeOut} pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
          <Animated.View entering={ZoomIn.springify().damping(12)} style={[styles.celebrate, { backgroundColor: c.surface }]}>
            <LinearGradient colors={GOAL_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.celebrateTop}>
              <Text style={{ fontSize: 54 }}>🎉</Text>
              <Text style={styles.celebrateTitle}>{celebration}% reached!</Text>
            </LinearGradient>
            <Text style={[styles.celebrateBody, { color: c.textSecondary }]}>
              {goal.title} is getting closer — keep the momentum going! 🚀
            </Text>
          </Animated.View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

function Stat({ label, value, color, small }: { label: string; value: string; color: string; small?: boolean }) {
  const { c } = useTheme();
  return (
    <View>
      <Text style={[styles.statLabel, { color }]}>{label.toUpperCase()}</Text>
      <Text style={[styles.statValue, { color: c.text, fontSize: small ? 14.5 : 19 }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  px: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800' },

  hero: { height: 220, borderRadius: 26, overflow: 'hidden' },
  heroBottom: { position: 'absolute', left: 18, bottom: 46 },
  heroLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  heroTarget: { color: '#FFF', fontSize: 26, fontWeight: '900', letterSpacing: -0.6 },
  heroPill: { position: 'absolute', top: 14, right: 14, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  heroPillText: { color: '#FFF', fontSize: 12, fontWeight: '800' },

  progressCard: { marginTop: -34, marginHorizontal: 8, borderRadius: 24, padding: 18 },
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  ringWrap: { width: 140, height: 140 },
  ringPct: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  ringLabel: { fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2, marginTop: 1 },
  divider: { height: StyleSheet.hairlineWidth },
  statLabel: { fontSize: 10.5, fontWeight: '900', letterSpacing: 0.9, marginBottom: 2 },
  statValue: { fontWeight: '900', letterSpacing: -0.3 },
  paceRow: { flexDirection: 'row', borderRadius: 16, paddingVertical: 12, marginTop: 16 },
  pace: { flex: 1, alignItems: 'center', paddingHorizontal: 6 },
  paceValue: { fontSize: 14.5, fontWeight: '900' },
  paceLabel: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  paceDivider: { width: 1 },

  coach: { borderRadius: 20, padding: 16, borderWidth: 1 },
  coachHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  coachBadge: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  coachLabel: { color: brand.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  coachText: { fontSize: 15, fontStyle: 'italic', fontWeight: '600', lineHeight: 22 },

  streak: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 22, padding: 16, borderWidth: 1.5 },
  fire: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(255,107,53,0.18)', alignItems: 'center', justifyContent: 'center' },
  streakCount: { color: brand.fire, fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  streakUnit: { fontSize: 15, fontWeight: '800' },
  streakLabel: { color: brand.fire, fontSize: 10.5, fontWeight: '900', letterSpacing: 1 },
  streakBars: { flexDirection: 'row', gap: 4, marginTop: 9 },
  streakBar: { flex: 1, height: 5, borderRadius: 3 },
  best: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' },
  bestLabel: { color: brand.fire, fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
  bestValue: { fontSize: 20, fontWeight: '900' },
  bestUnit: { fontSize: 10, fontWeight: '700' },

  panel: { borderRadius: 22, padding: 18 },
  panelHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  panelTitle: { fontSize: 16, fontWeight: '900' },
  panelMeta: { fontSize: 13, fontWeight: '800' },
  milestones: { flexDirection: 'row', justifyContent: 'space-between' },
  milestoneLine: { position: 'absolute', left: 16, right: 16, top: 15, height: 3, borderRadius: 2 },
  milestone: { alignItems: 'center', gap: 6, flex: 1 },
  milestoneDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  nextDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: brand.gold },
  milestoneText: { fontSize: 10.5, fontWeight: '800' },

  emptyText: { fontSize: 13.5, fontWeight: '600', textAlign: 'center', lineHeight: 20 },
  tlDot: { width: 14, height: 14, borderRadius: 7, marginTop: 4 },
  tlLine: { flex: 1, width: 2, marginTop: 4 },
  tlBody: { flex: 1, flexDirection: 'row', alignItems: 'flex-start' },
  tlAmount: { color: brand.emerald, fontSize: 16, fontWeight: '900' },
  tlDate: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  tlTotal: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 },
  tlTotalText: { color: brand.emerald, fontSize: 11.5, fontWeight: '800' },

  bottomBar: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  quick: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 8, alignItems: 'center' },
  quickText: { fontSize: 14, fontWeight: '900' },
  quickSub: { fontSize: 10.5, fontWeight: '700', marginTop: 1 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  addInput: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.md, paddingHorizontal: 14, height: 54 },
  addSymbol: { fontSize: 20, fontWeight: '900' },
  addText: { flex: 1, fontSize: 20, fontWeight: '900', paddingVertical: 0 },

  celebrate: { width: 290, borderRadius: 28, overflow: 'hidden' },
  celebrateTop: { paddingVertical: 30, alignItems: 'center' },
  celebrateTitle: { color: '#FFF', fontSize: 26, fontWeight: '900', marginTop: 8, letterSpacing: -0.5 },
  celebrateBody: { fontSize: 15, fontWeight: '600', textAlign: 'center', lineHeight: 21, padding: 20 },
});
