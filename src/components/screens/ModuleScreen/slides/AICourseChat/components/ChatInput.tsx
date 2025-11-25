import React, { RefObject, useRef } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from '@/src/components/ui/icon';
import { Send } from 'lucide-react-native';
import AudioRecorder from '../AudioRecorder';
import { useAnalyticsStore } from '@/src/stores/analyticsStore';

interface ChatInputProps {
  input: string;
  setInput: (text: string) => void;
  onSend: () => void;
  onAudioProcessed: (text: string) => void;
  inputRef: RefObject<TextInput | null>;
  onFocus: () => void;
  onBlur: () => void;
  loading: boolean;
  answered: boolean;
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
  answered,
  id,
  slideId,
}) => {
  const analyticsStore = useAnalyticsStore.getState();
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
    <View style={styles.footer}>
      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholder={answered ? "Ви вже використали 3 спроби" : "Введіть відповідь..."}
        value={input}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={onBlur}
        multiline
        editable={!answered && !loading}
      />
      <View style={styles.buttonContainer}>
        <AudioRecorder
          onAudioProcessed={onAudioProcessed}
          disabled={loading || answered}
          id={id}
          slideId={slideId}
        />
        <TouchableOpacity onPress={onSend} disabled={loading || answered}>
          <Icon
            as={Send}
            size={24}
            color={loading || answered ? '#94a3b8' : '#0f172a'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ChatInput;

const styles = StyleSheet.create({
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
