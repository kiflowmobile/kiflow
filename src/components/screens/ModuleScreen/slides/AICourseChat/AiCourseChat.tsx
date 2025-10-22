import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  View,
  StyleSheet,
} from 'react-native';
import { usePromptsStore } from '@/src/services/slidePrompt';
import { useAuthStore, useCriteriaStore, useMainRatingStore, useSlidesStore } from '@/src/stores';

import { SafeAreaView } from 'react-native-safe-area-context';
import { askGemini } from './askGemini';
import { getCurrentUserCode } from '@/src/services/users';
import { getCompanyByCode } from '@/src/services/company';
import ChatHeader from './components/ChatHeader';
import ChatMessages from './components/ChatMessages';
import ChatInput from './components/ChatInput';
import { formatAIResponseForChat } from './formatAIResponseForChat';
import { shadow } from '@/src/components/ui/styles/shadow';
import { useLocalSearchParams } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [answered, setAnswered] = useState(false);
  const { prompt, fetchPromptBySlide } = usePromptsStore();
  const { criterias, fetchCriterias } = useCriteriaStore();
  const { user } = useAuthStore();
  const { saveRating } = useMainRatingStore();
  const inputRef = useRef<TextInput | null>(null);
  const pageScrollLockedRef = useRef(false);
  const { moduleId, courseId } = useLocalSearchParams();
  const moduleIdStr = Array.isArray(moduleId) ? moduleId[0] : moduleId;
  const courseIdStr = Array.isArray(courseId) ? courseId[0] : courseId;
  const CHAT_STORAGE_KEY = `course-chat-${courseIdStr}`;

  const loadChat = async () => {
    try {
      const stored = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
      if (!stored) return;

      const parsed = JSON.parse(stored);
      if (parsed[slideId]) {
        setMessages(parsed[slideId]);
        setAnswered(true);
      }
    } catch (err) {
      console.error('Error loading chat:', err);
    }
  };

  const lockPageScroll = () => {
    if (Platform.OS !== 'web' || pageScrollLockedRef.current) return;
    const y = window.scrollY || 0;
    (document.body as any).dataset.lockScrollY = String(y);
    document.body.style.position = 'fixed';
    document.body.style.top = `-${y}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    pageScrollLockedRef.current = true;
  };

  const unlockPageScroll = () => {
    if (Platform.OS !== 'web' || !pageScrollLockedRef.current) return;
    const y = Number((document.body as any).dataset.lockScrollY || 0);
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    delete (document.body as any).dataset.lockScrollY;
    pageScrollLockedRef.current = false;
    window.scrollTo(0, y);
  };

  useEffect(() => {
    return () => {
      unlockPageScroll();
    };
  }, []);

  useEffect(() => {
    if (slideId) {
      fetchPromptBySlide(slideId);
    }
  }, [slideId, fetchPromptBySlide]);

  useEffect(() => {
    const loadChatOrPrompt = async () => {
      try {
        const stored = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed[slideId]) {
            setMessages(parsed[slideId]);
            setAnswered(true);
            return;
          }
        }

        const slidePrompt = prompt[slideId]?.question;
        if (!slidePrompt) return;

        const aiMsg: Message = {
          id: Date.now().toString(),
          role: 'ai',
          text: slidePrompt,
        };

        setMessages([aiMsg]);
        setAnswered(useSlidesStore.getState().isSlideAnswered(slideId));
        setInput('');
      } catch (err) {
        console.error('Error loading chat or prompt:', err);
      }
    };

    if (slideId) {
      loadChatOrPrompt();
    }
  }, [slideId, prompt]);

  useEffect(() => {
    if (courseId) fetchCriterias(courseIdStr);
  }, [courseId, courseIdStr, fetchCriterias]);

  useEffect(() => {
    if (slideId) {
      fetchPromptBySlide(slideId);
      loadChat();
    }
  }, [slideId]);

  const handleSend = async () => {
    if (!input.trim() || answered || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setAnswered(true);
    useSlidesStore.getState().markSlideAnswered(slideId);

    try {
      const slidePrompt = prompt[slideId]?.prompt || '';
      const criteriasText = criterias.map((item) => `${item.key} - ${item.name.trim()}`).join('\n');

      // генеруємо відповідь
      // Попробуем получить companyId из current_code пользователя
      let companyIdToUse: string | undefined = undefined;
      try {
        const { code, error: codeError } = await getCurrentUserCode();
        if (code && !codeError) {
          const { data: companyData, error: companyError } = await getCompanyByCode(code);
          if (companyData && !companyError) {
            companyIdToUse = companyData.id;
          } else {
            console.warn('No company found for code', code, companyError);
          }
        }
      } catch (err) {
        console.warn('Failed to resolve current user companyId', err);
      }

      const aiResponse = await askGemini(
        [...messages, userMsg],
        slidePrompt,
        messages.length === 0,
        criteriasText,
        undefined,
        companyIdToUse,
      );

      // зберігаємо оцінки, якщо вони є
      if (user && aiResponse.rating?.criteriaScores && moduleId) {
        const criteriaScores = aiResponse.rating.criteriaScores;
        for (const [criteriaKey, score] of Object.entries(criteriaScores)) {
          try {
            await saveRating(user.id, score as number, moduleIdStr, criteriaKey, courseIdStr);
          } catch (err) {
            console.warn(`Failed to save rating for ${criteriaKey}:`, err);
          }
        }
      }

      // форматуємо текст від AI
      const chatText = formatAIResponseForChat(aiResponse);
      const aiMsg: Message = {
        id: Date.now().toString(),
        role: 'ai',
        text: chatText,
      };

      // створюємо оновлений масив повідомлень
      const updatedMessages = [...messages, userMsg, aiMsg];
      setMessages(updatedMessages);

      // ✅ нова логіка збереження чату
      try {
        const existing = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
        const parsed = existing ? JSON.parse(existing) : {};
        parsed[slideId] = updatedMessages;
        await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(parsed));
      } catch (err) {
        console.error('Error saving chat:', err);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAudioProcessed = (transcribedText: string) => {
    if (answered) return;
    if (transcribedText.trim()) {
      setInput(transcribedText.trim());
    }
  };

  const handleFocus = () => {
    lockPageScroll();

    if (Platform.OS === 'web') {
      setTimeout(() => {
        try {
          (inputRef.current as any)?.focus?.({ preventScroll: true });
        } catch {}
      }, 0);
    }
  };

  const handleBlur = () => {
    unlockPageScroll();
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ChatHeader title={title} />
        <View style={styles.chatBox}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <ChatMessages messages={messages} loading={loading} />
          </ScrollView>
        </View>
        <ChatInput
          input={input}
          setInput={setInput}
          onSend={handleSend}
          onAudioProcessed={handleAudioProcessed}
          inputRef={inputRef}
          onFocus={handleFocus}
          onBlur={handleBlur}
          loading={loading}
          answered={answered}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AICourseChat;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#ffffff', padding: 16 },
  chatBox: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    ...shadow,
    backgroundColor: '#ffffff',
    marginVertical: 8,
  },
});
