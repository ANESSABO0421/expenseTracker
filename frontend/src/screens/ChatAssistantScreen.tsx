import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import Toast from 'react-native-toast-message';
import { useStore } from '../store/useStore';
import { api } from '../utils/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const SUGGESTIONS = [
  'How much did I spend this month?',
  'What\'s my biggest expense category?',
  'Am I spending more than I earn?',
];

export default function ChatAssistantScreen({ navigation }: any) {
  const { transactions } = useStore();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Hi! I'm your finance assistant. Ask me anything about your spending, income, or trends — I can see your transaction history.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const bg = isDark ? '#000000' : '#F2F2F7';
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#1C1C1E';
  const textSecondary = isDark ? '#8E8E93' : '#6C6C70';
  const inputBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const separator = isDark ? '#2C2C2E' : '#E5E5EA';

  const scrollToEnd = () => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

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
      Toast.show({ type: 'error', text1: 'Chat Failed', text2: message });
      setMessages(prev => [...prev, { id: `${Date.now()}-e`, role: 'assistant', text: `⚠️ ${message}` }]);
    } finally {
      setIsSending(false);
      scrollToEnd();
    }
  }, [isSending, messages, transactions]);

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAssistant]}>
        {!isUser && (
          <LinearGradient colors={['#5856D6', '#007AFF']} style={styles.avatarBadge}>
            <Ionicons name="sparkles" size={14} color="#FFF" />
          </LinearGradient>
        )}
        <View
          style={[
            styles.bubble,
            isUser
              ? { backgroundColor: '#007AFF', borderBottomRightRadius: 4 }
              : { backgroundColor: cardBg, borderBottomLeftRadius: 4 },
          ]}
        >
          <Text style={[styles.bubbleText, { color: isUser ? '#FFFFFF' : textPrimary }]}>{item.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={8}>

        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <LinearGradient colors={['#5856D6', '#007AFF']} style={styles.headerBadge}>
              <Ionicons name="sparkles" size={16} color="#FFF" />
            </LinearGradient>
            <View>
              <Text style={[styles.headerTitle, { color: textPrimary }]}>AI Assistant</Text>
              <Text style={[styles.headerSubtitle, { color: textSecondary }]}>Ask about your finances</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.closeBtn, { backgroundColor: cardBg }]}>
            <Ionicons name="close" size={20} color={textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 16, paddingBottom: 8, gap: 12 }}
          onContentSizeChange={scrollToEnd}
        />

        {/* Typing indicator */}
        {isSending && (
          <View style={[styles.msgRow, styles.msgRowAssistant, { paddingHorizontal: 16, marginBottom: 4 }]}>
            <LinearGradient colors={['#5856D6', '#007AFF']} style={styles.avatarBadge}>
              <Ionicons name="sparkles" size={14} color="#FFF" />
            </LinearGradient>
            <View style={[styles.bubble, { backgroundColor: cardBg, borderBottomLeftRadius: 4 }]}>
              <ActivityIndicator size="small" color={textSecondary} />
            </View>
          </View>
        )}

        {/* Suggestions (only before first real question) */}
        {messages.length === 1 && (
          <View style={styles.suggestionsRow}>
            {SUGGESTIONS.map(s => (
              <TouchableOpacity
                key={s}
                onPress={() => sendMessage(s)}
                style={[styles.suggestionChip, { backgroundColor: cardBg, borderColor: separator }]}
              >
                <Text style={[styles.suggestionText, { color: textPrimary }]} numberOfLines={1}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Input bar */}
        <View style={[styles.inputBar, { backgroundColor: inputBg, borderTopColor: separator }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask about your spending..."
            placeholderTextColor={textSecondary}
            style={[styles.textInput, { color: textPrimary, backgroundColor: bg }]}
            multiline
            editable={!isSending}
            onSubmitEditing={() => sendMessage(input)}
          />
          <TouchableOpacity
            onPress={() => sendMessage(input)}
            disabled={isSending || !input.trim()}
            style={[styles.sendBtn, { opacity: isSending || !input.trim() ? 0.4 : 1 }]}
          >
            <LinearGradient colors={['#5856D6', '#007AFF']} style={styles.sendBtnGradient}>
              <Ionicons name="arrow-up" size={18} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12,
  },
  headerBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSubtitle: { fontSize: 12, fontWeight: '500' },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '90%' },
  msgRowUser: { alignSelf: 'flex-end' },
  msgRowAssistant: { alignSelf: 'flex-start' },
  avatarBadge: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  bubble: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  suggestionsRow: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  suggestionChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  suggestionText: { fontSize: 14, fontWeight: '500' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, borderTopWidth: StyleSheet.hairlineWidth,
  },
  textInput: {
    flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, maxHeight: 100,
  },
  sendBtn: { marginBottom: 2 },
  sendBtnGradient: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
