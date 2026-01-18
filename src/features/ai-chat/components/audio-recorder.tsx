import React, { useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Mic, Square } from 'lucide-react-native';

import { sendAudioToGemini } from '../api/send-audio';
import { useAnalytics } from '@/features/analytics';
import { Icon } from '@/shared/ui';

interface AudioRecorderProps {
  onAudioProcessed: (text: string) => void;
  disabled: boolean;
  id: string;  
  slideId?: string;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onAudioProcessed, disabled , id, slideId}) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const analyticsStore = useAnalytics();


  const handleStartRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new window.MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        try {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const arrayBuffer = await blob.arrayBuffer();
          const audioBytes = new Uint8Array(arrayBuffer);
          const response = await sendAudioToGemini(audioBytes, '');
          onAudioProcessed(response);
        } catch (err) {
          setError('Не вдалося обробити аудіо');
          console.error('Audio processing error:', err);
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError('Доступ до мікрофона заборонено або не підтримується');
      console.error('Microphone access error:', err);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleToggleRecording = () => {
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

  return (
    <View className="items-center gap-2">
      <TouchableOpacity
        onPress={handleToggleRecording}
        disabled={disabled || isProcessing}
        className={`flex-row items-center gap-2 px-4 py-2 rounded-lg border ${
          isRecording
            ? 'bg-red-600 border-red-600'
            : isProcessing
              ? 'bg-amber-500 border-amber-500'
              : disabled || isProcessing
                ? 'bg-gray-200 border-gray-300 opacity-60'
                : 'bg-gray-100 border-gray-300'
        }`}
      >
        <Icon
          as={isRecording ? Square : Mic}
          size={20}
          color={isRecording || isProcessing ? '#ffffff' : '#0f172a'}
        />
        <Text
          className={`text-sm font-medium ${
            isRecording || isProcessing ? 'text-white' : 'text-slate-900'
          }`}
        >
          {isProcessing ? 'Обробка...' : isRecording ? 'Зупинити' : 'Записати'}
        </Text>
      </TouchableOpacity>

      {error && <Text className="text-red-600 text-xs text-center">{error}</Text>}
    </View>
  );
};

