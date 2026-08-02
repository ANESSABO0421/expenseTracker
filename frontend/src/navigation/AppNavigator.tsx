import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useEffect } from 'react';
import DashboardScreen from '../screens/DashboardScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import { useStore } from '../store/useStore';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1A1A24',
          borderTopWidth: 0,
          elevation: 0,
          height: 90,
          paddingBottom: 30,
        },
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#6B7280',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;
          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Analytics') {
            iconName = focused ? 'pie-chart' : 'pie-chart-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
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
          </>
        ) : (
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
