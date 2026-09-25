import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, TextInput, FlatList, KeyboardAvoidingView, Platform, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withDelay,
} from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { useStore } from '../store/useStore';
import { api } from '../utils/api';
import { useTheme, brand } from '../theme';
import { IconButton, PressableScale } from '../components/ui';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const SUGGESTIONS: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
  { icon: 'calendar', text: 'How much did I spend this month?' },
  { icon: 'trophy', text: "What's my biggest expense category?" },
  { icon: 'scale', text: 'Am I spending more than I earn?' },
  { icon: 'bulb', text: 'Where can I cut back?' },
];

function Dot({ delay, color }: { delay: number; color: string }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withDelay(delay, withRepeat(withSequence(withTiming(-4, { duration: 280 }), withTiming(0, { duration: 280 })), -1));
  }, []);
  const s = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }, s]} />;
}

function AiBadge({ size = 28 }: { size?: number }) {
  return (
    <LinearGradient colors={[brand.primary, brand.hot]} style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name="sparkles" size={size * 0.5} color="#FFF" />
    </LinearGradient>
  );
}

export default function ChatAssistantScreen({ navigation }: any) {
  const { transactions, user } = useStore();
  const { c } = useTheme();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Hi ${user?.name?.split(' ')[0] || 'there'}! I'm your finance assistant. Ask me anything about your spending, income or trends — I can see your transaction history.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const scrollToEnd = () => requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));

  const sendMessage = useCallback(async (text: string) => {
    const question = text.trim();
    if (!question || isSending) return;

    const userMsg: ChatMessage = { id: `${Date.now()}-u`, role: 'user', text: question };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsSending(true);
    scrollToEnd();

    try {
      const history = [...messages, userMsg]
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, text: m.text }));

      const response = await api.post(`/chat`, {
        question,
        transactions,
        history: history.slice(0, -1), // exclude the question itself, sent separately
      });

      const answer = response.data?.data?.answer || "Sorry, I couldn't process that.";
      setMessages(prev => [...prev, { id: `${Date.now()}-a`, role: 'assistant', text: answer }]);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Could not reach the assistant. Please try again.';
      Toast.show({ type: 'error', text1: 'Chat failed', text2: message });
      setMessages(prev => [...prev, { id: `${Date.now()}-e`, role: 'assistant', text: `⚠️ ${message}` }]);
    } finally {
      setIsSending(false);
      scrollToEnd();
    }
  }, [isSending, messages, transactions]);

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <Animated.View entering={FadeInUp.duration(250)} style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAssistant]}>
        {!isUser && <AiBadge size={28} />}
        {isUser ? (
          <LinearGradient colors={[brand.primary, brand.primaryDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.bubble, { borderBottomRightRadius: 6 }]}>
            <Text style={[styles.bubbleText, { color: '#FFF' }]}>{item.text}</Text>
          </LinearGradient>
        ) : (
          <View style={[styles.bubble, { backgroundColor: c.surface, borderBottomLeftRadius: 6, borderColor: c.border, borderWidth: StyleSheet.hairlineWidth }]}>
            <Text style={[styles.bubbleText, { color: c.text }]}>{item.text}</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  const canSend = !isSending && !!input.trim();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={8}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: c.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <AiBadge size={42} />
            <View>
              <Text style={[styles.headerTitle, { color: c.text }]}>Spendova AI</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={[styles.onlineDot, { backgroundColor: isSending ? brand.primary : brand.income }]} />
                <Text style={[styles.headerSubtitle, { color: c.textSecondary }]}>
                  {isSending ? 'Thinking…' : `Knows your ${transactions.length} transactions`}
                </Text>
              </View>
            </View>
          </View>
          <IconButton icon="close" onPress={() => navigation.goBack()} />
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 16, paddingBottom: 8, gap: 14 }}
          onContentSizeChange={scrollToEnd}
          keyboardShouldPersistTaps="handled"
          ListFooterComponent={isSending ? (
            <View style={[styles.msgRow, styles.msgRowAssistant, { marginTop: 14 }]}>
              <AiBadge size={28} />
              <View style={[styles.bubble, styles.typing, { backgroundColor: c.surface, borderBottomLeftRadius: 6 }]}>
                <Dot delay={0} color={c.textTertiary} />
                <Dot delay={140} color={c.textTertiary} />
                <Dot delay={280} color={c.textTertiary} />
              </View>
            </View>
          ) : null}
        />

        {messages.length === 1 && (
          <View>
            <Text style={[styles.suggestTitle, { color: c.textSecondary }]}>TRY ASKING</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: 12 }} keyboardShouldPersistTaps="handled">
              {SUGGESTIONS.map(s => (
                <PressableScale key={s.text} onPress={() => sendMessage(s.text)} style={[styles.suggestion, { backgroundColor: c.surface, borderColor: c.border }]}>
                  <View style={[styles.suggestionIcon, { backgroundColor: c.primarySoft }]}>
                    <Ionicons name={s.icon} size={15} color={brand.primary} />
                  </View>
                  <Text style={[styles.suggestionText, { color: c.text }]} numberOfLines={2}>{s.text}</Text>
                </PressableScale>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Composer */}
        <View style={[styles.composer, { borderTopColor: c.border }]}>
          <View style={[styles.inputWrap, { backgroundColor: c.surface, borderColor: c.border }]}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask about your money…"
              placeholderTextColor={c.textTertiary}
              style={[styles.textInput, { color: c.text }]}
              multiline
              editable={!isSending}
              selectionColor={brand.primary}
              onSubmitEditing={() => sendMessage(input)}
            />
            <PressableScale onPress={() => sendMessage(input)} disabled={!canSend} scaleTo={0.88}>
              <LinearGradient
                colors={canSend ? [brand.primary, brand.hot] : [c.surfaceAlt, c.surfaceAlt]}
                style={styles.sendBtn}
              >
                <Ionicons name="arrow-up" size={19} color={canSend ? '#FFF' : c.textTertiary} />
              </LinearGradient>
            </PressableScale>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontSize: 17, fontWeight: '900' },
  headerSubtitle: { fontSize: 12.5, fontWeight: '600' },
  onlineDot: { width: 7, height: 7, borderRadius: 4 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '88%' },
  msgRowUser: { alignSelf: 'flex-end' },
  msgRowAssistant: { alignSelf: 'flex-start' },
  bubble: { paddingHorizontal: 15, paddingVertical: 11, borderRadius: 20, flexShrink: 1 },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  typing: { flexDirection: 'row', gap: 5, paddingVertical: 15 },
  suggestTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1, paddingHorizontal: 20, marginBottom: 10 },
  suggestion: { width: 170, borderRadius: 16, borderWidth: 1, padding: 12, gap: 8 },
  suggestionIcon: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  suggestionText: { fontSize: 13.5, fontWeight: '600', lineHeight: 18 },
  composer: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 8, borderTopWidth: StyleSheet.hairlineWidth },
  inputWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, borderRadius: 24, borderWidth: 1, paddingLeft: 16, padding: 5 },
  textInput: { flex: 1, fontSize: 15, maxHeight: 110, paddingTop: 9, paddingBottom: 9 },
  sendBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});
