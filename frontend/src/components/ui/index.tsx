import React, { useEffect } from 'react';
import {
  View, Text, TextInput, ActivityIndicator, StyleSheet, StyleProp, ViewStyle, TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing,
} from 'react-native-reanimated';
import PressableScale from './PressableScale';
import { useTheme, brand, radius, shadow } from '../../theme';
import { categoryMeta } from '../../theme/categories';
import { formatCurrency } from '../../utils/formatCurrency';
import type { Transaction } from '../../store/useStore';

export { PressableScale };

type IconName = keyof typeof Ionicons.glyphMap;

// ── Card ───────────────────────────────────────────────────────────────────
export function Card({ children, style, padded = true }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; padded?: boolean }) {
  const { c } = useTheme();
  return (
    <View style={[{ backgroundColor: c.surface, borderRadius: radius.lg, padding: padded ? 18 : 0 }, shadow(c, 1), style]}>
      {children}
    </View>
  );
}

// ── Icon button (round, used in headers) ───────────────────────────────────
export function IconButton({
  icon, onPress, color, size = 20, style, badge, tint,
}: { icon: IconName; onPress?: () => void; color?: string; size?: number; style?: StyleProp<ViewStyle>; badge?: boolean; tint?: string }) {
  const { c } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      hitSlop={8}
      style={[styles.iconBtn, { backgroundColor: tint ?? c.surface }, shadow(c, 1), style]}
    >
      <Ionicons name={icon} size={size} color={color ?? c.text} />
      {badge && <View style={[styles.badge, { borderColor: tint ?? c.surface }]} />}
    </PressableScale>
  );
}

// ── Buttons ────────────────────────────────────────────────────────────────
export function PrimaryButton({
  title, onPress, loading, disabled, icon, colors, style, trailing,
}: {
  title: string; onPress?: () => void; loading?: boolean; disabled?: boolean; icon?: IconName;
  colors?: readonly [string, string, ...string[]]; style?: StyleProp<ViewStyle>; trailing?: React.ReactNode;
}) {
  return (
    <PressableScale onPress={onPress} disabled={disabled || loading} style={[{ borderRadius: radius.md }, style]} scaleTo={0.97}>
      <LinearGradient
        colors={colors ?? [brand.primary, brand.primaryDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.primaryBtn}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            {icon && <Ionicons name={icon} size={19} color="#FFF" />}
            <Text style={styles.primaryBtnText}>{title}</Text>
            {trailing}
          </>
        )}
      </LinearGradient>
    </PressableScale>
  );
}

export function GhostButton({ title, onPress, icon, color, style }: { title: string; onPress?: () => void; icon?: IconName; color?: string; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  const tint = color ?? c.text;
  return (
    <PressableScale onPress={onPress} style={[styles.ghostBtn, { backgroundColor: c.surfaceAlt }, style]}>
      {icon && <Ionicons name={icon} size={18} color={tint} />}
      <Text style={[styles.ghostBtnText, { color: tint }]}>{title}</Text>
    </PressableScale>
  );
}

// ── Chip ───────────────────────────────────────────────────────────────────
export function Chip({
  label, active, onPress, icon, activeColor,
}: { label: string; active?: boolean; onPress?: () => void; icon?: IconName; activeColor?: string }) {
  const { c } = useTheme();
  const bg = active ? (activeColor ?? c.text) : c.surface;
  const fg = active ? (activeColor ? '#FFF' : c.bg) : c.textSecondary;
  return (
    <PressableScale
      onPress={onPress}
      style={[styles.chip, { backgroundColor: bg, borderColor: active ? bg : c.border }]}
    >
      {icon && <Ionicons name={icon} size={14} color={fg} />}
      <Text style={[styles.chipText, { color: fg }]}>{label}</Text>
    </PressableScale>
  );
}

// ── Segmented control ──────────────────────────────────────────────────────
export function Segmented<T extends string>({
  options, value, onChange, style,
}: { options: { key: T; label: string }[]; value: T; onChange: (v: T) => void; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: c.surfaceAlt }, style]}>
      {options.map(o => {
        const active = o.key === value;
        return (
          <PressableScale
            key={o.key}
            onPress={() => onChange(o.key)}
            style={[styles.segment, active && [{ backgroundColor: c.surface }, shadow(c, 1)]]}
          >
            <Text style={[styles.segmentText, { color: active ? c.text : c.textSecondary }]}>{o.label}</Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

// ── Section header ─────────────────────────────────────────────────────────
export function SectionHeader({
  title, subtitle, action, onAction, style,
}: { title: string; subtitle?: string; action?: string; onAction?: () => void; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  return (
    <View style={[styles.sectionHeader, style]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.sectionSub, { color: c.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      {action ? (
        <PressableScale onPress={onAction} hitSlop={10} style={styles.sectionAction}>
          <Text style={[styles.sectionActionText, { color: brand.primary }]}>{action}</Text>
          <Ionicons name="chevron-forward" size={14} color={brand.primary} />
        </PressableScale>
      ) : null}
    </View>
  );
}

// ── Screen title (large, left aligned) ─────────────────────────────────────
export function ScreenTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={styles.screenTitleRow}>
      <View style={{ flex: 1 }}>
        {subtitle ? <Text style={[styles.screenSub, { color: c.textSecondary }]}>{subtitle}</Text> : null}
        <Text style={[styles.screenTitle, { color: c.text }]}>{title}</Text>
      </View>
      {right ? <View style={{ flexDirection: 'row', gap: 10 }}>{right}</View> : null}
    </View>
  );
}

// ── Category icon ──────────────────────────────────────────────────────────
export function CategoryIcon({ category, size = 44, rounded = 14 }: { category?: string; size?: number; rounded?: number }) {
  const meta = categoryMeta(category);
  return (
    <View style={{
      width: size, height: size, borderRadius: rounded,
      backgroundColor: meta.color + '1F', alignItems: 'center', justifyContent: 'center',
    }}>
      <Ionicons name={meta.icon} size={size * 0.46} color={meta.color} />
    </View>
  );
}

// ── Transaction row ────────────────────────────────────────────────────────
export function TransactionRow({
  t, onPress, currency, rates, showDate = false, last,
}: { t: Transaction; onPress?: () => void; currency: string; rates: Record<string, number> | null; showDate?: boolean; last?: boolean }) {
  const { c } = useTheme();
  const isIncome = t.type === 'income';
  const date = new Date(t.date);
  const meta = showDate
    ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return (
    <PressableScale onPress={onPress} scaleTo={0.98} style={styles.txRow}>
      <CategoryIcon category={t.category} />
      <View style={[styles.txBody, !last && { borderBottomColor: c.divider, borderBottomWidth: StyleSheet.hairlineWidth }]}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={[styles.txTitle, { color: c.text }]} numberOfLines={1}>{t.category}</Text>
          <View style={styles.txMetaRow}>
            <Text style={[styles.txMeta, { color: c.textTertiary }]} numberOfLines={1}>
              {t.description ? `${t.description} · ${meta}` : meta}
            </Text>
            {t.receiptUrl ? <Ionicons name="attach" size={12} color={c.textTertiary} /> : null}
          </View>
        </View>
        <Text style={[styles.txAmount, { color: isIncome ? brand.income : c.text }]}>
          {isIncome ? '+' : '−'}{formatCurrency(t.amount, currency, rates)}
        </Text>
      </View>
    </PressableScale>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────
export function EmptyState({
  icon, title, message, action, onAction, compact,
}: { icon: IconName; title: string; message?: string; action?: string; onAction?: () => void; compact?: boolean }) {
  const { c } = useTheme();
  return (
    <View style={[styles.empty, compact && { paddingVertical: 24 }]}>
      <View style={[styles.emptyIcon, { backgroundColor: c.primarySoft }]}>
        <Ionicons name={icon} size={28} color={brand.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: c.text }]}>{title}</Text>
      {message ? <Text style={[styles.emptyMsg, { color: c.textSecondary }]}>{message}</Text> : null}
      {action ? <PrimaryButton title={action} onPress={onAction} icon="add" style={{ marginTop: 18, alignSelf: 'center' }} /> : null}
    </View>
  );
}

// ── Skeleton (shimmer-style pulse) ─────────────────────────────────────────
export function Skeleton({ width, height, radius: r = 10, style }: { width: number | `${number}%`; height: number; radius?: number; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  const o = useSharedValue(0.5);
  useEffect(() => {
    o.value = withRepeat(withTiming(1, { duration: 750, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, []);
  const a = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ width, height, borderRadius: r, backgroundColor: c.surfaceAlt }, a, style]} />;
}

export function TransactionSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 6 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 14 }}>
          <Skeleton width={44} height={44} radius={14} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width="55%" height={12} />
            <Skeleton width="35%" height={10} />
          </View>
          <Skeleton width={64} height={14} />
        </View>
      ))}
    </View>
  );
}

// ── Search field ───────────────────────────────────────────────────────────
export function SearchField({ style, inputRef, ...props }: TextInputProps & { style?: StyleProp<ViewStyle>; inputRef?: React.Ref<TextInput> }) {
  const { c } = useTheme();
  return (
    <View style={[styles.search, { backgroundColor: c.surface, borderColor: c.border }, style]}>
      <Ionicons name="search" size={18} color={brand.primary} />
      <TextInput
        ref={inputRef}
        placeholderTextColor={c.textTertiary}
        style={[styles.searchInput, { color: c.text }]}
        returnKeyType="search"
        {...props}
      />
      {props.value ? (
        <PressableScale onPress={() => props.onChangeText?.('')} hitSlop={10}>
          <Ionicons name="close-circle" size={18} color={c.textTertiary} />
        </PressableScale>
      ) : null}
    </View>
  );
}

// ── Toggle switch ──────────────────────────────────────────────────────────
export function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const { c } = useTheme();
  const x = useSharedValue(value ? 20 : 2);
  useEffect(() => { x.value = withTiming(value ? 20 : 2, { duration: 180 }); }, [value]);
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <PressableScale onPress={() => onChange(!value)} hitSlop={8}
      style={[styles.toggle, { backgroundColor: value ? brand.income : c.surfaceAlt }]}>
      <Animated.View style={[styles.toggleKnob, knob]} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  iconBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 9, right: 10, width: 9, height: 9, borderRadius: 5, backgroundColor: brand.primary, borderWidth: 2 },
  primaryBtn: { height: 54, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 22 },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
  ghostBtn: { height: 54, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18 },
  ghostBtnText: { fontSize: 15, fontWeight: '700' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 36, borderRadius: radius.pill, borderWidth: 1 },
  chipText: { fontSize: 13.5, fontWeight: '700' },
  segmented: { flexDirection: 'row', borderRadius: 12, padding: 3 },
  segment: { flex: 1, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 9, alignItems: 'center' },
  segmentText: { fontSize: 13, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  sectionSub: { fontSize: 12.5, fontWeight: '500', marginTop: 2 },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingBottom: 2 },
  sectionActionText: { fontSize: 13.5, fontWeight: '800' },
  screenTitleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14 },
  screenTitle: { fontSize: 30, fontWeight: '900', letterSpacing: -0.8 },
  screenSub: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, gap: 14 },
  txBody: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingRight: 16 },
  txTitle: { fontSize: 15.5, fontWeight: '700' },
  txMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  txMeta: { fontSize: 12.5, fontWeight: '500', flexShrink: 1 },
  txAmount: { fontSize: 15.5, fontWeight: '800', fontVariant: ['tabular-nums'] },
  empty: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  emptyIcon: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 17, fontWeight: '800', marginBottom: 6 },
  emptyMsg: { fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 260 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 50, borderRadius: radius.md, borderWidth: 1, paddingHorizontal: 14 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500', paddingVertical: 0 },
  toggle: { width: 46, height: 28, borderRadius: 14, justifyContent: 'center' },
  toggleKnob: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
});
