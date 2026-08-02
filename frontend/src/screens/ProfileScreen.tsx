import React from 'react';
import { View, Text, Image, Pressable, SafeAreaView, StyleSheet } from 'react-native';
import { useStore } from '../store/useStore';
import { Ionicons } from '@expo/vector-icons';
import AnimatedCard from '../components/AnimatedCard';

export default function ProfileScreen() {
  const { user, logout } = useStore();

  const handleLogout = () => {
    logout();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.content}>
        <AnimatedCard>
          <View style={styles.profileInfo}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>
                  {user?.name ? getInitials(user.name) : 'U'}
                </Text>
              </View>
            )}
            <Text style={styles.name}>{user?.name || 'Guest User'}</Text>
            <Text style={styles.email}>{user?.email || 'guest@mail.com'}</Text>
          </View>
        </AnimatedCard>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>App Preferences</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingItem}>
              <View style={styles.settingLabel}>
                <Ionicons name="cash-outline" size={22} color="#6366F1" />
                <Text style={styles.settingText}>Primary Currency</Text>
              </View>
              <Text style={styles.settingValue}>USD ($)</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.settingItem}>
              <View style={styles.settingLabel}>
                <Ionicons name="shield-checkmark-outline" size={22} color="#10B981" />
                <Text style={styles.settingText}>Account Status</Text>
              </View>
              <Text style={styles.settingValue}>Verified</Text>
            </View>
          </View>
        </View>

        <Pressable 
          onPress={handleLogout} 
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.logoutButtonPressed
          ]}
        >
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F13',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A24',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  profileInfo: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#6366F1',
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#1A1A24',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#6366F1',
    marginBottom: 16,
  },
  avatarPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#6B7280',
  },
  settingsSection: {
    marginTop: 32,
    flex: 1,
  },
  sectionTitle: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  settingsCard: {
    backgroundColor: '#1A1A24',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#262636',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  settingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  settingValue: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#262636',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoutButtonPressed: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
