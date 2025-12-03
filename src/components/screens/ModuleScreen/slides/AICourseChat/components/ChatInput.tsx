import React, { RefObject, useRef, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Icon } from '@/src/components/ui/icon';
import { Mic, Square, Check } from 'lucide-react-native';
// try load lottie dynamically — if not installed we fallback to Animated rings
import { sendAudioToGemini } from '@/src/services/geminiAudio';
import { useAnalyticsStore } from '@/src/stores/analyticsStore';
import { Colors } from '@/src/constants/Colors';

// try load lottie dynamically — if not installed we fallback to Animated rings
let LottieView: any = null;
try {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  const lottie = require('lottie-react-native');
  LottieView = lottie && (lottie.default || lottie);
} catch (err) {
  LottieView = null;
}
const micAnimation = require('@/src/assets/animations/mic-button.json');

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
  const analyticsStore = useAnalyticsStore.getState();
  const hasTrackedInputRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const doneTimerRef = useRef<number | null>(null);
  const ring1Anim = useRef(new Animated.Value(0)).current;
  const ring2Anim = useRef(new Animated.Value(0)).current;
  const ring1AnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const ring2AnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const lottieRef = useRef<any>(null);

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

  const handleStartRecording = async () => {
    if (Platform.OS !== 'web' || !navigator.mediaDevices) {
      console.warn('Audio recording is only available on web platform');
      return;
    }
    try {
      // clear any previous done indicator
      if (doneTimerRef.current) {
        clearTimeout(doneTimerRef.current);
        doneTimerRef.current = null;
      }
      setIsDone(false);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new window.MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // start processing
        setIsProcessing(true);
        // clear any previous done timer
        if (doneTimerRef.current) {
          clearTimeout(doneTimerRef.current);
          doneTimerRef.current = null;
        }

        try {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const arrayBuffer = await blob.arrayBuffer();
          const audioBytes = new Uint8Array(arrayBuffer);

          // if lottie is present, play processing segment
          if (LottieView && lottieRef.current) {
            try {
              // play processing frames (mid section)
              // frames chosen as approximate middle segment
              lottieRef.current.play(36, 54);
            } catch {}
          }

          const response = await sendAudioToGemini(audioBytes, '');

          // after processing show done segment if lottie exists, else show done state briefly
          if (LottieView && lottieRef.current) {
            try {
              lottieRef.current.play(54, 72);
            } catch {}
            // keep done visible briefly then reset lottie to first frame
            doneTimerRef.current = window.setTimeout(() => {
              try {
                lottieRef.current?.reset?.();
              } catch {}
              doneTimerRef.current = null;
            }, 1400);
          } else {
            onAudioProcessed(response);
            setIsDone(true);
            doneTimerRef.current = window.setTimeout(() => {
              setIsDone(false);
              doneTimerRef.current = null;
            }, 1400);
          }

          // call callback with response (for both cases)
          onAudioProcessed(response);
        } catch (err) {
          console.error('Audio processing error:', err);
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      // start lottie if available, otherwise start rings
      if (LottieView && lottieRef.current) {
        try {
          lottieRef.current.reset();
          // play full loop while recording
          lottieRef.current.play();
        } catch {}
      } else {
        startRings();
      }
    } catch (err) {
      console.error('Microphone access error:', err);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // stop lottie loop or rings; processing state will show processing animation/segment
      if (LottieView && lottieRef.current) {
        try {
          // stop loop — we'll control processing/done segments later
          lottieRef.current.pause();
        } catch {}
      } else {
        stopRings();
      }
    }
  };

  const startRings = () => {
    // reset
    ring1Anim.setValue(0);
    ring2Anim.setValue(0);

    // main ring anim
    const a1 = Animated.loop(
      Animated.timing(ring1Anim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: Platform.OS !== 'web',
      }),
    );

    // second ring with slight delay
    const a2 = Animated.loop(
      Animated.sequence([
        Animated.delay(400),
        Animated.timing(ring2Anim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );

    ring1AnimRef.current = a1;
    ring2AnimRef.current = a2;
    a1.start();
    a2.start();
  };

  const stopRings = () => {
    try {
      ring1AnimRef.current?.stop();
      ring2AnimRef.current?.stop();
    } catch {}
    ring1Anim.setValue(0);
    ring2Anim.setValue(0);
  };

  // ensure rings stop if processing starts (keep rings during recording only)
  useEffect(() => {
    if (isProcessing) {
      // stop rings when processing starts
      try {
        ring1AnimRef.current?.stop();
        ring2AnimRef.current?.stop();
      } catch {}
      ring1Anim.setValue(0);
      ring2Anim.setValue(0);
    }
    // we only want to react to changes in isProcessing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProcessing]);

  const handleMicPress = () => {
    analyticsStore.trackEvent('course_screen__audio__click', {
      id,
      slideId,
    });
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };

  // cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (doneTimerRef.current) {
        clearTimeout(doneTimerRef.current);
        doneTimerRef.current = null;
      }
    };
  }, []);

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

        {Platform.OS === 'web' && (
          <TouchableOpacity
            onPress={handleMicPress}
            disabled={loading || isLocked || isProcessing}
            style={styles.micWrap}
            accessibilityLabel="record-audio"
          >
            {LottieView ? (
              <LottieView
                ref={lottieRef}
                source={micAnimation}
                loop={false}
                autoPlay={false}
                style={styles.lottie}
              />
            ) : (
              <>
                {/* Pulsing rings behind the mic (only while recording and not processing) */}
                {isRecording && !isProcessing && (
                  <>
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        styles.ring,
                        {
                          transform: [
                            {
                              scale: ring1Anim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.7, 1.9],
                              }),
                            },
                          ],
                          opacity: ring1Anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.5, 0],
                          }),
                        },
                      ]}
                    />

                    <Animated.View
                      pointerEvents="none"
                      style={[
                        styles.ring,
                        styles.ringInner,
                        {
                          transform: [
                            {
                              scale: ring2Anim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.7, 1.5],
                              }),
                            },
                          ],
                          opacity: ring2Anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.6, 0],
                          }),
                        },
                      ]}
                    />
                  </>
                )}

                {/* Processing state: grey circle with spinner inside */}
                {isProcessing && (
                  <View style={styles.processingWrap} pointerEvents="none">
                    <View style={styles.processingOuter}>
                      <ActivityIndicator color="#6b7280" size="small" />
                    </View>
                  </View>
                )}
              </>
            )}

            <View
              style={[
                styles.micButton,
                isRecording && styles.micRecording,
                isProcessing && styles.micProcessing,
                isDone && styles.micDone,
                (loading || isLocked || isProcessing) && styles.micButtonDisabled,
              ]}
            >
              <Icon
                as={isRecording ? Square : isDone ? Check : Mic}
                size={18}
                color={isRecording || isProcessing || isDone ? '#ffffff' : '#ffffff'}
              />
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
    paddingRight: 80, // space for mic button
  },
  micWrap: {
    position: 'absolute',
    right: 12,
    bottom: 12,
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5774CD',
    // shadow for floating effect
    ...Platform.select({
      ios: {
        shadowColor: '#5774CD',
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0px 6px 12px rgba(87,116,205,0.12)',
      },
    }),
  },
  micButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  micRecording: {
    backgroundColor: '#ef4444',
    ...Platform.select({
      web: { boxShadow: '0px 6px 12px rgba(239,68,68,0.12)' },
    }),
  },
  micProcessing: {
    backgroundColor: '#94a3b8',
    ...Platform.select({
      web: { boxShadow: '0px 6px 12px rgba(148,163,184,0.12)' },
    }),
  },
  micDone: {
    backgroundColor: '#16a34a',
    ...Platform.select({
      web: { boxShadow: '0px 6px 12px rgba(22,163,74,0.12)' },
    }),
  },
  ring: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239,68,68,0.12)',
    alignSelf: 'center',
    left: -16,
    top: -16,
  },
  ringInner: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239,68,68,0.18)',
    alignSelf: 'center',
    left: -6,
    top: -6,
  },
  processingWrap: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottie: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 44,
    height: 44,
  },
});
