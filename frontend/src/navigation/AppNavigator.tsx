import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
  Animated, Dimensions
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DashboardScreen from '../screens/DashboardScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CalendarScreen from '../screens/CalendarScreen';
import TransactionDetailsScreen from '../screens/TransactionDetailsScreen';
import { useStore } from '../store/useStore';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ITEMS = [
  { name: 'Home', icon: 'home', iconOutline: 'home-outline' },
  { name: 'Calendar', icon: 'calendar', iconOutline: 'calendar-outline' },
  { name: 'ADD', icon: 'add', iconOutline: 'add' }, // centre FAB placeholder
  { name: 'Analytics', icon: 'pie-chart', iconOutline: 'pie-chart-outline' },
  { name: 'Profile', icon: 'person', iconOutline: 'person-outline' },
];

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const scales = useRef(TAB_ITEMS.map(() => new Animated.Value(1))).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.5)).current;

  // One opacity value per FAB state — they crossfade between each other
  const opExpense = useRef(new Animated.Value(0)).current; // red up-arrow
  const opNeutral = useRef(new Animated.Value(1)).current; // blue plus
  const opIncome  = useRef(new Animated.Value(0)).current; // green down-arrow

  const crossfadeTo = (target: 'expense' | 'neutral' | 'income') => {
    const map = { expense: opExpense, neutral: opNeutral, income: opIncome };
    const others = Object.entries(map).filter(([k]) => k !== target);
    Animated.parallel([
      Animated.timing(map[target], { toValue: 1, duration: 500, useNativeDriver: true }),
      ...others.map(([, v]) => Animated.timing(v, { toValue: 0, duration: 500, useNativeDriver: true })),
    ]).start();
  };

  useEffect(() => {
    // Pulsing ring
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale, { toValue: 1.4, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0, duration: 900, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulseScale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.5, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    pulse.start();

    // Smooth cycle: neutral → expense → neutral → income → repeat
    const runCycle = () => {
      crossfadeTo('neutral');
      setTimeout(() => crossfadeTo('expense'), 1400);
      setTimeout(() => crossfadeTo('neutral'), 2800);
      setTimeout(() => crossfadeTo('income'),  4200);
      setTimeout(() => crossfadeTo('neutral'), 5600);
    };
    runCycle();
    const interval = setInterval(runCycle, 7000);

    return () => { pulse.stop(); clearInterval(interval); };
  }, []);

  const handlePress = (routeName: string, index: number, isFocused: boolean) => {
    if (routeName === 'ADD') {
      Animated.sequence([
        Animated.timing(scales[index], { toValue: 0.85, duration: 80, useNativeDriver: true }),
        Animated.spring(scales[index], { toValue: 1, friction: 4, useNativeDriver: true }),
      ]).start();
      navigation.navigate('AddTransaction');
      return;
    }

    Animated.sequence([
      Animated.timing(scales[index], { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.spring(scales[index], { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();

    if (!isFocused) {
      navigation.navigate(routeName);
    }
  };

  const barBg = isDark ? '#111111' : '#FFFFFF';
  const activeTint = '#007AFF';
  const inactiveTint = isDark ? '#48484A' : '#C7C7CC';

  return (
    <View style={[
      styles.tabBarWrapper,
      {
        backgroundColor: 'transparent',
        paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
      }
    ]}>
      <View style={[styles.tabBar, { backgroundColor: barBg }]}>
        {TAB_ITEMS.map((item, index) => {
          // Find matching route — "ADD" has no real route
          const route = state.routes.find(r => r.name === item.name);
          const isFocused = route ? state.index === state.routes.indexOf(route) : false;

          // Centre ADD button
          if (item.name === 'ADD') {
            return (
              <Animated.View key="add" style={[styles.tabItem, { transform: [{ scale: scales[index] }] }]}>
                <TouchableOpacity
                  onPress={() => handlePress('ADD', index, false)}
                  activeOpacity={1}
                  style={styles.fabWrapper}
                >
                  {/* Pulsing ring - layered 3 colors that crossfade */}
                  <Animated.View style={[styles.fabPulse, { backgroundColor: '#FF3B30', transform: [{ scale: pulseScale }], opacity: Animated.multiply(pulseOpacity, opExpense) }]} />
                  <Animated.View style={[styles.fabPulse, { backgroundColor: '#007AFF', transform: [{ scale: pulseScale }], opacity: Animated.multiply(pulseOpacity, opNeutral) }]} />
                  <Animated.View style={[styles.fabPulse, { backgroundColor: '#34C759', transform: [{ scale: pulseScale }], opacity: Animated.multiply(pulseOpacity, opIncome) }]} />

                  {/* Gradient layers — crossfade between them */}
                  <Animated.View style={[styles.fabGradientWrap, { opacity: opExpense }]}>
                    <LinearGradient colors={['#FF3B30', '#FF6B6B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fab}>
                      <Ionicons name="trending-up" size={26} color="#FFFFFF" />
                    </LinearGradient>
                  </Animated.View>
                  <Animated.View style={[styles.fabGradientWrap, { opacity: opNeutral }]}>
                    <LinearGradient colors={['#007AFF', '#5856D6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fab}>
                      <Ionicons name="add" size={30} color="#FFFFFF" />
                    </LinearGradient>
                  </Animated.View>
                  <Animated.View style={[styles.fabGradientWrap, { opacity: opIncome }]}>
                    <LinearGradient colors={['#34C759', '#30D158']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fab}>
                      <Ionicons name="trending-down" size={26} color="#FFFFFF" />
                    </LinearGradient>
                  </Animated.View>
                </TouchableOpacity>
              </Animated.View>
            );
          }

          return (
            <Animated.View key={item.name} style={[styles.tabItem, { transform: [{ scale: scales[index] }] }]}>
              <TouchableOpacity
                onPress={() => handlePress(item.name, index, isFocused)}
                activeOpacity={0.7}
                style={styles.tabBtn}
              >
                <Ionicons
                  name={(isFocused ? item.icon : item.iconOutline) as any}
                  size={22}
                  color={isFocused ? activeTint : inactiveTint}
                />
                <Text style={[
                  styles.tabLabel,
                  { color: isFocused ? activeTint : inactiveTint, fontWeight: isFocused ? '700' : '400' }
                ]}>
                  {item.name}
                </Text>
                {isFocused && <View style={styles.activeDot} />}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, restoreSession } = useStore();

  useEffect(() => {
    restoreSession();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            <Stack.Screen
              name="AddTransaction"
              component={AddTransactionScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="TransactionDetails"
              component={TransactionDetailsScreen}
              options={{ presentation: 'modal' }}
            />
          </>
        ) : (
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    paddingHorizontal: 8,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 3,
    minWidth: 56,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
  activeDot: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#007AFF',
  },
  fabWrapper: {
    marginTop: -24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabPulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  fabGradientWrap: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 12,
  },
});
