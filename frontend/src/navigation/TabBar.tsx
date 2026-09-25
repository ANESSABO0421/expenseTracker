import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform, Keyboard, BackHandler, Pressable } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withSequence, interpolateColor,
  FadeIn, FadeOut, FadeInDown, FadeOutDown, ZoomIn,
} from 'react-native-reanimated';
import PressableScale from '../components/ui/PressableScale';
import { useTheme, brand } from '../theme';

type IconName = keyof typeof Ionicons.glyphMap;

// `slot` is the position in a 5-slot row; slot 2 is reserved for the + button.
const TABS: { name: string; label: string; icon: IconName; iconActive: IconName; slot: number }[] = [
  { name: 'Home', label: 'Home', icon: 'home-outline', iconActive: 'home', slot: 0 },
  { name: 'Calendar', label: 'Calendar', icon: 'calendar-clear-outline', iconActive: 'calendar-clear', slot: 1 },
  { name: 'Transactions', label: 'Activity', icon: 'receipt-outline', iconActive: 'receipt', slot: 3 },
  { name: 'Analytics', label: 'Insights', icon: 'pie-chart-outline', iconActive: 'pie-chart', slot: 4 },
];

const QUICK_ADD: { key: string; label: string; sub: string; icon: IconName; color: string; params: object }[] = [
  { key: 'expense', label: 'Expense', sub: 'Money out', icon: 'arrow-up', color: brand.expense, params: { type: 'expense' } },
  { key: 'income', label: 'Income', sub: 'Money in', icon: 'arrow-down', color: brand.income, params: { type: 'income' } },
  { key: 'scan', label: 'Scan bill', sub: 'AI auto-fill', icon: 'scan', color: '#2E90FA', params: { type: 'expense', action: 'scan' } },
  { key: 'voice', label: 'Voice', sub: 'Just say it', icon: 'mic', color: brand.violet, params: { action: 'voice' } },
];

const SLOTS = 5;
const BAR_H = 66;
const RISE = 20; // how far the + button sits above the bar
const FAB = 60;
const PAD = 6;
const IS_IOS = Platform.OS === 'ios';

function TabItem({
  tab, focused, onPress, onLongPress,
}: { tab: typeof TABS[number]; focused: boolean; onPress: () => void; onLongPress: () => void }) {
  const { c } = useTheme();
  const idle = c.textTertiary;
  const active = brand.primary;

  const p = useSharedValue(focused ? 1 : 0);
  const bounce = useSharedValue(1);
  const mounted = useRef(false);

  useEffect(() => {
    p.value = withTiming(focused ? 1 : 0, { duration: 220 });
    if (focused && mounted.current) {
      bounce.value = withSequence(withTiming(0.8, { duration: 90 }), withSpring(1, { damping: 7, stiffness: 260 }));
    }
    mounted.current = true;
  }, [focused]);

  const iconWrap = useAnimatedStyle(() => ({ transform: [{ scale: bounce.value }, { translateY: -1.5 * p.value }] }));
  const filled = useAnimatedStyle(() => ({ opacity: p.value }));
  const outline = useAnimatedStyle(() => ({ opacity: 1 - p.value }));
  const label = useAnimatedStyle(() => ({ color: interpolateColor(p.value, [0, 1], [idle, active]) }));

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tab}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={tab.label}
    >
      <Animated.View style={[styles.iconBox, iconWrap]}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.center, outline]}>
          <Ionicons name={tab.icon} size={23} color={idle} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, styles.center, filled]}>
          <Ionicons name={tab.iconActive} size={23} color={active} />
        </Animated.View>
      </Animated.View>
      <Animated.Text style={[styles.label, label]} numberOfLines={1}>{tab.label}</Animated.Text>
    </Pressable>
  );
}

export default function TabBar({ state, navigation, insets }: BottomTabBarProps) {
  const { c, isDark } = useTheme();
  const [barW, setBarW] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [keyboardUp, setKeyboardUp] = useState(false);

  const dockBottom = Math.max(insets.bottom - 10, 12);
  const slotW = barW ? (barW - PAD * 2) / SLOTS : 0;
  const activeTab = TABS.find(t => t.name === state.routes[state.index]?.name);

  // ── Sliding "liquid" indicator ───────────────────────────────────────────
  const x = useSharedValue(0);
  const shown = useSharedValue(0);
  const stretch = useSharedValue(1);
  useEffect(() => {
    if (!slotW) return;
    if (!activeTab) { shown.value = withTiming(0, { duration: 150 }); return; }
    const target = PAD + activeTab.slot * slotW;
    if (shown.value < 0.5) {
      x.value = target; // appear in place, don't slide in from elsewhere
    } else {
      x.value = withSpring(target, { damping: 20, stiffness: 230, mass: 0.8 });
      stretch.value = withSequence(withTiming(1.35, { duration: 110 }), withSpring(1, { damping: 11, stiffness: 220 }));
    }
    shown.value = withTiming(1, { duration: 200 });
  }, [activeTab?.name, slotW]);

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: shown.value,
    transform: [{ translateX: x.value }, { scaleX: stretch.value }],
  }));

  // ── + button / quick-add menu ────────────────────────────────────────────
  const open = useSharedValue(0);
  useEffect(() => { open.value = withSpring(menuOpen ? 1 : 0, { damping: 14, stiffness: 180 }); }, [menuOpen]);
  const plusStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${open.value * 135}deg` }] }));

  useEffect(() => {
    if (!menuOpen) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { setMenuOpen(false); return true; });
    return () => sub.remove();
  }, [menuOpen]);

  const quickAdd = (params: object) => {
    setMenuOpen(false);
    navigation.navigate('AddTransaction', params);
  };

  // ── Slide away while typing ──────────────────────────────────────────────
  const hidden = useSharedValue(0);
  useEffect(() => {
    const show = Keyboard.addListener(IS_IOS ? 'keyboardWillShow' : 'keyboardDidShow', () => {
      setKeyboardUp(true);
      hidden.value = withTiming(1, { duration: 200 });
    });
    const hide = Keyboard.addListener(IS_IOS ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      setKeyboardUp(false);
      hidden.value = withTiming(0, { duration: 240 });
    });
    return () => { show.remove(); hide.remove(); };
  }, []);
  const dockStyle = useAnimatedStyle(() => ({
    opacity: 1 - hidden.value,
    transform: [{ translateY: hidden.value * (BAR_H + RISE + dockBottom + 12) }],
  }));

  // ── Tab events (enables scroll-to-top on re-tap via useScrollToTop) ──────
  const onTabPress = (routeName: string) => {
    const route = state.routes.find(r => r.name === routeName);
    if (!route) return;
    setMenuOpen(false);
    const focused = state.routes[state.index]?.key === route.key;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
  };
  const onTabLongPress = (routeName: string) => {
    const route = state.routes.find(r => r.name === routeName);
    if (route) navigation.emit({ type: 'tabLongPress', target: route.key });
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Content dissolves under the dock instead of peeking out sharply below it */}
      <Animated.View style={[styles.fade, { height: dockBottom + BAR_H + 28 }, dockStyle]} pointerEvents="none">
        <LinearGradient colors={[c.bg + '00', c.bg + 'E6', c.bg]} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
      </Animated.View>

      {/* Quick-add menu */}
      {menuOpen && (
        <>
          <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(160)} style={StyleSheet.absoluteFill}>
            {IS_IOS && <BlurView intensity={18} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />}
            <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: c.overlay }]} onPress={() => setMenuOpen(false)} accessibilityLabel="Close quick add" />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.springify().damping(18).stiffness(220)}
            exiting={FadeOutDown.duration(150)}
            style={[styles.menu, { bottom: dockBottom + BAR_H + RISE + 16, backgroundColor: c.elevated, borderColor: c.border }]}
          >
            <View style={styles.menuHead}>
              <Text style={[styles.menuTitle, { color: c.text }]}>Quick add</Text>
              <Text style={[styles.menuHint, { color: c.textTertiary }]}>Hold + for a quick expense</Text>
            </View>
            <View style={styles.menuRow}>
              {QUICK_ADD.map((q, i) => (
                <Animated.View key={q.key} entering={ZoomIn.delay(60 + i * 45).springify().damping(14)} style={{ flex: 1 }}>
                  <PressableScale onPress={() => quickAdd(q.params)} scaleTo={0.9} style={styles.tile} accessibilityRole="button" accessibilityLabel={`Add ${q.label}`}>
                    <LinearGradient colors={[q.color, q.color + 'CC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tileIcon}>
                      <Ionicons name={q.icon} size={22} color="#FFF" />
                    </LinearGradient>
                    <Text style={[styles.tileLabel, { color: c.text }]} numberOfLines={1}>{q.label}</Text>
                    <Text style={[styles.tileSub, { color: c.textTertiary }]} numberOfLines={1}>{q.sub}</Text>
                  </PressableScale>
                </Animated.View>
              ))}
            </View>
            <View style={[styles.menuTail, { backgroundColor: c.elevated, borderColor: c.border }]} />
          </Animated.View>
        </>
      )}

      {/* Dock */}
      <Animated.View
        style={[styles.dock, { bottom: dockBottom }, dockStyle]}
        pointerEvents={keyboardUp ? 'none' : 'box-none'}
      >
        <View
          style={[styles.bar, { borderColor: c.border, shadowOpacity: isDark ? 0.5 : 0.12 }, !IS_IOS && { backgroundColor: c.tabBar }]}
          onLayout={e => setBarW(e.nativeEvent.layout.width)}
        >
          {IS_IOS && (
            <View style={[StyleSheet.absoluteFill, styles.clip]}>
              <BlurView intensity={80} tint={isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'} style={StyleSheet.absoluteFill} />
              <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(22,23,29,0.55)' : 'rgba(255,255,255,0.6)' }]} />
            </View>
          )}

          {slotW > 0 && (
            <Animated.View style={[styles.indicator, { width: slotW }, indicatorStyle]} pointerEvents="none">
              <View style={[styles.indicatorPill, { backgroundColor: c.primarySoft }]} />
            </Animated.View>
          )}

          <View style={styles.row}>
            {TABS.slice(0, 2).map(t => (
              <TabItem key={t.name} tab={t} focused={activeTab?.name === t.name} onPress={() => onTabPress(t.name)} onLongPress={() => onTabLongPress(t.name)} />
            ))}
            <View style={styles.tab} />
            {TABS.slice(2).map(t => (
              <TabItem key={t.name} tab={t} focused={activeTab?.name === t.name} onPress={() => onTabPress(t.name)} onLongPress={() => onTabLongPress(t.name)} />
            ))}
          </View>
        </View>

        {/* + button */}
        <View style={styles.fabSlot} pointerEvents="box-none">
          <PressableScale
            onPress={() => setMenuOpen(o => !o)}
            onLongPress={() => quickAdd({ type: 'expense' })}
            delayLongPress={350}
            scaleTo={0.88}
            style={[styles.fabRing, { backgroundColor: isDark ? c.surface : '#FFFFFF' }]}
            accessibilityRole="button"
            accessibilityLabel={menuOpen ? 'Close quick add' : 'Quick add'}
            accessibilityState={{ expanded: menuOpen }}
          >
            <LinearGradient colors={[brand.primary, brand.hot]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fab}>
              <Animated.View style={plusStyle}>
                <Ionicons name="add" size={32} color="#FFF" />
              </Animated.View>
            </LinearGradient>
          </PressableScale>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0 },

  dock: { position: 'absolute', left: 14, right: 14, height: BAR_H + RISE, justifyContent: 'flex-end' },
  bar: {
    height: BAR_H,
    borderRadius: BAR_H / 2,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    elevation: 18,
  },
  clip: { borderRadius: BAR_H / 2, overflow: 'hidden' },
  row: { flex: 1, flexDirection: 'row', paddingHorizontal: PAD },

  indicator: { position: 'absolute', top: 7, bottom: 7, left: 0 },
  indicatorPill: { flex: 1, marginHorizontal: 4, borderRadius: 26 },

  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  iconBox: { width: 28, height: 26 },
  label: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.2 },

  fabSlot: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' },
  fabRing: {
    width: FAB + 8,
    height: FAB + 8,
    borderRadius: (FAB + 8) / 2,
    marginTop: -4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: brand.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 12,
  },
  fab: { width: FAB, height: FAB, borderRadius: FAB / 2, alignItems: 'center', justifyContent: 'center' },

  menu: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 24,
  },
  menuHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 8, marginBottom: 14 },
  menuTitle: { fontSize: 17, fontWeight: '900', letterSpacing: -0.3 },
  menuHint: { fontSize: 11.5, fontWeight: '600' },
  menuRow: { flexDirection: 'row' },
  tile: { alignItems: 'center', paddingVertical: 4 },
  tileIcon: { width: 54, height: 54, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  tileLabel: { fontSize: 13, fontWeight: '800' },
  tileSub: { fontSize: 10.5, fontWeight: '600', marginTop: 1 },
  menuTail: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    width: 16,
    height: 16,
    transform: [{ rotate: '45deg' }],
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
