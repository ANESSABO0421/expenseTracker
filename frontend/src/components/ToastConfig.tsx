import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ToastConfig, ToastConfigParams } from 'react-native-toast-message';
import { useTheme, brand } from '../theme';

type Variant = 'success' | 'error' | 'info';

const VARIANTS: Record<Variant, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  success: { icon: 'checkmark-circle', color: brand.income },
  error: { icon: 'alert-circle', color: brand.expense },
  info: { icon: 'information-circle', color: brand.primary },
};

function AppToast({ text1, text2, variant }: ToastConfigParams<unknown> & { variant: Variant }) {
  const { c } = useTheme();
  const v = VARIANTS[variant];
  return (
    <View style={[styles.toast, { backgroundColor: c.elevated, borderColor: c.border }]}>
      <View style={[styles.icon, { backgroundColor: v.color + '1F' }]}>
        <Ionicons name={v.icon} size={20} color={v.color} />
      </View>
      <View style={{ flex: 1 }}>
        {text1 ? <Text style={[styles.title, { color: c.text }]} numberOfLines={1}>{text1}</Text> : null}
        {text2 ? <Text style={[styles.body, { color: c.textSecondary }]} numberOfLines={2}>{text2}</Text> : null}
      </View>
    </View>
  );
}

export const toastConfig: ToastConfig = {
  success: props => <AppToast {...props} variant="success" />,
  error: props => <AppToast {...props} variant="error" />,
  info: props => <AppToast {...props} variant="info" />,
};

const styles = StyleSheet.create({
  toast: {
    width: '92%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  icon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14.5, fontWeight: '800' },
  body: { fontSize: 13, fontWeight: '500', marginTop: 1, lineHeight: 18 },
});
