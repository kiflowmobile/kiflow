import { CompassIcon } from '@/components/icons/compass-icon';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getCaseResponse } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import { Slide } from '@/lib/types';
import { useAuthStore } from '@/store/auth-store';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLessonNavigation } from '../context/LessonNavigationContext';
import { useScrollableSlide } from '../context/ScrollableSlideContext';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../styles';
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorderState,
} from 'expo-audio';

interface CaseStudySlideProps {
  slide: Slide;
  onNext: () => void;
  isActive?: boolean;
}

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

export function CaseStudySlide({ slide, onNext, isActive }: CaseStudySlideProps) {
  const { user } = useAuthStore();
  const { setAllowNext, setNavigationLocked } = useLessonNavigation();
  const { handleScroll, handleContentSizeChange, handleLayout } = useScrollableSlide();
  const content = slide.content as any;
  const insets = useSafeAreaInsets();

  const [state, setState] = useState<any>({
    answer: '',
    submitted: false,
    evaluating: false,
  });

  const audioRecorder = useAudioRecorder(RecordingPresets.LOW_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const showResultOverlay = state.submitted && state.evaluation && !state.evaluating;
  const showAnalyzingOverlay = state.evaluating;

  useEffect(() => {
    if (isActive) {
      setNavigationLocked(showResultOverlay || showAnalyzingOverlay);
    }
    return () => setNavigationLocked(false);
  }, [isActive, showResultOverlay, showAnalyzingOverlay, setNavigationLocked]);

  const updateState = useCallback((newState: any) => {
    setState((prev: any) => {
      const updated = { ...prev, ...newState };
      return updated;
    });
  }, []);

  useEffect(() => {
    const fetchCaseData = async () => {
      if (!user || !isActive) return;

      const response = await getCaseResponse(user.id, slide.id);
      if (response) {
        const scores = response.scores || [];
        const avgScore =
          scores.length > 0 ? scores.reduce((acc, curr) => acc + curr.score, 0) / scores.length : 0;

        updateState({
          answer: response.user_answer,
          submitted: true,
          evaluation: response.ai_feedback
            ? {
                feedback: response.ai_feedback,
                average_score: avgScore,
              }
            : undefined,
        });
        setAllowNext(true);
      } else {
        setAllowNext(false);
      }
    };

    fetchCaseData();
  }, [user, slide.id, isActive, setAllowNext, updateState]);

  const handleSubmit = async () => {
    const caseAnswer = state.answer || '';
    if (!caseAnswer?.trim() || !user) return;

    updateState({ submitted: true, evaluating: true });

    try {
      const { data, error } = await supabase.functions.invoke('evaluate-case', {
        body: {
          slide_id: slide.id,
          user_answer: caseAnswer,
        },
      });

      if (error) throw error;

      updateState({
        submitted: true,
        evaluating: false,
        evaluation: {
          feedback: data.feedback || '',
          average_score: data.average_score || 0,
        },
      });

      setAllowNext(true);
    } catch (error: any) {
      console.error('Error evaluating case study:', error);
      updateState({
        submitted: true,
        evaluating: false,
        evaluation: {
          feedback: error.message || 'An error occurred during evaluation',
          average_score: 0,
        },
      });
    }
  };

  const handleTryAgain = () => {
    updateState({
      submitted: false,
      evaluating: false,
      evaluation: undefined,
    });
  };

  const startRecording = async () => {
    try {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permission to access microphone was denied');
        return;
      }

      setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recorderState.isRecording) return;

    await audioRecorder.stop();
    const uri = audioRecorder.uri;

    if (uri) {
      transcribeAudio(uri);
    }
  };

  const transcribeAudio = async (uri: string) => {
    setIsTranscribing(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const base64String = await blobToBase64(blob);

      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: {
          audio_base64: base64String,
          mime_type: 'audio/webm',
        },
      });

      if (error) throw error;

      const transcribedText = data.text;

      setState((prev: any) => ({
        ...prev,
        answer: (prev.answer ? prev.answer + ' ' : '') + transcribedText,
      }));
    } catch (error: any) {
      console.error('Error transcribing audio:', error);
      Alert.alert('Error', 'Failed to transcribe audio.');
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <View
      style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, paddingTop: insets.top + 56 }}
      className="bg-bg"
    >
      <ScrollView
        className="flex-1 p-4"
        contentContainerClassName="items-start"
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        onContentSizeChange={handleContentSizeChange}
        onLayout={(e) => handleLayout(e.nativeEvent.layout.height)}
        scrollEventThrottle={16}
        bounces={false}
      >
        <Label className="mt-3 mb-4">
          <CompassIcon width={16} height={16} />

          <Text className="text-caption font-semibold">Case Study</Text>
        </Label>

        <Text className="text-body-2 mb-3">{content.scenario.replace(/\\n/g, '\n')}</Text>

        <View className="w-full relative mb-10">
          <Input
            multiline
            numberOfLines={5}
            value={state.answer}
            onChangeText={(text) => setState((prev: any) => ({ ...prev, answer: text }))}
            placeholder="Your answer"
            editable={!state.submitted}
            className="flex-1"
          />

          <TouchableOpacity
            onPress={recorderState.isRecording ? stopRecording : startRecording}
            className="absolute bottom-2 right-2 p-2 bg-primary rounded-full"
            disabled={state.submitted || isTranscribing}
          >
            {isTranscribing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <IconSymbol
                name={recorderState.isRecording ? 'stop.fill' : 'mic.fill'}
                size={24}
                color="#ffffff"
              />
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={{ padding: insets.bottom + 16 }}>
        <Button
          size="big"
          onPress={handleSubmit}
          disabled={!state.answer?.trim() || state.submitted}
        >
          Submit answer
        </Button>
      </View>

      {showAnalyzingOverlay && (
        <View className="absolute inset-0 bg-bg justify-center items-center p-4">
          <ActivityIndicator size="large" color="#0A0A0A" className="mb-4" />

          <Text className="text-body-1 text-text text-center">Analysing your answer...</Text>
        </View>
      )}

      {showResultOverlay && (
        <View className="absolute inset-0 bg-bg p-4 pt-[56px]">
          <Label className="mb-4 self-start">
            <CompassIcon width={16} height={16} />

            <Text className="text-[14px] font-title font-semibold text-text uppercase">
              Case Study
            </Text>
          </Label>

          <View className="flex-1 w-full bg-white rounded-xl p-4">
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              <Text className="text-body-1 text-text leading-relaxed">
                {state.evaluation?.feedback || 'Evaluation complete.'}
              </Text>
            </ScrollView>
          </View>

          <View className="mt-4 flex-row gap-3 w-full">
            <Button
              size="big"
              onPress={handleTryAgain}
              className="flex-1 bg-[#CCD7F1]"
              textClassName="text-text"
            >
              Try again
            </Button>

            <Button size="big" onPress={onNext} className="flex-1">
              Complete
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}
