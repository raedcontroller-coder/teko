import { useState, useRef } from 'react';
import { Audio } from 'expo-av';
import axios from 'axios';
import { Platform } from 'react-native';

// For Android emulator, localhost is 10.0.2.2. For iOS it is localhost.
// Replace with your local IP if testing on a physical device.
const API_URL = 'http://172.17.140.122:3000';

export interface ValidationResponse {
  valid: boolean;
  transcription: string;
  error?: string;
}

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        alert('Permissão de microfone negada!');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (err) {
      console.error('Falha ao iniciar gravação:', err);
    }
  };

  const stopRecordingAndValidate = async (category: string): Promise<ValidationResponse | null> => {
    if (!recordingRef.current) return null;
    
    try {
      setIsRecording(false);
      setIsValidating(true);
      
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) throw new Error('Falha ao obter URI do áudio');

      // Preparar arquivo para envio
      const formData = new FormData();
      formData.append('audio', {
        uri,
        name: 'audio.m4a',
        type: 'audio/m4a',
      } as any);
      formData.append('category', category);

      const response = await axios.post<ValidationResponse>(`${API_URL}/api/bomba/validate`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (err: any) {
      console.error('Falha na validação:', err.message);
      return { valid: false, transcription: '', error: err.message };
    } finally {
      setIsValidating(false);
    }
  };

  return {
    isRecording,
    isValidating,
    startRecording,
    stopRecordingAndValidate,
  };
};
