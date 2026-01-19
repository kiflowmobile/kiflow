import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Message } from '../api/ask-gemini';

interface MessageWithId extends Message {
  id: string;
}

export function useChatStorage(storageKey: string, slideId: string) {
  const [messages, setMessages] = useState<MessageWithId[]>([]);

  const loadChat = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(storageKey);
      if (!stored) return;

      const parsed: Record<string, MessageWithId[]> = JSON.parse(stored);
      if (parsed[slideId]) {
        setMessages(parsed[slideId]);
      }
    } catch (err) {
      console.error('Error loading chat:', err);
    }
  }, [storageKey, slideId]);

  const saveChat = useCallback(
    async (newMessages: MessageWithId[]) => {
      try {
        const existing = await AsyncStorage.getItem(storageKey);
        const parsed = existing ? JSON.parse(existing) : {};
        parsed[slideId] = newMessages;
        await AsyncStorage.setItem(storageKey, JSON.stringify(parsed));
      } catch (err) {
        console.error('Error saving chat:', err);
      }
    },
    [storageKey, slideId],
  );

  const addMessage = useCallback(
    (message: MessageWithId) => {
      setMessages((prev) => [...prev, message]);
    },
    [],
  );

  const addUserMessage = useCallback(
    (text: string): MessageWithId => {
      const msg: MessageWithId = {
        id: Date.now().toString(),
        role: 'user',
        text: text.trim(),
      };
      setMessages((prev) => [...prev, msg]);
      return msg;
    },
    [],
  );

  const addAIMessage = useCallback(
    (text: string): MessageWithId => {
      const msg: MessageWithId = {
        id: Date.now().toString(),
        role: 'ai',
        text,
      };
      setMessages((prev) => [...prev, msg]);
      return msg;
    },
    [],
  );

  const hasStoredMessages = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(storageKey);
      if (!stored) return false;
      const parsed = JSON.parse(stored);
      return parsed[slideId] && parsed[slideId].length > 0;
    } catch {
      return false;
    }
  }, [storageKey, slideId]);

  return {
    messages,
    setMessages,
    loadChat,
    saveChat,
    addMessage,
    addUserMessage,
    addAIMessage,
    hasStoredMessages,
  };
}
