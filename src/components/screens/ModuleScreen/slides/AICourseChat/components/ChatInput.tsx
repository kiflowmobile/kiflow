import React, { RefObject, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Icon } from '@/src/components/ui/icon';
import { Mic, Square, Check } from 'lucide-react-native';
import { sendAudioToGemini } from '@/src/services/geminiAudio';
import { useAnalyticsStore } from '@/src/stores/analyticsStore';
import { Colors } from '@/src/constants/Colors';

import LottieView from 'lottie-react-native';
import micAnimation from '@/src/assets/animations/mic-button.json';
import LottiePlayer from '@/src/components/ui/LottiePlayer/LottiePlayer.web';

type Phase = 'idle' | 'recording' | 'processing' | 'done';

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

const DONE_MS = 1200;

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
  const analyticsStore = useAnalyticsStore.getState();

  const hasTrackedInputRef = useRef(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const [phase, setPhase] = useState<Phase>('idle');
  const doneTimerRef = useRef<number | null>(null);

  // ✅ lottie ref
  const lottieRef = useRef<LottieView>(null);

  const disabled = loading || isLocked || phase === 'processing';
  const isWeb = Platform.OS === 'web';

  const micButtonStyle = useMemo(() => {
    if (phase === 'recording') return [styles.micButton, styles.micRecording];
    if (phase === 'processing') return [styles.micButton, styles.micProcessing];
    if (phase === 'done') return [styles.micButton, styles.micDone];
    if (disabled) return [styles.micButton, styles.micButtonDisabled];
    return [styles.micButton];
  }, [disabled, phase]);

  const cleanupDoneTimer = () => {
    if (doneTimerRef.current) {
      clearTimeout(doneTimerRef.current);
      doneTimerRef.current = null;
    }
  };

  const stopStream = () => {
    try {
      streamRef.current?.getTracks()?.forEach((t) => t.stop());
    } catch {}
    streamRef.current = null;
  };

  const handleFocus = () => {
    onFocus?.();
    analyticsStore.trackEvent('course_screen__text__click', { id, slideId, case: 'focus' });
  };

  const handleChangeText = (text: string) => {
    setInput(text);
    if (!hasTrackedInputRef.current && text.trim().length > 0) {
      analyticsStore.trackEvent('course_screen__text__click', { id, slideId, case: 'input' });
      hasTrackedInputRef.current = true;
    }
  };

  const handleStartRecording = async () => {
    if (!isWeb || !navigator.mediaDevices) {
      console.warn('Audio recording is only available on web platform');
      return;
    }
    if (disabled) return;

    cleanupDoneTimer();
    setPhase('recording');
    chunksRef.current = [];

    // ✅ запускаем лотти на запись
    try {
      lottieRef.current?.reset?.();
      lottieRef.current?.play?.();
    } catch {}

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new window.MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        setPhase('processing');

        // ✅ на processing можно остановить лотти (или оставить играть)
        try {
          lottieRef.current?.pause?.();
        } catch {}

        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const arrayBuffer = await blob.arrayBuffer();
          const audioBytes = new Uint8Array(arrayBuffer);

          const text = await sendAudioToGemini(audioBytes, '');
          onAudioProcessed(text);

          setPhase('done');

          // ✅ на done можно чуть проиграть и сбросить
          try {
            lottieRef.current?.reset?.();
            // если хочешь — можешь play() тут тоже
          } catch {}

          cleanupDoneTimer();
          doneTimerRef.current = window.setTimeout(() => {
            setPhase('idle');
            doneTimerRef.current = null;
            try {
              lottieRef.current?.reset?.();
            } catch {}
          }, DONE_MS);
        } catch (err) {
          console.error('Audio processing error:', err);
          setPhase('idle');
          try {
            lottieRef.current?.reset?.();
          } catch {}
        } finally {
          stopStream();
        }
      };

      mediaRecorder.start();
    } catch (err) {
      console.error('Microphone access error:', err);
      setPhase('idle');
      stopStream();
      try {
        lottieRef.current?.reset?.();
      } catch {}
    }
  };

  const handleStopRecording = () => {
    if (!mediaRecorderRef.current) return;
    if (phase !== 'recording') return;

    try {
      mediaRecorderRef.current.stop();
    } catch {}
  };

  const handleMicPress = () => {
    analyticsStore.trackEvent('course_screen__audio__click', { id, slideId });
    if (phase === 'recording') handleStopRecording();
    else handleStartRecording();
  };

  useEffect(() => {
    return () => {
      cleanupDoneTimer();
      try {
        mediaRecorderRef.current?.stop?.();
      } catch {}
      stopStream();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const styleId = 'remove-textinput-outline';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      textarea:focus,
      input:focus,
      textarea:focus-visible,
      input:focus-visible {
        outline: none !important;
        box-shadow: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existing = document.getElementById(styleId);
      if (existing) document.head.removeChild(existing);
    };
  }, []);

  const micIcon = useMemo(() => {
    if (phase === 'recording') return <Icon as={Square} size={18} color="#ffffff" />;
    if (phase === 'done') return <Icon as={Check} size={18} color="#ffffff" />;
    return <Icon as={Mic} size={18} color="#ffffff" />;
  }, [phase]);

  return (
    <View style={styles.footer}>
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={isLocked ? 'Ви вже використали 3 спроби' : 'Your answer'}
          placeholderTextColor="#94a3b8"
          value={input}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={onBlur}
          multiline
          editable={!isLocked && !loading}
        />

        {isWeb && (
          <TouchableOpacity
            onPress={handleMicPress}
            disabled={disabled}
            style={styles.micWrap}
            accessibilityLabel="record-audio"
            activeOpacity={0.9}
          >
            {/* ✅ Lottie под кнопкой */}
            <View style={styles.micBgLayer} pointerEvents="none">
              <LottiePlayer
                animationData={micAnimation as unknown as object}
                autoPlay
                loop
                // задать явный размер и отключить pointer events внутри плеера
                style={styles.lottie}
                pointerEvents="none"
              />
            </View>

            <View style={micButtonStyle}>
              {phase === 'processing' ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                micIcon
              )}
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default ChatInput;

const styles = StyleSheet.create({
  footer: {
    paddingTop: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: Colors.white,
    paddingRight: 12,
    paddingLeft: 12,
    paddingTop: 12,
    paddingBottom: 12,
  },
  input: {
    flex: 1,
    minHeight: 168,
    maxHeight: 358,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#0f172a',
    paddingRight: 80,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
        borderWidth: 0,
      } as any,
    }),
  },

  micWrap: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // увеличенный фон для лотти — чтобы подсветка/эффекты выходили за границы кнопки
  micBgLayer: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: [{ translateX: -44 }, { translateY: -44 }],
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },

  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5774CD',
    zIndex: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#5774CD',
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 4 },
      web: { boxShadow: '0px 6px 12px rgba(87,116,205,0.12)' as any },
    }),
  },
  micButtonDisabled: {
    backgroundColor: '#94a3b8',
    ...Platform.select({
      web: { boxShadow: '0px 6px 12px rgba(148,163,184,0.12)' as any },
    }),
  },
  micRecording: {
    backgroundColor: '#ef4444',
    ...Platform.select({
      web: { boxShadow: '0px 6px 12px rgba(239,68,68,0.12)' as any },
    }),
  },
  micProcessing: {
    backgroundColor: '#94a3b8',
    ...Platform.select({
      web: { boxShadow: '0px 6px 12px rgba(148,163,184,0.12)' as any },
    }),
  },
  micDone: {
    backgroundColor: '#16a34a',
    ...Platform.select({
      web: { boxShadow: '0px 6px 12px rgba(22,163,74,0.12)' as any },
    }),
  },

  lottie: {
    width: 44,
    height: 44,
  },
});
