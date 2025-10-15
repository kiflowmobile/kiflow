import { Icon } from '@/src/components/ui/icon';
import { upsertRating } from '@/src/services/main_rating';
import { usePromptsStore } from '@/src/services/slidePrompt';
import {
  useAuthStore,
  useCourseStore,
  useCriteriaStore,
  useMainRatingStore,
  useModulesStore,
  useSlidesStore,
} from '@/src/stores';
import { MessageCircle, Send } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { askGemini } from './askGemini';
import AudioRecorder from './AudioRecorder';
import { formatAIResponseForChat } from './formatAIResponseForChat';
import { shadow } from '@/src/components/ui/styles/shadow';
import { useRoute } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage } from '@/src/utils/chactAsyncStorage';


interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

interface AICourseChatProps {
  title: string;
  slideId: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AICourseChat: React.FC<AICourseChatProps> = ({ title, slideId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [answered, setAnswered] = useState(false);
  const { prompt, fetchPromptBySlide } = usePromptsStore();
  const { criterias, fetchCriterias } = useCriteriaStore();
  // const courseId = useCourseStore((state) => state.currentCourse?.id);
  const { user } = useAuthStore();
  const {saveRating} = useMainRatingStore()
  const inputRef = useRef<TextInput>(null);
  const pageScrollLockedRef = useRef(false);
  const { moduleId, courseId } = useLocalSearchParams();
  const storageKey = `chat_history_${slideId}`;

  const moduleIdStr = Array.isArray(moduleId) ? moduleId[0] : moduleId;
  const courseIdStr = Array.isArray(courseId) ? courseId[0] : courseId;


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
    const loadInitialPrompt = async () => {
      const slidePrompt = prompt[slideId]?.question;
      if (!slidePrompt) return;

      // Restore per-slide answered state
      const alreadyAnswered = useSlidesStore.getState().isSlideAnswered(slideId);
      // setAnswered(alreadyAnswered);
      setInput('');

      const aiMsg: Message = {
        id: Date.now().toString(),
        role: 'ai',
        text: slidePrompt,
      };

      setMessages([aiMsg]);
    };

    loadInitialPrompt();
  }, [slideId, prompt]);

  useEffect(() => {
    if (courseId) fetchCriterias(courseIdStr);
  }, [courseId, fetchCriterias]);

  useEffect(() => {
    const initChat = async () => {
      try {
        // спроба завантажити історію чату
        const savedHistory = await loadChatHistory(slideId);
  
        if (savedHistory.length > 0) {
          setMessages(savedHistory);
        } else {
          // якщо історії немає, показуємо промпт (як раніше)
          const slidePrompt = prompt[slideId]?.question;
          if (slidePrompt) {
            const aiMsg: Message = {
              id: Date.now().toString(),
              role: 'ai',
              text: slidePrompt,
            };
            setMessages([aiMsg]);
            await saveChatHistory(slideId, [aiMsg]);
          }
        }
      } catch (err) {
        console.error('Error initializing chat:', err);
      }
    };
  
    initChat();
  }, [slideId, prompt]);
  
  const saveChatHistory = async (chatId: string, history: Message[]) => {
    try {
      await AsyncStorage.setItem(`chat_history_${chatId}`, JSON.stringify(history));
    } catch (err) {
      console.error('Error saving chat history:', err);
    }
  };
  
  // завантаження історії
  const loadChatHistory = async (chatId: string): Promise<Message[]> => {
    try {
      const saved = await AsyncStorage.getItem(`chat_history_${chatId}`);
      return saved ? JSON.parse(saved) : [];
    } catch (err) {
      console.error('Error loading chat history:', err);
      return [];
    }
  };
  
  

  const handleSend = async () => {
    // if (!input.trim() || answered || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setAnswered(true);
    useSlidesStore.getState().markSlideAnswered(slideId);

    try {
      const slidePrompt = prompt[slideId]?.prompt || '';
      const criteriasText = criterias.map((item) => `${item.key} - ${item.name.trim()}`).join('\n');

      const aiResponse = await askGemini(
        [...messages, userMsg],
        slidePrompt,
        messages.length === 0,
        criteriasText,
      );
      if (user && aiResponse.rating?.criteriaScores && moduleId) {
        const criteriaScores = aiResponse.rating.criteriaScores;
        for (const [criteriaKey, score] of Object.entries(criteriaScores)) {
          try {
            await saveRating (user.id, score as number, moduleIdStr, criteriaKey, courseIdStr)
          } catch (err) {
            console.warn(`Failed to save rating for ${criteriaKey}:`, err);
          }
        }
      }

      const chatText = formatAIResponseForChat(aiResponse);
      const aiMsg: Message = {
        id: Date.now().toString(),
        role: 'ai',
        text: chatText,
      };

      setMessages((prev) => [...prev, aiMsg]);
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


  useEffect(() => {
    const initChat = async () => {
      try {
        const savedHistory = await loadChatHistory(slideId);
  
        if (savedHistory.length > 0) {
          // Якщо вже є історія — просто підставляємо її
          setMessages(savedHistory);
        } else {
          // Якщо історії немає — показуємо початкове AI-повідомлення
          const slidePrompt = prompt[slideId]?.question;
          if (slidePrompt) {
            const aiMsg: Message = {
              id: Date.now().toString(),
              role: 'ai',
              text: slidePrompt,
            };
            setMessages([aiMsg]);
            await saveChatHistory(slideId, [aiMsg]);
          }
        }
      } catch (err) {
        console.error('Error initializing chat:', err);
      }
    };
  
    initChat();
  }, [slideId, prompt]);
  
  // Збереження історії при кожній зміні
  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory(slideId, messages);
    }
  }, [messages, slideId]);
  



  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>

        <View style={styles.chatBox}>
          <ScrollView
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.messageBubble,
                  msg.role === 'ai' ? styles.aiBubble : styles.userBubble,
                ]}
              >
                {msg.role === 'ai' && (
                  <Icon as={MessageCircle} size={20} color="#0f172a" style={styles.messageIcon} />
                )}
                <Text style={styles.messageText}>{msg.text}</Text>
              </View>
            ))}
            {loading && (
              <View style={[styles.messageBubble, styles.aiBubble]}>
                <Text style={styles.messageText}>AI думає...</Text>
              </View>
            )}
          </ScrollView>
        </View>

        <View style={styles.footer}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Введіть відповідь..."
            value={input}
            onChangeText={setInput}
            onFocus={handleFocus}
            onBlur={handleBlur}
            multiline
            // editable={!answered && !loading}
          />
          <View style={styles.buttonContainer}>
            <AudioRecorder onAudioProcessed={handleAudioProcessed} 
            disabled={loading || answered} 
            />
            <TouchableOpacity onPress={handleSend}
            //  disabled={loading || answered}
             >
              <Icon as={Send} size={24} 
              color={loading || answered ? '#94a3b8' : '#0f172a'} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AICourseChat;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a', flexShrink: 1 },
  chatBox: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    ...shadow,
    backgroundColor: '#ffffff',
    marginVertical: 8,
  },
  chatContent: { paddingVertical: 8 },
  messageBubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 12,
  },
  aiBubble: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  userBubble: { backgroundColor: 'rgba(0,0,0,0.03)', alignSelf: 'flex-end' },
  messageIcon: { marginRight: 6 },
  messageText: { fontSize: 16, color: '#0f172a', lineHeight: 22 },
  footer: {
    paddingTop: 8,
  },
  input: {
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
});
