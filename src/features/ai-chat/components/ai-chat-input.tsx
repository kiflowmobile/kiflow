import React, { RefObject, useRef } from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';
import { Send } from 'lucide-react-native';

import { useAnalytics } from '@/features/analytics';
import { Icon } from '@/shared/ui';
import AudioRecorder from './audio-recorder';

interface ChatInputProps {
  input: string;
  setInput: (text: string) => void;
  onSend: () => void;
  onAudioProcessed: (text: string) => void;
  inputRef: RefObject<TextInput | null>;
  onFocus: () => void;
  onBlur: () => void;
  loading: boolean;
  isLocked: boolean;
  id: string;
  slideId?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSend,
  onAudioProcessed,
  inputRef,
  onFocus,
  onBlur,
  loading,
  isLocked,
  id,
  slideId,
}) => {
  const analyticsStore = useAnalytics();
  const hasTrackedInputRef = useRef(false); 

  const handleFocus = () => {
    onFocus?.();
    analyticsStore.trackEvent('course_screen__text__click', {
      id,
      slideId,
      case: 'focus',
    });
  };

  const handleChangeText = (text: string) => {
    setInput(text);

    // Трек події при першому введенні тексту
    if (!hasTrackedInputRef.current && text.trim().length > 0) {
      analyticsStore.trackEvent('course_screen__text__click', {
        id,
        slideId,
        case: 'input',
      });
      hasTrackedInputRef.current = true;
    }
  };

  return (
    <View className="pt-2">
      <TextInput
        ref={inputRef}
        className="min-h-[40px] max-h-[100px] rounded-lg border border-gray-300 px-3 py-2 text-base bg-surface mb-2"
        placeholder={isLocked ? 'Ви вже використали 3 спроби' : 'Введіть відповідь...'}
        placeholderTextColor="#a1a1a1"
        value={input}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={onBlur}
        multiline
        editable={!isLocked && !loading}
      />
      <View className="flex-row items-center justify-between gap-2">
        <AudioRecorder
          onAudioProcessed={onAudioProcessed}
          disabled={loading || isLocked}
          id={id}
          slideId={slideId}
        />
        <TouchableOpacity onPress={onSend} disabled={loading || isLocked}>
          <Icon
            as={Send}
            size={24}
            color={loading || isLocked ? '#94a3b8' : '#0f172a'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ChatInput;