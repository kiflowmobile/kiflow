import { Icon } from '@/src/components/ui/icon';
import { usePromptsStore } from '@/src/services/slidePrompt';
import { useAuthStore, useCourseStore, useCriteriaStore, useModulesStore } from '@/src/stores';
import { useMainRatingStore } from '@/src/stores/mainRatingStore';
import { MessageCircle, Send } from 'lucide-react-native';
import React, { useEffect, useState, useRef } from 'react';
import { Dimensions, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { askGemini } from './askGemini';
import { KeyboardAvoidingView } from 'react-native';
import { formatAIResponseForChat } from './formatAIResponseForChat';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

interface AICourseChatProps {
  title: string;
  slideId: string;
}

const AICourseChat: React.FC<AICourseChatProps> = ({ title, slideId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const { prompt, fetchPromptBySlide } = usePromptsStore();
  const { criterias, fetchCriterias } = useCriteriaStore();
  const courseId = useCourseStore((state) => state.currentCourse?.id);
  const { user } = useAuthStore(); 
  
  useEffect(() => {
    if (Platform.OS !== 'web') {
      const show = Keyboard.addListener('keyboardDidShow', e => setKeyboardHeight(e.endCoordinates.height));
      const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
      return () => { show.remove(); hide.remove(); };
    }
  }, []);

  useEffect(() => { if (slideId) fetchPromptBySlide(slideId); }, [slideId, fetchPromptBySlide]);

  useEffect(() => {
    const slidePrompt = prompt[slideId]?.question;
    if (slidePrompt) setMessages([{ id: Date.now().toString(), role: 'ai', text: slidePrompt }]);
  }, [slideId, prompt]);

  useEffect(() => { if(courseId) fetchCriterias(courseId); }, [courseId]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const slidePrompt = prompt[slideId]?.prompt || "";
      const criteriasText = criterias.map(item => `${item.key} - ${item.name.trim()}`).join('\n');
      const aiResponse = await askGemini([...messages, userMsg], slidePrompt, messages.length === 0, criteriasText);
      const aiMsg: Message = { id: Date.now().toString(), role: 'ai', text: formatAIResponseForChat(aiResponse) };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setLoading(false);
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.chatContent, { paddingBottom: 16 + keyboardHeight }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map(msg => (
            <View key={msg.id} style={[styles.messageBubble, msg.role === 'ai' ? styles.aiBubble : styles.userBubble]}>
              {msg.role === 'ai' && <Icon as={MessageCircle} size={18} color="#0f172a" style={styles.messageIcon} />}
              <Text style={styles.messageText}>{msg.text}</Text>
            </View>
          ))}
          {loading && <View style={[styles.messageBubble, styles.aiBubble]}><Text style={styles.messageText}>AI думає...</Text></View>}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Platform.OS === 'web' ? 16 : keyboardHeight + 8 }]}>
          <TextInput
            style={styles.input}
            placeholder="Введіть повідомлення..."
            value={input}
            onChangeText={setInput}
            multiline
            {...(Platform.OS === 'web' ? { tabIndex: 0 } : {})}
          />
          <TouchableOpacity onPress={handleSend} disabled={loading} style={styles.sendButton}>
            <Icon as={Send} size={24} color={loading ? '#94a3b8' : '#0f172a'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AICourseChat;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingHorizontal: 16 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  chatContent: { paddingHorizontal: 16, paddingTop: 16 },
  messageBubble: { maxWidth: SCREEN_WIDTH * 0.75, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20, marginBottom: 8 },
  aiBubble: { backgroundColor: '#e0f2fe', alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center' },
  userBubble: { backgroundColor: '#f1f5f9', alignSelf: 'flex-end' },
  messageIcon: { marginRight: 6 },
  messageText: { fontSize: 16, color: '#0f172a', lineHeight: 22 },
  footer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0', backgroundColor: '#ffffff' },
  input: { flex: 1, minHeight: 40, maxHeight: 120, borderRadius: 20, borderWidth: 1, borderColor: '#cbd5e1', paddingHorizontal: 16, paddingVertical: 8, fontSize: 16, backgroundColor: '#f9fafb', marginRight: 8 },
  sendButton: { padding: 8, justifyContent: 'center', alignItems: 'center' },
});
