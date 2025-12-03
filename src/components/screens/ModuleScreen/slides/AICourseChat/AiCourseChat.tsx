import { KeyboardAvoidingView, Platform, ScrollView, TextInput, StyleSheet } from 'react-native';
import { usePromptsStore } from '@/src/services/slidePrompt';
import { useAuthStore, useCriteriaStore, useMainRatingStore, useSlidesStore } from '@/src/stores';

import { SafeAreaView } from 'react-native-safe-area-context';
import { askGemini } from './askGemini';
import { getCurrentUserCode } from '@/src/services/users';
import { getCompanyByCode } from '@/src/services/company';
import ChatHeader from './components/ChatHeader';
import ChatMessages from './components/ChatMessages';
import ChatInput from './components/ChatInput';
import CaseOverlay from './components/CaseOverlay';
import CaseFooter from './components/CaseFooter';
import { formatAIResponseForChat } from './formatAIResponseForChat';
// text variants imported where needed in smaller components
import { useLocalSearchParams } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAnalyticsStore } from '@/src/stores/analyticsStore';
import { Colors } from '@/src/constants/Colors';

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
  const [isLocked, setIsLocked] = useState(false);
  const { prompt, fetchPromptBySlide } = usePromptsStore();
  const { criterias, fetchCriterias } = useCriteriaStore();
  const { user } = useAuthStore();
  const { saveRating } = useMainRatingStore();
  const inputRef = useRef<TextInput | null>(null);
  const pageScrollLockedRef = useRef(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const { moduleId, courseId } = useLocalSearchParams();
  const moduleIdStr = Array.isArray(moduleId) ? moduleId[0] : moduleId;
  const courseIdStr = Array.isArray(courseId) ? courseId[0] : courseId;
  const CHAT_STORAGE_KEY = `course-chat-${courseIdStr}`;
  const analyticsStore = useAnalyticsStore.getState();
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [caseState, setCaseState] = useState<'idle' | 'analyzing' | 'result' | 'completed'>('idle');
  // previous messages ref removed — not needed after Try again resets to prompt

  // loadChat removed — loading handled in combined effect (loadChatOrPrompt)

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
            // setAnswered(true);
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
        // setAnswered(useSlidesStore.getState().isSlideAnswered(slideId));
        setInput('');
      } catch (err) {
        console.error('Error loading chat or prompt:', err);
      }
    };

    if (slideId) {
      loadChatOrPrompt();
    }
  }, [slideId, prompt, CHAT_STORAGE_KEY]);

  useEffect(() => {
    if (courseId) fetchCriterias(courseIdStr);
  }, [courseId, courseIdStr, fetchCriterias]);

  // consolidated prompt/chat loading handled by the effect above

  const handleSend = async () => {
    console.log('answered', isLocked);
    console.log('Messages', messages);
    console.log('userMessageCount', userMessageCount);
    analyticsStore.trackEvent('course_screen__submit__click', {
      courseIdStr,
      slideId,
    });
    if (!input.trim() || loading) return;

    // show analyzing overlay and block scrolling
    setCaseState('analyzing');

    if (userMessageCount >= 3) {
      setIsLocked(true);
      return;
    }

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);

    //рахуємо кількість користувальских відповідей
    const newCount = userMessageCount + 1;
    setUserMessageCount(newCount);
    console.log('userMessageCount', userMessageCount);

    if (newCount >= 3) {
      setIsLocked(true);
    }

    setInput('');
    setLoading(true);
    useSlidesStore.getState().markSlideAnswered(slideId);

    try {
      const slidePrompt = prompt[slideId]?.prompt || '';
      const criteriasText = criterias.map((item) => `${item.key} - ${item.name.trim()}`).join('\n');

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
      analyticsStore.trackEvent('course_screen__response_success__load', {
        id: slideId,
        index: 0,
        model: aiResponse?.model || 'gemini',
        tokens: aiResponse?.usage?.totalTokens || 0,
      });

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

      // перейти в состояние результата (показываем оценку и кнопки)
      setCaseState('result');

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
      analyticsStore.trackEvent('course_screen__response_fail__load', {
        id: slideId,
        index: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTryAgain = async () => {
    // Reset messages to show only the original case prompt (no previous answers)
    const slidePrompt = prompt[slideId]?.question;
    if (slidePrompt) {
      const aiMsg: Message = {
        id: Date.now().toString(),
        role: 'ai',
        text: slidePrompt,
      };
      setMessages([aiMsg]);
    } else {
      setMessages([]);
    }

    // remove saved chat from AsyncStorage so previous answer is not restored
    try {
      const existing = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
      const parsed = existing ? JSON.parse(existing) : {};
      if (parsed[slideId]) {
        delete parsed[slideId];
        await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch (err) {
      console.warn('Failed to remove saved chat for try again:', err);
    }

    // reset counters and input
    setUserMessageCount(0);
    setInput('');
    setIsLocked(false);
    setCaseState('idle');

    // scroll to top so user sees the case prompt
    setTimeout(() => {
      try {
        scrollRef.current?.scrollTo({ y: 0, animated: true } as any);
      } catch {}
    }, 50);
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

  const isSubmitDisabled = !input.trim() || loading || isLocked;

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView
          ref={scrollRef as any}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          // блокируем скролл только во время анализа; в состоянии result разрешаем прокрутку
          scrollEnabled={caseState !== 'analyzing'}
        >
          <ChatHeader title={title} />
          <ChatMessages messages={messages} loading={loading} />
          {caseState === 'idle' && (
            <ChatInput
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
          )}
        </ScrollView>
        <CaseOverlay visible={caseState === 'analyzing'} />

        <CaseFooter
          caseState={caseState}
          isSubmitDisabled={isSubmitDisabled}
          loading={loading}
          onSubmit={handleSend}
          onTryAgain={handleTryAgain}
          onComplete={() => setCaseState('completed')}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AICourseChat;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    // оставляем отступ внизу, чтобы последний блок (оценка) можно было докрутить над фиксированной панелью
    paddingBottom: Platform.OS === 'ios' ? 140 : 120,
  },
  // bottom / overlay styles moved to dedicated components
});
