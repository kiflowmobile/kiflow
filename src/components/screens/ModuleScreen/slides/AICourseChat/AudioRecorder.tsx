import { Icon } from '@/src/components/ui/icon';
import { sendAudioToGemini } from '@/src/services/geminiAudio';
import { useAnalyticsStore } from '@/src/stores/analyticsStore';
import { Mic, Square } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AudioRecorderProps {
  onAudioProcessed: (text: string) => void;
  disabled: boolean;
  id: string;  
  slideId?: string;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onAudioProcessed, disabled , id, slideId}) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const analyticsStore = useAnalyticsStore.getState();


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
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleToggleRecording}
        disabled={disabled || isProcessing}
        style={[
          styles.audioButton,
          isRecording && styles.recordingButton,
          isProcessing && styles.processingButton,
          (disabled || isProcessing) && styles.disabledButton,
        ]}
      >
        <Icon 
          as={isRecording ? Square : Mic} 
          size={20} 
          color={isRecording ? '#ffffff' : '#0f172a'} 
        />
        <Text style={[
          styles.buttonText,
          isRecording && styles.recordingText,
          isProcessing && styles.processingText,
        ]}>
          {isProcessing ? 'Обробка...' : isRecording ? 'Зупинити' : 'Записати'}
        </Text>
      </TouchableOpacity>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

export default AudioRecorder;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  recordingButton: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  processingButton: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  disabledButton: {
    backgroundColor: '#e2e8f0',
    borderColor: '#cbd5e1',
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
  },
  recordingText: {
    color: '#ffffff',
  },
  processingText: {
    color: '#ffffff',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    textAlign: 'center',
  },
});
