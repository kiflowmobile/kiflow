import { useState, useRef, useEffect } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '@/features/auth';
import { companyApi } from '@/features/company';
import { profileApi } from '@/features/profile';
import { useCriteria } from '@/features/statistics';
import { useSkillRatings } from '@/features/statistics';
import { useSlideAnswers } from '@/features/lessons';
import { useAnalytics } from '@/features/analytics';

import { askGemini, type Message } from '../api/ask-gemini';
import { usePromptsStore } from '../store/promptsStore';
import { formatAIResponseForChat } from '../utils/format-ai-response';
import { AIChatHeader } from './ai-chat-header';
import { AIChatMessages } from './ai-chat-messages';
import { AIChatInput } from './ai-chat-input';

// Extended Message type with id for React keys
interface MessageWithId extends Message {
  id: string;
}

interface AICourseChatProps {
  title: string;
  slideId: string;
}

export const AIChat: React.FC<AICourseChatProps> = ({ title, slideId }) => {
  const [messages, setMessages] = useState<MessageWithId[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { prompt, fetchPromptBySlide } = usePromptsStore();
  const { criteria, fetchCriteria } = useCriteria();
  const { user } = useAuth();
  const { saveRating } = useSkillRatings();
  const { markSlideAnswered } = useSlideAnswers();
  const { trackEvent } = useAnalytics();
  const inputRef = useRef<TextInput | null>(null);
  const pageScrollLockedRef = useRef(false);
  const { moduleId, courseId } = useLocalSearchParams();
  const moduleIdStr = Array.isArray(moduleId) ? moduleId[0] : moduleId;
  const courseIdStr = Array.isArray(courseId) ? courseId[0] : courseId;
  const CHAT_STORAGE_KEY = `course-chat-${courseIdStr}`;

  // Derived state: User message count & Locking
  const userMessageCount = messages.filter((m) => m.role === 'user').length;
  const isLocked = userMessageCount >= 3;

  const loadChat = async () => {
    try {
      const stored = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
      if (!stored) return;

      const parsed: Record<string, MessageWithId[]> = JSON.parse(stored);
      if (parsed[slideId]) {
        setMessages(parsed[slideId]);
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

  // Combined initialization effect
  useEffect(() => {
    if (slideId) {
      fetchPromptBySlide(slideId);
      loadChat(); // Load chat history independently
    }
    if (courseIdStr) {
      fetchCriteria(courseIdStr);
    }
  }, [slideId, courseIdStr, fetchPromptBySlide, fetchCriteria]);

  // Handle Initial AI Message (Question) if no chat history
  useEffect(() => {
    if (!prompt[slideId] || messages.length > 0) return;

    // Check storage one last time to avoid overwriting or doubling
    const checkStorageAndSetInitial = async () => {
      try {
        const stored = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed[slideId] && parsed[slideId].length > 0) return; // Already has messages
        }

        const initialMsgText = prompt[slideId]?.initial_message;
        if (initialMsgText) {
          const aiMsg: MessageWithId = {
            id: Date.now().toString(),
            role: 'ai',
            text: initialMsgText,
          };
          setMessages([aiMsg]);
        }
      } catch (err) {
        console.error('Error setting initial message:', err);
      }
    };

    checkStorageAndSetInitial();
  }, [slideId, prompt, messages.length, CHAT_STORAGE_KEY]);

  const handleSend = async () => {
    trackEvent('course_screen__submit__click', { courseIdStr, slideId });
    if (!input.trim() || loading) return;

    const userMsg: MessageWithId = {
      id: Date.now().toString(),
      role: 'user',
      text: input.trim(),
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    markSlideAnswered(slideId);

    try {
      const systemInstruction = prompt[slideId]?.system_instruction || '';
      const criteriasText = criteria.map((item) => `${item.key} - ${item.name.trim()}`).join('\n');

      // Resolve Company ID
      let companyIdToUse: string | undefined = undefined;
      try {
        const { code } = await profileApi.getCurrentUserCode();
        if (code) {
          const { data: companyData } = await companyApi.getCompanyByCode(code);
          if (companyData) companyIdToUse = companyData.id;
        }
      } catch (err) {
        console.warn('Failed to resolve current user companyId', err);
      }

      const aiResponse = await askGemini({
        messages: newMessages,
        slidePrompt: systemInstruction,
        isFirstMessage: messages.length === 0, // Should rarely be true if initial message loads, but safe check
        criteriasText,
        companyId: companyIdToUse,
      });

      trackEvent('course_screen__response_success__load', {
        id: slideId,
        index: 0,
        model: aiResponse?.model || 'gemini',
        tokens: aiResponse?.usage?.totalTokens || 0,
      });

      // Saving Ratings
      if (user && aiResponse.rating?.criteriaScores && moduleIdStr) {
        const criteriaScores = aiResponse.rating.criteriaScores;
        // Parallel save
        Promise.allSettled(
          Object.entries(criteriaScores).map(([criteriaKey, score]) =>
            saveRating(user.id, score as number, moduleIdStr, criteriaKey),
          ),
        ).catch((err) => console.warn('Failed saving ratings', err));
      }

      // Formatting response
      const chatText = formatAIResponseForChat(aiResponse);

      const aiMsg: MessageWithId = {
        id: Date.now().toString(),
        role: 'ai',
        text: chatText,
      };

      const updatedMessages = [...newMessages, aiMsg];
      setMessages(updatedMessages);

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
      trackEvent('course_screen__response_fail__load', { id: slideId, index: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleAudioProcessed = (transcribedText: string) => {
    if (isLocked) return;
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
    <SafeAreaView className="flex-1 bg-surface p-4">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <AIChatHeader title={title} />
        <View className="flex-1 rounded-xl p-4 bg-surface shadow-md my-2">
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <AIChatMessages messages={messages} loading={loading} />
          </ScrollView>
        </View>
        <AIChatInput
          input={input}
          setInput={setInput}
          onSend={handleSend}
          onAudioProcessed={handleAudioProcessed}
          inputRef={inputRef}
          onFocus={handleFocus}
          onBlur={handleBlur}
          loading={loading}
          isLocked={isLocked}
          id={courseIdStr}
          slideId={slideId}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
