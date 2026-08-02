import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, logout, currency, setCurrency } = useStore();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [modalVisible, setModalVisible] = useState(false);

  const bg = isDark ? '#000000' : '#F2F2F7';
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#1C1C1E';
  const textSecondary = isDark ? '#8E8E93' : '#6C6C70';
  const separator = isDark ? '#2C2C2E' : '#E5E5EA';

  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  ];

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const menuItems = [
    {
      icon: 'cash-outline' as const,
      label: 'Currency',
      value: currency,
      action: () => setModalVisible(true),
      color: '#007AFF',
    },
    {
      icon: isDark ? 'sunny-outline' : 'moon-outline' as const,
      label: 'Appearance',
      value: isDark ? 'Dark' : 'Light',
      action: toggleColorScheme,
      color: isDark ? '#FFD60A' : '#5E5CE6',
    },
    {
      icon: 'shield-checkmark-outline' as const,
      label: 'Account',
      value: 'Verified',
      action: () => {},
      color: '#34C759',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: separator }]}>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Profile</Text>
      </View>

      <View style={styles.content}>
        {/* Avatar Section */}
        <View style={[styles.profileCard, { backgroundColor: cardBg }]}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: '#007AFF' }]}>
              <Text style={styles.avatarInitials}>{user?.name ? getInitials(user.name) : 'U'}</Text>
            </View>
          )}
          <Text style={[styles.userName, { color: textPrimary }]}>{user?.name || 'Guest User'}</Text>
          <Text style={[styles.userEmail, { color: textSecondary }]}>{user?.email || 'guest@mail.com'}</Text>
        </View>

        {/* Settings */}
        <View style={[styles.settingsCard, { backgroundColor: cardBg }]}>
          {menuItems.map((item, i) => (
            <View key={i}>
              <TouchableOpacity style={styles.menuRow} onPress={item.action} activeOpacity={0.7}>
                <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                  <Ionicons name={item.icon} size={18} color={item.color} />
                </View>
                <Text style={[styles.menuLabel, { color: textPrimary }]}>{item.label}</Text>
                <Text style={[styles.menuValue, { color: textSecondary }]}>{item.value}</Text>
                <Ionicons name="chevron-forward" size={16} color={textSecondary} />
              </TouchableOpacity>
              {i < menuItems.length - 1 && <View style={[styles.separator, { backgroundColor: separator, marginLeft: 72 }]} />}
            </View>
          ))}
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={[styles.signOutBtn, { backgroundColor: cardBg }]} onPress={logout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Currency Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: cardBg }]}>
            <View style={[styles.modalHandle, { backgroundColor: separator }]} />
            <Text style={[styles.modalTitle, { color: textPrimary }]}>Currency</Text>
            <FlatList
              data={currencies}
              keyExtractor={item => item.code}
              renderItem={({ item, index }) => (
                <View>
                  <TouchableOpacity
                    style={styles.currencyRow}
                    onPress={() => { setCurrency(item.code); setModalVisible(false); }}
                    activeOpacity={0.7}
                  >
                    <View>
                      <Text style={[styles.currencyCode, { color: textPrimary }]}>{item.code}</Text>
                      <Text style={[styles.currencyName, { color: textSecondary }]}>{item.name}</Text>
                    </View>
                    <View style={styles.currencyRight}>
                      <Text style={[styles.currencySymbol, { color: textSecondary }]}>{item.symbol}</Text>
                      {currency === item.code && <Ionicons name="checkmark" size={20} color="#007AFF" />}
                    </View>
                  </TouchableOpacity>
                  {index < currencies.length - 1 && <View style={[styles.separator, { backgroundColor: separator, marginLeft: 20 }]} />}
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  content: { flex: 1, padding: 20, gap: 16 },
  profileCard: { borderRadius: 20, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 14 },
  avatarFallback: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  avatarInitials: { color: '#FFFFFF', fontSize: 28, fontWeight: '700' },
  userName: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  userEmail: { fontSize: 15 },
  settingsCard: { borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 14 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: '500' },
  menuValue: { fontSize: 15, marginRight: 4 },
  separator: { height: StyleSheet.hairlineWidth },
  signOutBtn: { borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  signOutText: { color: '#FF3B30', fontSize: 17, fontWeight: '600' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 40, maxHeight: '70%' },
  modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '700', paddingHorizontal: 20, marginBottom: 16 },
  currencyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  currencyCode: { fontSize: 17, fontWeight: '600', marginBottom: 2 },
  currencyName: { fontSize: 13 },
  currencyRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  currencySymbol: { fontSize: 16 },
});
