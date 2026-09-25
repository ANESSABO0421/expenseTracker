import React, { useMemo, useState } from 'react';
import { View, Text, Image, Modal, StyleSheet, ScrollView, Alert, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useStore } from '../store/useStore';
import { useTheme, brand, radius, shadow } from '../theme';
import { IconButton, PressableScale, Toggle } from '../components/ui';

type IconName = keyof typeof Ionicons.glyphMap;

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
];

interface RowProps { icon: IconName; color: string; label: string; value?: string; onPress?: () => void; right?: React.ReactNode; destructive?: boolean; last?: boolean }

function SettingRow({ icon, color, label, value, onPress, right, destructive, last }: RowProps) {
  const { c } = useTheme();
  return (
    <PressableScale onPress={onPress} disabled={!onPress && !right} scaleTo={0.98} style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: color + '1A' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={[styles.rowBody, !last && { borderBottomColor: c.divider, borderBottomWidth: StyleSheet.hairlineWidth }]}>
        <Text style={[styles.rowLabel, { color: destructive ? brand.expense : c.text }]}>{label}</Text>
        {value ? <Text style={[styles.rowValue, { color: c.textSecondary }]}>{value}</Text> : null}
        {right ?? (onPress ? <Ionicons name="chevron-forward" size={16} color={c.textTertiary} /> : null)}
      </View>
    </PressableScale>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={{ marginTop: 22 }}>
      <Text style={[styles.groupTitle, { color: c.textSecondary }]}>{title}</Text>
      <View style={[styles.group, { backgroundColor: c.surface }, shadow(c, 1)]}>{children}</View>
    </View>
  );
}

export default function ProfileScreen({ navigation }: any) {
  const { user, logout, currency, baseCurrency, setCurrency, enableConversion, setEnableConversion, transactions, goals, streak } = useStore();
  const { c, isDark, toggle } = useTheme();
  const insets = useSafeAreaInsets();
  const [sheetOpen, setSheetOpen] = useState(false);

  const activeGoals = useMemo(() => goals.filter(g => g.status === 'active'), [goals]);
  const primaryGoal = activeGoals.find(g => g.isPrimary) || activeGoals[0];
  const initials = (user?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const currentCurrency = CURRENCIES.find(x => x.code === currency);

  const confirmLogout = () => {
    Alert.alert('Sign out?', 'You can sign back in any time.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      <View style={styles.header}>
        <IconButton icon="chevron-back" onPress={() => navigation.goBack()} />
        <Text style={[styles.headerTitle, { color: c.text }]}>Profile</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 130 }}>
        {/* Profile card */}
        <LinearGradient colors={c.heroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
          <View style={[styles.blob, { width: 200, height: 200, top: -90, right: -60 }]} />
          <View style={styles.cardTop}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.initials}>{initials}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>{user?.name || 'Guest User'}</Text>
              <Text style={styles.email} numberOfLines={1}>{user?.email || 'guest@mail.com'}</Text>
              <View style={styles.verified}>
                <Ionicons name="shield-checkmark" size={11} color="#FFF" />
                <Text style={styles.verifiedText}>VERIFIED</Text>
              </View>
            </View>
          </View>
          <View style={styles.stats}>
            {[
              { label: 'Transactions', value: transactions.length },
              { label: 'Active goals', value: activeGoals.length },
              { label: 'Best streak', value: `${streak?.longestStreak ?? 0}d` },
            ].map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <View style={styles.statDivider} />}
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </LinearGradient>

        <Group title="PREFERENCES">
          <SettingRow icon="cash-outline" color="#2E90FA" label="Currency"
            value={currentCurrency ? `${currentCurrency.flag}  ${currency}` : currency}
            onPress={() => setSheetOpen(true)} />
          <SettingRow icon="swap-horizontal" color={brand.income} label="Convert amounts"
            value={enableConversion ? `from ${baseCurrency}` : undefined}
            right={<Toggle value={enableConversion} onChange={setEnableConversion} />} />
          <SettingRow icon={isDark ? 'moon' : 'sunny'} color={isDark ? '#FDB022' : brand.violet} label="Dark mode" last
            right={<Toggle value={isDark} onChange={toggle} />} />
        </Group>

        <Group title="TOOLS">
          <SettingRow icon="sparkles" color={brand.primary} label="AI assistant" onPress={() => navigation.navigate('ChatAssistant')} />
          <SettingRow icon="flag" color={brand.gold} label="Savings goal"
            value={primaryGoal ? primaryGoal.title : 'Create'}
            onPress={() => primaryGoal ? navigation.navigate('GoalDetail', { goalId: primaryGoal._id }) : navigation.navigate('GoalCreation')} />
          <SettingRow icon="scan" color="#06AED4" label="Scan a receipt" last
            onPress={() => navigation.navigate('AddTransaction', { type: 'expense', action: 'scan' })} />
        </Group>

        <Group title="ACCOUNT">
          <SettingRow icon="log-out-outline" color={brand.expense} label="Sign out" destructive last onPress={confirmLogout} />
        </Group>

        <Text style={[styles.footer, { color: c.textTertiary }]}>Spendova · Intelligent wealth</Text>
      </ScrollView>

      {/* Currency bottom sheet */}
      <Modal visible={sheetOpen} transparent animationType="none" onRequestClose={() => setSheetOpen(false)}>
        {sheetOpen && (
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <Animated.View entering={FadeIn.duration(200)} style={[StyleSheet.absoluteFill, { backgroundColor: c.overlay }]}>
              <Pressable style={{ flex: 1 }} onPress={() => setSheetOpen(false)} />
            </Animated.View>
            <Animated.View entering={SlideInDown.springify().damping(20)} style={[styles.sheet, { backgroundColor: c.surface, paddingBottom: insets.bottom + 16 }]}>
              <View style={[styles.handle, { backgroundColor: c.border }]} />
              <Text style={[styles.sheetTitle, { color: c.text }]}>Choose currency</Text>
              {CURRENCIES.map(item => {
                const active = currency === item.code;
                return (
                  <PressableScale
                    key={item.code}
                    scaleTo={0.98}
                    onPress={() => { setCurrency(item.code); setSheetOpen(false); }}
                    style={[styles.currencyRow, active && { backgroundColor: c.primarySoft }]}
                  >
                    <Text style={{ fontSize: 24 }}>{item.flag}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.currencyCode, { color: c.text }]}>{item.code}</Text>
                      <Text style={[styles.currencyName, { color: c.textSecondary }]}>{item.name}</Text>
                    </View>
                    <Text style={[styles.currencySymbol, { color: c.textSecondary }]}>{item.symbol}</Text>
                    <View style={[styles.radio, { borderColor: active ? brand.primary : c.border }]}>
                      {active && <View style={styles.radioDot} />}
                    </View>
                  </PressableScale>
                );
              })}
            </Animated.View>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14 },
  headerTitle: { fontSize: 17, fontWeight: '800' },

  card: { borderRadius: 26, padding: 20, overflow: 'hidden' },
  blob: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 68, height: 68, borderRadius: 34, borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)' },
  avatarFallback: { backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  name: { color: '#FFF', fontSize: 21, fontWeight: '900', letterSpacing: -0.4 },
  email: { color: 'rgba(255,255,255,0.85)', fontSize: 13.5, fontWeight: '500', marginTop: 2 },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: 'rgba(0,0,0,0.18)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 7 },
  verifiedText: { color: '#FFF', fontSize: 9.5, fontWeight: '900', letterSpacing: 0.8 },
  stats: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.14)', borderRadius: 18, paddingVertical: 14, marginTop: 18 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { color: '#FFF', fontSize: 19, fontWeight: '900' },
  statLabel: { color: 'rgba(255,255,255,0.78)', fontSize: 11.5, fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },

  groupTitle: { fontSize: 11.5, fontWeight: '800', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  group: { borderRadius: radius.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, gap: 14 },
  rowIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowBody: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 15, paddingRight: 16 },
  rowLabel: { flex: 1, fontSize: 15.5, fontWeight: '700' },
  rowValue: { fontSize: 14, fontWeight: '600', maxWidth: 150 },
  footer: { textAlign: 'center', fontSize: 12, fontWeight: '600', marginTop: 28 },

  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 12, paddingTop: 10 },
  handle: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 14 },
  sheetTitle: { fontSize: 19, fontWeight: '900', paddingHorizontal: 12, marginBottom: 8 },
  currencyRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 16 },
  currencyCode: { fontSize: 16, fontWeight: '800' },
  currencyName: { fontSize: 12.5, fontWeight: '500', marginTop: 1 },
  currencySymbol: { fontSize: 15, fontWeight: '700' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: brand.primary },
});
