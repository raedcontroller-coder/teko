import { useState, useRef } from 'react';
import { Audio } from 'expo-av';
import axios from 'axios';

// Para dispositivo físico, use o IP local da máquina.
const API_URL = 'http://10.161.127.80:3002';

export interface ValidationResponse {
  valid: boolean;
  transcription: string;
  message?: string;
  error?: string;
}

// Configuração de gravação otimizada: Mono, 44.1kHz, AAC
const RECORDING_OPTIONS: Audio.RecordingOptions = {
  isMeteringEnabled: false,
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: '.m4a',
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const recordingRef = useRef<Audio.Recording | null>(null);
  // isWarmRef: true se permissão e modo de áudio já foram configurados
  // Não criamos o Recording object no warm-up — expo-av não suporta "standby"
  // e gera arquivos corrompidos quando pausamos imediatamente após createAsync.
  const isWarmRef = useRef<boolean>(false);
  const isPreparingRef = useRef<boolean>(false);

  /**
   * warmUpRecording: Pré-obtém permissão e configura o modo de áudio do SO.
   * Essas operações são as mais lentas. Fazê-las com antecedência reduz
   * o delay percebido quando o usuário pressiona o botão.
   * NÃO cria o objeto Recording aqui para evitar arquivos corrompidos.
   */
  const warmUpRecording = async () => {
    if (isPreparingRef.current || isWarmRef.current) return;

    try {
      isPreparingRef.current = true;

      // Descartar qualquer gravação anterior pendente
      if (recordingRef.current) {
        try { await recordingRef.current.stopAndUnloadAsync(); } catch (e) {}
        recordingRef.current = null;
      }

      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        console.warn('[AudioRecorder] Permissão de microfone negada no warm-up.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      isWarmRef.current = true;
      console.log('[AudioRecorder] Warm-up OK (permissão + modo de áudio prontos)');

    } catch (err) {
      console.error('[AudioRecorder] Falha no warm-up:', err);
    } finally {
      isPreparingRef.current = false;
    }
  };

  /**
   * startRecording: Inicia a gravação de áudio.
   * Se warm-up foi feito, pula permissão e configura o modo (já prontos).
   * Chama createAsync() que agora é a única operação pesada restante.
   */
  const startRecording = async () => {
    if (isRecording || isPreparingRef.current) return;

    try {
      isPreparingRef.current = true;

      // Descartar gravação anterior se existir
      if (recordingRef.current) {
        try { await recordingRef.current.stopAndUnloadAsync(); } catch (e) {}
        recordingRef.current = null;
      }

      // Se não aqueceu antes, configura agora
      if (!isWarmRef.current) {
        const permission = await Audio.requestPermissionsAsync();
        if (permission.status !== 'granted') {
          alert('Permissão de microfone negada!');
          return;
        }
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      }

      // Cria e inicia a gravação (única operação pesada no fluxo aquecido)
      const { recording } = await Audio.Recording.createAsync(RECORDING_OPTIONS);
      recordingRef.current = recording;
      isWarmRef.current = false; // Consomeu o warm-up
      setIsRecording(true);
      console.log('[AudioRecorder] Gravação iniciada');

    } catch (err) {
      console.error('[AudioRecorder] Falha ao iniciar gravação:', err);
      recordingRef.current = null;
    } finally {
      isPreparingRef.current = false;
    }
  };

  /**
   * stopRecordingAndValidate: Para a gravação, envia o áudio para a API.
   * category vem PRIMEIRO no FormData para garantir parsing correto no backend.
   */
  const stopRecordingAndValidate = async (category: string, usedWords: string[] = []): Promise<ValidationResponse | null> => {
    if (!recordingRef.current || !isRecording) return null;

    try {
      setIsRecording(false);
      setIsValidating(true);

      const uri = recordingRef.current.getURI();
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (e) {}
      recordingRef.current = null;

      if (!uri) {
        return { valid: false, transcription: '', message: 'Áudio muito curto. Segure o botão e fale!' };
      }

      // category e usedWords PRIMEIRO no FormData — garante que o backend leia antes do arquivo
      const formData = new FormData();
      formData.append('category', category);
      formData.append('usedWords', JSON.stringify(usedWords));
      formData.append('audio', {
        uri,
        name: 'audio.m4a',
        type: 'audio/m4a',
      } as any);

      const response = await axios.post<ValidationResponse>(
        `${API_URL}/api/bomba/validate`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      return response.data;

    } catch (err: any) {
      console.error('[AudioRecorder] Falha na validação:', err.message);
      // Extrai mensagem amigável do backend se disponível (mesmo em 500)
      const backendMessage = err.response?.data?.message;
      return {
        valid: false,
        transcription: '',
        error: err.message,
        message: backendMessage || 'Algo deu errado. Tenta de novo!',
      };
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * cancelRecording: Descarta uma gravação sem enviar para a API.
   * Também reseta todos os estados para garantir que o hook fique limpo para uma nova rodada.
   */
  const cancelRecording = async () => {
    if (recordingRef.current) {
      try { await recordingRef.current.stopAndUnloadAsync(); } catch (e) {}
      recordingRef.current = null;
    }
    isWarmRef.current = false;
    setIsRecording(false);
    setIsValidating(false);
  };

  return {
    isRecording,
    isValidating,
    warmUpRecording,
    startRecording,
    stopRecordingAndValidate,
    cancelRecording,
  };
};
