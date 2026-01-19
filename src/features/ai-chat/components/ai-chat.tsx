import { useState, useRef, useEffect } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

import { useAuth } from '@/features/auth';
import { companyApi } from '@/features/company';
import { profileApi } from '@/features/profile';
import { useCriteria, useSkillRatings } from '@/features/statistics';
import { useSlideAnswers } from '@/features/lessons';
import { useAnalytics } from '@/features/analytics';

import { askGemini } from '../api/ask-gemini';
import { usePromptsStore } from '../store/promptsStore';
import { formatAIResponseForChat } from '../utils/format-ai-response';
import { usePageScrollLock } from '../hooks/usePageScrollLock';
import { useChatStorage } from '../hooks/useChatStorage';
import { AIChatHeader } from './ai-chat-header';
import { AIChatMessages } from './ai-chat-messages';
import { AIChatInput } from './ai-chat-input';

interface AICourseChatProps {
  title: string;
  slideId: string;
}

export const AIChat: React.FC<AICourseChatProps> = ({ title, slideId }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput | null>(null);

  const { moduleId, courseId } = useLocalSearchParams();
  const moduleIdStr = Array.isArray(moduleId) ? moduleId[0] : moduleId;
  const courseIdStr = Array.isArray(courseId) ? courseId[0] : courseId;
  const CHAT_STORAGE_KEY = `course-chat-${courseIdStr}`;

  const { prompt, fetchPromptBySlide } = usePromptsStore();
  const { criteria, fetchCriteria } = useCriteria();
  const { user } = useAuth();
  const { saveRating } = useSkillRatings();
  const { markSlideAnswered } = useSlideAnswers();
  const { trackEvent } = useAnalytics();
  const { lockPageScroll, unlockPageScroll } = usePageScrollLock();
  const { messages, setMessages, loadChat, saveChat, hasStoredMessages } = useChatStorage(
    CHAT_STORAGE_KEY,
    slideId,
  );

  const userMessageCount = messages.filter((m) => m.role === 'user').length;
  const isLocked = userMessageCount >= 3;

  // Initialize data
  useEffect(() => {
    if (slideId) {
      fetchPromptBySlide(slideId);
      loadChat();
    }
    if (courseIdStr) {
      fetchCriteria(courseIdStr);
    }
  }, [slideId, courseIdStr, fetchPromptBySlide, fetchCriteria, loadChat]);

  // Set initial AI message if no history
  useEffect(() => {
    if (!prompt[slideId] || messages.length > 0) return;

    const checkAndSetInitial = async () => {
      const hasMessages = await hasStoredMessages();
      if (hasMessages) return;

      const initialMsgText = prompt[slideId]?.initial_message;
      if (initialMsgText) {
        setMessages([{ id: Date.now().toString(), role: 'ai', text: initialMsgText }]);
      }
    };

    checkAndSetInitial();
  }, [slideId, prompt, messages.length, hasStoredMessages, setMessages]);

  const handleSend = async () => {
    trackEvent('course_screen__submit__click', { courseIdStr, slideId });
    if (!input.trim() || loading) return;

    const userMsg = { id: Date.now().toString(), role: 'user' as const, text: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    markSlideAnswered(slideId);

    try {
      const systemInstruction = prompt[slideId]?.system_instruction || '';
      const criteriasText = criteria.map((item) => `${item.key} - ${item.name.trim()}`).join('\n');

      // Resolve company ID
      let companyIdToUse: string | undefined;
      try {
        const { code } = await profileApi.getCurrentUserCode();
        if (code) {
          const { data: companyData } = await companyApi.getCompanyByCode(code);
          if (companyData) companyIdToUse = companyData.id;
        }
      } catch (err) {
        console.warn('Failed to resolve companyId', err);
      }

      const aiResponse = await askGemini({
        messages: newMessages,
        slidePrompt: systemInstruction,
        isFirstMessage: messages.length === 0,
        criteriasText,
        companyId: companyIdToUse,
      });

      trackEvent('course_screen__response_success__load', {
        id: slideId,
        index: 0,
        model: aiResponse?.model || 'gemini',
        tokens: aiResponse?.usage?.totalTokens || 0,
      });

      // Save ratings
      if (user && aiResponse.rating?.criteriaScores && moduleIdStr) {
        Promise.allSettled(
          Object.entries(aiResponse.rating.criteriaScores).map(([criteriaKey, score]) =>
            saveRating(user.id, score as number, moduleIdStr, criteriaKey),
          ),
        ).catch((err) => console.warn('Failed saving ratings', err));
      }

      const chatText = formatAIResponseForChat(aiResponse);
      const aiMsg = { id: Date.now().toString(), role: 'ai' as const, text: chatText };
      const updatedMessages = [...newMessages, aiMsg];
      setMessages(updatedMessages);
      await saveChat(updatedMessages);
    } catch (e) {
      console.error(e);
      trackEvent('course_screen__response_fail__load', { id: slideId, index: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleAudioProcessed = (transcribedText: string) => {
    if (!isLocked && transcribedText.trim()) {
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
          onBlur={unlockPageScroll}
          loading={loading}
          isLocked={isLocked}
          id={courseIdStr}
          slideId={slideId}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
