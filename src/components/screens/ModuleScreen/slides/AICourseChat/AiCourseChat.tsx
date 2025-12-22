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
import { useLocalSearchParams } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAnalyticsStore } from '@/src/stores/analyticsStore';
import { Colors } from '@/src/constants/Colors';


export function formatComment(comment: {
  overall: string;
  criteria: Record<string, number>;
  feedback: string;
  strengths: string[];
  improvements: string[];
  next_step: string;
}) {
  return (
    `📊 ЗАГАЛЬНА ОЦІНКА: ${comment.overall}\n\n` +

    `🎯 ОЦІНКА ПО КРИТЕРІЯХ:\n` +
    Object.entries(comment.criteria)
      .map(([key, value]) => `• ${key}: ${value}`)
      .join('\n') +

    `\n\n💡 ФІДБЕК:\n${comment.feedback}\n\n` +

    `✅ СИЛЬНІ СТОРОНИ:\n` +
    comment.strengths.map((s) => `• ${s}`).join('\n') +

    `\n\n🔧 ЩО ПОКРАЩИТИ:\n` +
    comment.improvements.map((i) => `• ${i}`).join('\n') +

    `\n\n🚀 НАСТУПНИЙ КРОК:\n${comment.next_step}`
  );
}


interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

interface AICourseChatProps {
  title: string;
  slideId: string;
  setScrollEnabled?: (enabled: boolean) => void;
  isActive?: boolean;
  onComplete?: () => void;
  lessonsId: string;
}

const AICourseChat: React.FC<AICourseChatProps> = ({
  title,
  slideId,
  setScrollEnabled,
  isActive,
  onComplete,
  lessonsId,
}) => {
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
  const ATTEMPTS_STORAGE_KEY = `case-attempts-${courseIdStr}-${slideId}`;
  const analyticsStore = useAnalyticsStore.getState();
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [caseState, setCaseState] = useState<'idle' | 'analyzing' | 'result' | 'completed'>('idle');
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [lastUserAnswer, setLastUserAnswer] = useState('');
  useEffect(() => {
    if (!setScrollEnabled || !isActive) return;
    setScrollEnabled(caseState === 'result' || caseState === 'completed');
    return () => {
      setScrollEnabled(true);
    };
  }, [setScrollEnabled, caseState, isActive]);

  useEffect(() => {
    if (!setScrollEnabled || !isActive || caseState === 'result' || caseState === 'completed')
      return;

    const intervalId = setInterval(() => {
      setScrollEnabled(false);
    }, 100);

    return () => {
      clearInterval(intervalId);
    };
  }, [setScrollEnabled, caseState, isActive]);

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
        // Загружаем количество попыток
        const attemptsStored = await AsyncStorage.getItem(ATTEMPTS_STORAGE_KEY);
        if (attemptsStored) {
          const attempts = parseInt(attemptsStored, 10);
          setAttemptsLeft(attempts);
        } else {
          // Если попыток нет в хранилище, устанавливаем 3
          setAttemptsLeft(3);
          await AsyncStorage.setItem(ATTEMPTS_STORAGE_KEY, '3');
        }

        const stored = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed[slideId]) {
            const savedMessages = parsed[slideId];
            setMessages(savedMessages);

            // Если есть сохраненные сообщения и их больше одного (не только промпт),
            // проверяем состояние кейса
            if (savedMessages.length > 1) {
              // Проверяем, есть ли ответ AI (последнее сообщение должно быть от AI)
              // Структура: [кейс AI, ответ пользователя, ответ AI с оценкой]
              const hasAIResponse =
                savedMessages.length >= 3 && savedMessages[savedMessages.length - 1].role === 'ai';
              if (hasAIResponse) {
                // Если есть ответ AI, показываем результат (пользователь еще не нажал Complete)
                setCaseState('result');
              } else {
                // Иначе кейс завершен
                setCaseState('completed');
                // Если кейс завершен, сбрасываем попытки
                try {
                  await AsyncStorage.removeItem(ATTEMPTS_STORAGE_KEY);
                  setAttemptsLeft(3);
                } catch (err) {
                  console.warn('Failed to reset attempts for completed case:', err);
                }
              }
            }
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
        setInput('');
      } catch (err) {
        console.error('Error loading chat or prompt:', err);
      }
    };

    if (slideId) {
      loadChatOrPrompt();
    }
  }, [slideId, prompt, CHAT_STORAGE_KEY, ATTEMPTS_STORAGE_KEY]);

  useEffect(() => {
    if (courseId) fetchCriterias(courseIdStr);
  }, [courseId, courseIdStr, fetchCriterias]);

  // consolidated prompt/chat loading handled by the effect above

  const handleSend = async () => {
    // debug logs removed
    analyticsStore.trackEvent('course_screen__submit__click', {
      courseIdStr,
      slideId,
    });
    if (!input.trim() || loading) return;

    // show analyzing overlay and block scrolling
    setCaseState('analyzing');

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);

    setLastUserAnswer(input.trim());

    const newCount = userMessageCount + 1;
    setUserMessageCount(newCount);
    // debug logs removed

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



      if (user && aiResponse.rating?.criteriaScores && moduleId && lessonsId) {
        const criteriaScores = aiResponse.rating.criteriaScores;
        for (const [criteriaKey, score] of Object.entries(criteriaScores)) {
          try {
            await saveRating(
              user.id,
              score as number,
              moduleIdStr,
              criteriaKey,
              courseIdStr,
              lessonsId,
            );
          } catch (err) {
            console.warn(`Failed to save rating for ${criteriaKey}:`, err);
          }
        }
      }

      const chatText = formatComment(aiResponse.rating.comment);
      const aiMsg: Message = {
        id: Date.now().toString(),
        role: 'ai',
        text: chatText,
      };

      const updatedMessages = [...messages, userMsg, aiMsg];
      setMessages(updatedMessages);

      setCaseState('result');

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
    const newAttempts = attemptsLeft - 1;
    setAttemptsLeft(newAttempts);

    try {
      await AsyncStorage.setItem(ATTEMPTS_STORAGE_KEY, String(newAttempts));
    } catch (err) {
      console.warn('Failed to save attempts:', err);
    }

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

    setInput(lastUserAnswer);

    // reset counters
    setUserMessageCount(0);
    setIsLocked(false);
    setCaseState('idle');

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
    if (setScrollEnabled && caseState !== 'completed') {
      setScrollEnabled(false);
    }

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
    if (setScrollEnabled && caseState !== 'completed') {
      if (Platform.OS === 'web' && typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(() => {
          setScrollEnabled(false);
        });
      } else {
        setTimeout(() => {
          setScrollEnabled(false);
        }, 10);
      }
    }
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
          scrollEnabled={true}
        >
          <ChatHeader title={title} />
          <ChatMessages
            messages={messages}
            loading={loading}
            attemptsLeft={attemptsLeft}
            caseState={caseState}
          />
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
          {/* attempts message is displayed inside ChatMessages now */}
        </ScrollView>
        <CaseOverlay visible={caseState === 'analyzing'} />

        <CaseFooter
          caseState={caseState}
          isSubmitDisabled={isSubmitDisabled}
          loading={loading}
          onSubmit={handleSend}
          onTryAgain={handleTryAgain}
          onComplete={async () => {
            setCaseState('completed');
            // Сбрасываем попытки при завершении кейса
            try {
              await AsyncStorage.removeItem(ATTEMPTS_STORAGE_KEY);
            } catch (err) {
              console.warn('Failed to reset attempts:', err);
            }
            // Переход на следующий слайд
            if (onComplete) {
              onComplete();
            }
          }}
          attemptsLeft={attemptsLeft}
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
    marginTop: 68,
    paddingBottom: 80,
  },
  attemptsMessage: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginHorizontal: 16,
  },
  attemptsText: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
  },
});
